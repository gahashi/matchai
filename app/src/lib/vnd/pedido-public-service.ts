import { randomInt } from "node:crypto";

import { prisma } from "@/lib/prisma";
import type {
    MercadoPagoPaymentResponse,
} from "@/lib/fin/mercado-pago";

const ORDER_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ORDER_CODE_LENGTH = 6;

export type CheckoutValidatedItem = {
    produto_id: number;
    variacao_id: number | null;
    quantidade: number;
    disponivel: boolean;
    motivo: string | null;
    produto: {
        codigo: string;
        nome: string;
        preco_normal: number;
        preco_aplicado: number;
        socio_aplicado: boolean;
    } | null;
    variacao?: {
        id: number;
        nome: string;
    } | null;
    preco_tabela?: number;
    preco_unitario?: number;
    subtotal?: number;
    socio_aplicado?: boolean;
};

export type CheckoutCustomer = {
    nome: string;
    email: string;
    telefone: string;
};

export type CheckoutPaymentMethod = "pix" | "cartao";

function roundMoney(value: number) {
    return Number(value.toFixed(2));
}

function buildOrderCode() {
    let code = "";

    for (let index = 0; index < ORDER_CODE_LENGTH; index += 1) {
        code += ORDER_CODE_ALPHABET[
            randomInt(0, ORDER_CODE_ALPHABET.length)
        ];
    }

    return code;
}

async function generateUniqueOrderCode() {
    for (let attempt = 0; attempt < 12; attempt += 1) {
        const codigo = buildOrderCode();
        const existing = await prisma.vndPedido.findUnique({
            where: { codigo },
            select: { id: true },
        });

        if (!existing) return codigo;
    }

    throw new Error("Não foi possível gerar o código do pedido.");
}

function mapPaymentStatus(
    mercadoPagoStatus: string | null | undefined,
) {
    switch (mercadoPagoStatus) {
        case "approved":
            return "aprovado";
        case "rejected":
            return "recusado";
        case "cancelled":
            return "cancelado";
        case "refunded":
        case "charged_back":
            return "estornado";
        case "expired":
            return "expirado";
        default:
            return "pendente";
    }
}

function mapOrderStatus(
    mercadoPagoStatus: string | null | undefined,
) {
    switch (mercadoPagoStatus) {
        case "approved":
            return "confirmado";
        case "rejected":
        case "cancelled":
        case "expired":
        case "refunded":
        case "charged_back":
            return "cancelado";
        default:
            return "aguardando_pagamento";
    }
}

function getPaymentFinancials(
    payment: MercadoPagoPaymentResponse,
    orderTotal: number,
) {
    if (payment.status !== "approved") {
        return {
            valorLiquido: null,
            taxaGateway: null,
        };
    }

    const rawNet =
        payment.transaction_details?.net_received_amount;

    if (typeof rawNet !== "number" || !Number.isFinite(rawNet)) {
        return {
            valorLiquido: null,
            taxaGateway: null,
        };
    }

    const valorLiquido = roundMoney(rawNet);
    const taxaGateway = roundMoney(
        Math.max(orderTotal - valorLiquido, 0),
    );

    return {
        valorLiquido,
        taxaGateway,
    };
}

class PedidoPublicService {
    async getCheckoutCustomer(sysUsuarioId: number) {
        return prisma.sysUsuario.findFirst({
            where: {
                id: sysUsuarioId,
                ativo: 1,
                deleted_at: null,
            },
            select: {
                id: true,
                nome: true,
                email: true,
                telefone: true,
                documento: true,
            },
        });
    }

    async getPaymentAttemptByIdempotencyKey(
        idempotencyKey: string,
    ) {
        return prisma.finPagamento.findUnique({
            where: {
                idempotency_key: idempotencyKey,
            },
            select: {
                id: true,
                valor: true,
                external_id: true,
                external_reference: true,
                qr_code_text: true,
                payment_url: true,
                fin_pagamento_status: {
                    select: {
                        codigo: true,
                    },
                },
                fin_pagamento_metodo: {
                    select: {
                        codigo: true,
                    },
                },
                vnd_pedido: {
                    select: {
                        id: true,
                        codigo: true,
                        valor_total: true,
                    },
                },
            },
        });
    }

    async createPaymentAttempt(input: {
        sysUsuarioId: number | null;
        customer: CheckoutCustomer;
        items: CheckoutValidatedItem[];
        method: CheckoutPaymentMethod;
        idempotencyKey: string;
    }) {
        const unavailable = input.items.find(
            (item) => !item.disponivel,
        );

        if (unavailable) {
            throw new Error(
                unavailable.motivo ?? "Existe um item indisponível no carrinho.",
            );
        }

        if (input.items.length === 0) {
            throw new Error("O carrinho está vazio.");
        }

        const total = roundMoney(
            input.items.reduce(
                (sum, item) => sum + (item.subtotal ?? 0),
                0,
            ),
        );

        if (total <= 0) {
            throw new Error("O total do pedido é inválido.");
        }

        const [pedidoStatus, entregaTipo, pagamentoStatus, pagamentoMetodo] =
            await Promise.all([
                prisma.vndPedidoStatus.findUnique({
                    where: { codigo: "aguardando_pagamento" },
                    select: { id: true },
                }),
                prisma.vndEntregaTipo.findUnique({
                    where: { codigo: "retirada" },
                    select: { id: true },
                }),
                prisma.finPagamentoStatus.findUnique({
                    where: { codigo: "pendente" },
                    select: { id: true },
                }),
                prisma.finPagamentoMetodo.findUnique({
                    where: { codigo: input.method },
                    select: { id: true },
                }),
            ]);

        if (!pedidoStatus) {
            throw new Error(
                "Status aguardando_pagamento não encontrado. Execute o seed.",
            );
        }

        if (!entregaTipo) {
            throw new Error(
                "Tipo de entrega retirada não encontrado. Execute o seed.",
            );
        }

        if (!pagamentoStatus || !pagamentoMetodo) {
            throw new Error(
                "Configuração de pagamento incompleta. Execute o seed.",
            );
        }

        const codigo = await generateUniqueOrderCode();
        const now = new Date();

        return prisma.$transaction(async (tx) => {
            const pedido = await tx.vndPedido.create({
                data: {
                    codigo,
                    sys_usuario_id: input.sysUsuarioId,
                    vnd_campanha_id: null,
                    vnd_pedido_status_id: pedidoStatus.id,
                    vnd_entrega_tipo_id: entregaTipo.id,
                    cliente_nome: input.customer.nome,
                    cliente_email: input.customer.email,
                    cliente_telefone: input.customer.telefone,
                    entrega_endereco: null,
                    retirada_local: null,
                    observacao_cliente: null,
                    valor_produtos: total,
                    valor_desconto: 0,
                    valor_frete: 0,
                    valor_acrescimo: 0,
                    valor_total: total,
                    created_at: now,
                    updated_at: now,
                },
                select: {
                    id: true,
                    codigo: true,
                    valor_total: true,
                },
            });

            await tx.vndPedidoItem.createMany({
                data: input.items.map((item) => ({
                    vnd_pedido_id: pedido.id,
                    prd_produto_id: item.produto_id,
                    prd_produto_variacao_id:
                        item.variacao_id,
                    vnd_campanha_id: null,
                    produto_codigo_snapshot:
                        item.produto?.codigo ?? String(item.produto_id),
                    produto_nome_snapshot:
                        item.produto?.nome ?? "Produto",
                    variacao_snapshot:
                        item.variacao?.nome ?? null,
                    quantidade: item.quantidade,
                    preco_tabela:
                        item.preco_tabela ??
                        item.produto?.preco_normal ??
                        0,
                    preco_unitario:
                        item.preco_unitario ??
                        item.produto?.preco_aplicado ??
                        0,
                    valor_desconto: 0,
                    subtotal: item.subtotal ?? 0,
                    socio_aplicado:
                        item.socio_aplicado ||
                        item.produto?.socio_aplicado
                            ? 1
                            : 0,
                    personalizacao_nome: null,
                    personalizacao_numero: null,
                    observacao: null,
                    created_at: now,
                })),
            });

            await tx.vndPedidoHistorico.create({
                data: {
                    vnd_pedido_id: pedido.id,
                    vnd_pedido_status_id: pedidoStatus.id,
                    sys_usuario_id: input.sysUsuarioId,
                    observacao: "Pedido criado pelo checkout.",
                    created_at: now,
                },
            });

            const pagamento = await tx.finPagamento.create({
                data: {
                    vnd_pedido_id: pedido.id,
                    fin_pagamento_status_id: pagamentoStatus.id,
                    fin_pagamento_metodo_id: pagamentoMetodo.id,
                    valor: total,
                    taxa_gateway: null,
                    valor_liquido: null,
                    provider: "mercado_pago",
                    external_id: null,
                    external_reference: pedido.codigo,
                    idempotency_key: input.idempotencyKey,
                    qr_code_text: null,
                    payment_url: null,
                    created_at: now,
                    updated_at: now,
                },
                select: {
                    id: true,
                },
            });

            return {
                pedido,
                pagamento,
                total,
            };
        });
    }

    async applyMercadoPagoPayment(input: {
        finPagamentoId: number;
        payment: MercadoPagoPaymentResponse;
        qrCodeText: string | null;
        paymentUrl: string | null;
    }) {
        const pagamento = await prisma.finPagamento.findUnique({
            where: { id: input.finPagamentoId },
            select: {
                id: true,
                vnd_pedido_id: true,
                valor: true,
                fin_pagamento_status: {
                    select: { codigo: true },
                },
                vnd_pedido: {
                    select: {
                        id: true,
                        codigo: true,
                        vnd_pedido_status: {
                            select: { codigo: true },
                        },
                    },
                },
            },
        });

        if (!pagamento) {
            throw new Error("Pagamento local não encontrado.");
        }

        const finStatusCode = mapPaymentStatus(
            input.payment.status,
        );
        const pedidoStatusCode = mapOrderStatus(
            input.payment.status,
        );

        const [finStatus, pedidoStatus] = await Promise.all([
            prisma.finPagamentoStatus.findUnique({
                where: { codigo: finStatusCode },
                select: { id: true },
            }),
            prisma.vndPedidoStatus.findUnique({
                where: { codigo: pedidoStatusCode },
                select: { id: true },
            }),
        ]);

        if (!finStatus || !pedidoStatus) {
            throw new Error(
                "Mapeamento de status de pagamento incompleto.",
            );
        }

        const now = new Date();
        const orderTotal = Number(pagamento.valor);
        const financials = getPaymentFinancials(
            input.payment,
            orderTotal,
        );

        await prisma.$transaction(async (tx) => {
            await tx.finPagamento.update({
                where: { id: pagamento.id },
                data: {
                    fin_pagamento_status_id: finStatus.id,
                    external_id:
                        input.payment.id !== undefined
                            ? String(input.payment.id)
                            : undefined,
                    external_reference:
                        input.payment.external_reference ??
                        pagamento.vnd_pedido.codigo,
                    qr_code_text: input.qrCodeText,
                    payment_url: input.paymentUrl,
                    valor_liquido: financials.valorLiquido,
                    taxa_gateway: financials.taxaGateway,
                    aprovado_at:
                        finStatusCode === "aprovado"
                            ? now
                            : null,
                    expirado_at:
                        finStatusCode === "expirado"
                            ? now
                            : null,
                    cancelado_at:
                        finStatusCode === "cancelado"
                            ? now
                            : null,
                    updated_at: now,
                },
            });

            if (
                pagamento.vnd_pedido.vnd_pedido_status.codigo !==
                pedidoStatusCode
            ) {
                await tx.vndPedido.update({
                    where: { id: pagamento.vnd_pedido_id },
                    data: {
                        vnd_pedido_status_id: pedidoStatus.id,
                        cancelado_at:
                            pedidoStatusCode === "cancelado"
                                ? now
                                : null,
                        updated_at: now,
                    },
                });

                await tx.vndPedidoHistorico.create({
                    data: {
                        vnd_pedido_id: pagamento.vnd_pedido_id,
                        vnd_pedido_status_id: pedidoStatus.id,
                        sys_usuario_id: null,
                        observacao:
                            input.payment.status_detail
                                ? `Mercado Pago: ${input.payment.status_detail}`
                                : "Status atualizado pelo Mercado Pago.",
                        created_at: now,
                    },
                });
            }
        });

        return {
            finStatusCode,
            pedidoStatusCode,
        };
    }

    async findPaymentForPublicStatus(input: {
        orderCode: string;
        externalPaymentId: string;
    }) {
        return prisma.finPagamento.findFirst({
            where: {
                provider: "mercado_pago",
                external_id: input.externalPaymentId,
                vnd_pedido: {
                    codigo: input.orderCode,
                },
            },
            select: {
                id: true,
            },
        });
    }

    async applyMercadoPagoWebhook(
        payment: MercadoPagoPaymentResponse,
    ) {
        const externalId =
            payment.id !== undefined
                ? String(payment.id)
                : null;

        let localPayment = externalId
            ? await prisma.finPagamento.findFirst({
                where: {
                    provider: "mercado_pago",
                    external_id: externalId,
                },
                select: { id: true },
            })
            : null;

        if (!localPayment && payment.external_reference) {
            localPayment = await prisma.finPagamento.findFirst({
                where: {
                    provider: "mercado_pago",
                    vnd_pedido: {
                        codigo: payment.external_reference,
                    },
                },
                orderBy: { id: "desc" },
                select: { id: true },
            });
        }

        if (!localPayment) {
            return {
                updated: false,
            };
        }

        const transactionData =
            payment.point_of_interaction?.transaction_data;

        await this.applyMercadoPagoPayment({
            finPagamentoId: localPayment.id,
            payment,
            qrCodeText: transactionData?.qr_code ?? null,
            paymentUrl: transactionData?.ticket_url ?? null,
        });

        return {
            updated: true,
        };
    }
}

export const pedidoPublicService = new PedidoPublicService();
