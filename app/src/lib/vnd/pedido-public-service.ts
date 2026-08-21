import { randomInt } from "node:crypto";

import { prisma } from "@/lib/prisma";
import type {
    MercadoPagoPaymentResponse,
} from "@/lib/fin/mercado-pago";

const ORDER_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ORDER_CODE_LENGTH = 6;

export type CheckoutValidatedCampo = {
    campo_id: number;
    codigo: string;
    nome: string;
    tipo: "texto" | "numero";
    valor: string;
    valor_normalizado: string;
    valor_unico: boolean;
};

export type CheckoutValidatedComponente = {
    componente_id: number;
    produto_id: number;
    produto_codigo: string;
    produto_nome: string;
    quantidade_por_kit: number;
    variacao_id: number | null;
    variacao_nome: string | null;
    campos: CheckoutValidatedCampo[];
};

export type CheckoutValidatedItem = {
    line_key: string;
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
        modalidade_venda: "estoque" | "pre_venda";
        previsao_entrega: string | null;
    } | null;
    variacao?: {
        id: number;
        nome: string;
    } | null;
    campos?: CheckoutValidatedCampo[];
    componentes?: CheckoutValidatedComponente[];
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


export class CheckoutStockError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "CheckoutStockError";
    }
}

function getStockReservationMinutes() {
    const configured = Number(
        process.env.STOCK_RESERVATION_MINUTES,
    );

    if (
        Number.isInteger(configured) &&
        configured > 0
    ) {
        return configured;
    }

    return 30;
}

/*
 * expira_at é mantido como referência da janela local de reserva.
 * Enquanto a expiração do pagamento não estiver sincronizada com o
 * Mercado Pago, a reserva só deixa de bloquear estoque quando for
 * explicitamente consumida ou liberada por um status terminal.
 */
function getReservationExpiration(now: Date) {
    return new Date(
        now.getTime() +
        getStockReservationMinutes() *
        60_000,
    );
}

function buildPaymentExpiration(createdAt: Date) {
    return getReservationExpiration(createdAt);
}

type StockReservationInput = {
    pedidoId: number;
    pedidoItemId: number;
    pedidoItemComponenteId: number | null;
    produtoId: number;
    variacaoId: number | null;
    quantidade: number;
    expiraAt: Date;
};

async function lockStockRow(
    tx: any,
    produtoId: number,
    variacaoId: number | null,
) {
    if (variacaoId !== null) {
        await tx.$queryRawUnsafe(
            "SELECT id FROM prd_produto_variacao WHERE id = ? FOR UPDATE",
            variacaoId,
        );
        return;
    }

    await tx.$queryRawUnsafe(
        "SELECT id FROM prd_produto WHERE id = ? FOR UPDATE",
        produtoId,
    );
}

async function createStockReservation(
    tx: any,
    input: StockReservationInput,
    now: Date,
) {
    if (
        !Number.isInteger(input.quantidade) ||
        input.quantidade <= 0
    ) {
        throw new CheckoutStockError(
            "Quantidade de estoque inválida.",
        );
    }

    await lockStockRow(
        tx,
        input.produtoId,
        input.variacaoId,
    );

    const produto =
        await tx.prdProduto.findFirst({
            where: {
                id: input.produtoId,
                ativo: 1,
                deleted_at: null,
            },
            select: {
                id: true,
                nome: true,
                controla_estoque: true,
                estoque_atual: true,
            },
        });

    if (!produto) {
        throw new CheckoutStockError(
            "Produto de estoque não encontrado.",
        );
    }

    if (!produto.controla_estoque) {
        return;
    }

    let estoqueFisico: number | null =
        produto.estoque_atual;

    let variacaoNome: string | null = null;

    if (input.variacaoId !== null) {
        const variacao =
            await tx.prdProdutoVariacao.findFirst({
                where: {
                    id: input.variacaoId,
                    prd_produto_id:
                    input.produtoId,
                    ativo: 1,
                    deleted_at: null,
                },
                select: {
                    id: true,
                    nome: true,
                    estoque_atual: true,
                },
            });

        if (!variacao) {
            throw new CheckoutStockError(
                `A variação selecionada de "${produto.nome}" não está disponível.`,
            );
        }

        estoqueFisico =
            variacao.estoque_atual;
        variacaoNome = variacao.nome;
    }

    // null representa estoque sem limite físico.
    if (estoqueFisico === null) {
        return;
    }

    const reservado =
        await tx.vndEstoqueReserva.aggregate({
            where: {
                prd_produto_id:
                input.produtoId,
                prd_produto_variacao_id:
                input.variacaoId,
                consumida_at: null,
                liberada_at: null,
            },
            _sum: {
                quantidade: true,
            },
        });

    const quantidadeReservada =
        reservado._sum.quantidade ?? 0;

    const disponivel =
        estoqueFisico -
        quantidadeReservada;

    if (
        disponivel <
        input.quantidade
    ) {
        const nomeEstoque =
            variacaoNome
                ? `${produto.nome} · ${variacaoNome}`
                : produto.nome;

        throw new CheckoutStockError(
            disponivel > 0
                ? `Estoque disponível de "${nomeEstoque}": ${disponivel}.`
                : `"${nomeEstoque}" está temporariamente sem estoque disponível.`,
        );
    }

    await tx.vndEstoqueReserva.create({
        data: {
            vnd_pedido_id:
            input.pedidoId,
            vnd_pedido_item_id:
            input.pedidoItemId,
            vnd_pedido_item_componente_id:
            input.pedidoItemComponenteId,
            prd_produto_id:
            input.produtoId,
            prd_produto_variacao_id:
            input.variacaoId,
            quantidade:
            input.quantidade,
            expira_at:
            input.expiraAt,
            consumida_at: null,
            liberada_at: null,
            created_at: now,
            updated_at: now,
        },
    });
}

async function consumeOrderReservations(
    tx: any,
    pedidoId: number,
    now: Date,
) {
    const reservas =
        await tx.vndEstoqueReserva.findMany({
            where: {
                vnd_pedido_id: pedidoId,
                consumida_at: null,
                liberada_at: null,
            },
            orderBy: {
                id: "asc",
            },
        });

    for (const reserva of reservas) {
        await lockStockRow(
            tx,
            reserva.prd_produto_id,
            reserva.prd_produto_variacao_id,
        );

        const updateResult =
            reserva.prd_produto_variacao_id !==
            null
                ? await tx.prdProdutoVariacao.updateMany(
                    {
                        where: {
                            id: reserva.prd_produto_variacao_id,
                            estoque_atual: {
                                gte: reserva.quantidade,
                            },
                        },
                        data: {
                            estoque_atual: {
                                decrement:
                                reserva.quantidade,
                            },
                            updated_at: now,
                        },
                    },
                )
                : await tx.prdProduto.updateMany(
                    {
                        where: {
                            id: reserva.prd_produto_id,
                            estoque_atual: {
                                gte: reserva.quantidade,
                            },
                        },
                        data: {
                            estoque_atual: {
                                decrement:
                                reserva.quantidade,
                            },
                            updated_at: now,
                        },
                    },
                );

        if (updateResult.count !== 1) {
            throw new CheckoutStockError(
                "O estoque reservado ficou inconsistente antes da confirmação do pagamento.",
            );
        }

        await tx.vndEstoqueReserva.update({
            where: {
                id: reserva.id,
            },
            data: {
                consumida_at: now,
                updated_at: now,
            },
        });
    }
}

async function releaseOrderReservations(
    tx: any,
    pedidoId: number,
    now: Date,
) {
    await tx.vndEstoqueReserva.updateMany({
        where: {
            vnd_pedido_id: pedidoId,
            consumida_at: null,
            liberada_at: null,
        },
        data: {
            liberada_at: now,
            updated_at: now,
        },
    });
}

function normalizePublicPhone(
    value: string,
) {
    const numeros =
        value.replace(/\D/g, "");

    if (
        numeros.length === 13 &&
        numeros.startsWith("55")
    ) {
        return numeros.slice(2);
    }

    return numeros;
}

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
    getPaymentExpiration(createdAt: Date) {
        return buildPaymentExpiration(createdAt);
    }

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
                created_at: true,
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
                        vnd_estoque_reservas: {
                            where: {
                                consumida_at: null,
                                liberada_at: null,
                            },
                            orderBy: {
                                expira_at: "asc",
                            },
                            take: 1,
                            select: {
                                expira_at: true,
                            },
                        },
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
        const reservaExpiraAt =
            getReservationExpiration(now);

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

            for (const item of input.items) {
                const pedidoItem =
                    await tx.vndPedidoItem.create({
                        data: {
                            vnd_pedido_id: pedido.id,
                            prd_produto_id:
                            item.produto_id,
                            prd_produto_variacao_id:
                            item.variacao_id,
                            vnd_campanha_id: null,
                            produto_codigo_snapshot:
                                item.produto?.codigo ??
                                String(item.produto_id),
                            produto_nome_snapshot:
                                item.produto?.nome ??
                                "Produto",
                            variacao_snapshot:
                                item.variacao?.nome ??
                                null,
                            previsao_entrega_snapshot:
                                item.produto?.previsao_entrega
                                    ? new Date(
                                        `${item.produto.previsao_entrega}T12:00:00`,
                                    )
                                    : null,
                            quantidade:
                            item.quantidade,
                            preco_tabela:
                                item.preco_tabela ??
                                item.produto
                                    ?.preco_normal ??
                                0,
                            preco_unitario:
                                item.preco_unitario ??
                                item.produto
                                    ?.preco_aplicado ??
                                0,
                            valor_desconto: 0,
                            subtotal:
                                item.subtotal ?? 0,
                            socio_aplicado:
                                item.socio_aplicado ||
                                item.produto
                                    ?.socio_aplicado
                                    ? 1
                                    : 0,

                            // Campos legados preservados até o novo
                            // modelo de personalização substituir todos
                            // os consumidores antigos.
                            personalizacao_nome: null,
                            personalizacao_numero: null,

                            observacao: null,
                            created_at: now,
                        },
                        select: {
                            id: true,
                        },
                    });

                const itemCampos =
                    item.campos ?? [];

                if (itemCampos.length > 0) {
                    await tx.vndPedidoItemCampo.createMany({
                        data: itemCampos.map(
                            (campo) => ({
                                vnd_pedido_item_id:
                                pedidoItem.id,
                                vnd_pedido_item_componente_id:
                                    null,
                                prd_produto_campo_id:
                                campo.campo_id,
                                campo_codigo_snapshot:
                                campo.codigo,
                                campo_nome_snapshot:
                                campo.nome,
                                campo_tipo_snapshot:
                                campo.tipo,
                                valor: campo.valor,
                                valor_normalizado:
                                campo.valor_normalizado,
                                created_at: now,
                            }),
                        ),
                    });
                }

                const componentes =
                    item.componentes ?? [];

                // Produto normal reserva o próprio estoque.
                // Kit reserva somente os componentes reais.
                const isPreVenda =
                    item.produto?.modalidade_venda === "pre_venda";

                if (componentes.length === 0 && !isPreVenda) {
                    await createStockReservation(
                        tx,
                        {
                            pedidoId: pedido.id,
                            pedidoItemId:
                            pedidoItem.id,
                            pedidoItemComponenteId:
                                null,
                            produtoId:
                            item.produto_id,
                            variacaoId:
                            item.variacao_id,
                            quantidade:
                            item.quantidade,
                            expiraAt:
                            reservaExpiraAt,
                        },
                        now,
                    );
                }

                for (const componente of
                    componentes) {
                    const pedidoItemComponente =
                        await tx.vndPedidoItemComponente.create(
                            {
                                data: {
                                    vnd_pedido_item_id:
                                    pedidoItem.id,
                                    prd_produto_id:
                                    componente.produto_id,
                                    prd_produto_variacao_id:
                                    componente.variacao_id,
                                    produto_codigo_snapshot:
                                    componente.produto_codigo,
                                    produto_nome_snapshot:
                                    componente.produto_nome,
                                    variacao_snapshot:
                                    componente.variacao_nome,
                                    quantidade:
                                    componente.quantidade_por_kit,
                                    created_at: now,
                                },
                                select: {
                                    id: true,
                                },
                            },
                        );

                    if (
                        componente.campos.length > 0
                    ) {
                        await tx.vndPedidoItemCampo.createMany(
                            {
                                data: componente.campos.map(
                                    (campo) => ({
                                        vnd_pedido_item_id:
                                        pedidoItem.id,
                                        vnd_pedido_item_componente_id:
                                        pedidoItemComponente.id,
                                        prd_produto_campo_id:
                                        campo.campo_id,
                                        campo_codigo_snapshot:
                                        campo.codigo,
                                        campo_nome_snapshot:
                                        campo.nome,
                                        campo_tipo_snapshot:
                                        campo.tipo,
                                        valor:
                                        campo.valor,
                                        valor_normalizado:
                                        campo.valor_normalizado,
                                        created_at: now,
                                    }),
                                ),
                            },
                        );
                    }

                    if (!isPreVenda) {
                        await createStockReservation(
                            tx,
                            {
                                pedidoId: pedido.id,
                                pedidoItemId:
                                pedidoItem.id,
                                pedidoItemComponenteId:
                                pedidoItemComponente.id,
                                produtoId:
                                componente.produto_id,
                                variacaoId:
                                componente.variacao_id,
                                quantidade:
                                    item.quantidade *
                                    componente.quantidade_por_kit,
                                expiraAt:
                                reservaExpiraAt,
                            },
                            now,
                        );
                    }
                }
            }

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
                reservaExpiraAt,
                pagamentoExpiraAt: reservaExpiraAt,
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
            if (finStatusCode === "aprovado") {
                await consumeOrderReservations(
                    tx,
                    pagamento.vnd_pedido_id,
                    now,
                );
            } else if (
                finStatusCode === "recusado" ||
                finStatusCode === "cancelado" ||
                finStatusCode === "expirado"
            ) {
                await releaseOrderReservations(
                    tx,
                    pagamento.vnd_pedido_id,
                    now,
                );
            }

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

    async findPublicOrderByCodeAndPhone(
        input: {
            codigo: string;
            telefone: string;
        },
    ) {
        const codigo =
            input.codigo
                .trim()
                .toUpperCase();

        const telefone =
            normalizePublicPhone(
                input.telefone,
            );

        if (
            !codigo ||
            telefone.length < 10 ||
            telefone.length > 11
        ) {
            return null;
        }

        const pedido =
            await prisma.vndPedido.findUnique({
                where: {
                    codigo,
                },

                select: {
                    codigo: true,

                    cliente_nome: true,
                    cliente_telefone: true,

                    valor_total: true,

                    created_at: true,
                    concluido_at: true,
                    cancelado_at: true,

                    vnd_pedido_status: {
                        select: {
                            codigo: true,
                            descricao: true,
                            color: true,
                            icon: true,
                        },
                    },

                    vnd_entrega_tipo: {
                        select: {
                            codigo: true,
                            descricao: true,
                        },
                    },

                    vnd_pedido_itens: {
                        orderBy: {
                            id: "asc",
                        },

                        select: {
                            id: true,

                            produto_nome_snapshot:
                                true,

                            variacao_snapshot:
                                true,

                            quantidade: true,

                            previsao_entrega_snapshot:
                                true,

                            vnd_pedido_item_componentes:
                                {
                                    orderBy: {
                                        id: "asc",
                                    },

                                    select: {
                                        id: true,

                                        produto_nome_snapshot:
                                            true,

                                        variacao_snapshot:
                                            true,

                                        quantidade:
                                            true,
                                    },
                                },
                        },
                    },

                    vnd_pedido_historicos: {
                        orderBy: [
                            {
                                created_at:
                                    "asc",
                            },
                            {
                                id: "asc",
                            },
                        ],

                        select: {
                            id: true,
                            created_at: true,

                            vnd_pedido_status: {
                                select: {
                                    codigo: true,
                                    descricao: true,
                                    color: true,
                                    icon: true,
                                },
                            },
                        },
                    },
                },
            });

        if (!pedido) {
            return null;
        }

        const telefonePedido =
            normalizePublicPhone(
                pedido.cliente_telefone,
            );

        if (
            telefonePedido !==
            telefone
        ) {
            return null;
        }

        return {
            codigo:
            pedido.codigo,

            cliente: {
                nome:
                pedido.cliente_nome,
            },

            status: {
                codigo:
                pedido
                    .vnd_pedido_status
                    .codigo,

                descricao:
                pedido
                    .vnd_pedido_status
                    .descricao,

                color:
                pedido
                    .vnd_pedido_status
                    .color,

                icon:
                pedido
                    .vnd_pedido_status
                    .icon,
            },

            entrega_tipo:
                pedido.vnd_entrega_tipo
                    ? {
                        codigo:
                        pedido
                            .vnd_entrega_tipo
                            .codigo,

                        descricao:
                        pedido
                            .vnd_entrega_tipo
                            .descricao,
                    }
                    : null,

            valor_total:
                Number(
                    pedido.valor_total,
                ),

            created_at:
            pedido.created_at,

            concluido_at:
            pedido.concluido_at,

            cancelado_at:
            pedido.cancelado_at,

            itens:
                pedido.vnd_pedido_itens.map(
                    (item) => ({
                        id:
                        item.id,

                        produto_nome:
                        item
                            .produto_nome_snapshot,

                        variacao:
                        item
                            .variacao_snapshot,

                        quantidade:
                        item.quantidade,

                        previsao_entrega:
                        item
                            .previsao_entrega_snapshot,

                        componentes:
                            item
                                .vnd_pedido_item_componentes
                                .map(
                                    (
                                        componente,
                                    ) => ({
                                        id:
                                        componente.id,

                                        produto_nome:
                                        componente
                                            .produto_nome_snapshot,

                                        variacao:
                                        componente
                                            .variacao_snapshot,

                                        quantidade:
                                        componente
                                            .quantidade,
                                    }),
                                ),
                    }),
                ),

            historico:
                pedido
                    .vnd_pedido_historicos
                    .map(
                        (
                            historico,
                        ) => ({
                            id:
                            historico.id,

                            status: {
                                codigo:
                                historico
                                    .vnd_pedido_status
                                    .codigo,

                                descricao:
                                historico
                                    .vnd_pedido_status
                                    .descricao,

                                color:
                                historico
                                    .vnd_pedido_status
                                    .color,

                                icon:
                                historico
                                    .vnd_pedido_status
                                    .icon,
                            },

                            created_at:
                            historico
                                .created_at,
                        }),
                    ),
        };
    }

    async listUserOrders(
        sysUsuarioId: number,
    ) {
        const pedidos =
            await prisma.vndPedido.findMany({
                where: {
                    sys_usuario_id:
                    sysUsuarioId,
                },

                orderBy: [
                    {
                        created_at:
                            "desc",
                    },
                    {
                        id: "desc",
                    },
                ],

                select: {
                    id: true,
                    codigo: true,
                    valor_total: true,
                    created_at: true,

                    vnd_pedido_status: {
                        select: {
                            codigo: true,
                            descricao: true,
                            color: true,
                            icon: true,
                        },
                    },

                    vnd_pedido_itens: {
                        orderBy: {
                            id: "asc",
                        },

                        select: {
                            produto_nome_snapshot:
                                true,

                            previsao_entrega_snapshot:
                                true,
                        },
                    },

                    _count: {
                        select: {
                            vnd_pedido_itens:
                                true,
                        },
                    },
                },
            });

        return pedidos.map(
            (pedido) => {
                const previsaoEntrega =
                    pedido.vnd_pedido_itens
                        .find(
                            (item) =>
                                item
                                    .previsao_entrega_snapshot !==
                                null,
                        )
                        ?.previsao_entrega_snapshot ??
                    null;

                const primeiroItem =
                    pedido
                        .vnd_pedido_itens[0] ??
                    null;

                return {
                    id:
                    pedido.id,

                    codigo:
                    pedido.codigo,

                    valor_total:
                        Number(
                            pedido.valor_total,
                        ),

                    created_at:
                    pedido.created_at,

                    status: {
                        codigo:
                        pedido
                            .vnd_pedido_status
                            .codigo,

                        descricao:
                        pedido
                            .vnd_pedido_status
                            .descricao,

                        color:
                        pedido
                            .vnd_pedido_status
                            .color,

                        icon:
                        pedido
                            .vnd_pedido_status
                            .icon,
                    },

                    quantidade_itens:
                    pedido._count
                        .vnd_pedido_itens,

                    primeiro_item:
                        primeiroItem
                            ? {
                                produto_nome:
                                primeiroItem
                                    .produto_nome_snapshot,
                            }
                            : null,

                    previsao_entrega:
                    previsaoEntrega,
                };
            },
        );
    }

    async findUserOrderByCode(
        input: {
            sysUsuarioId: number;
            codigo: string;
        },
    ) {
        const codigo =
            input.codigo
                .trim()
                .toUpperCase();

        if (!codigo) {
            return null;
        }

        const pedido =
            await prisma.vndPedido.findFirst({
                where: {
                    codigo,

                    sys_usuario_id:
                    input.sysUsuarioId,
                },

                select: {
                    codigo: true,
                    valor_total: true,
                    created_at: true,

                    vnd_pedido_status: {
                        select: {
                            codigo: true,
                            descricao: true,
                            color: true,
                            icon: true,
                        },
                    },

                    vnd_pedido_itens: {
                        orderBy: {
                            id: "asc",
                        },

                        select: {
                            id: true,

                            produto_nome_snapshot:
                                true,

                            variacao_snapshot:
                                true,

                            quantidade:
                                true,

                            previsao_entrega_snapshot:
                                true,

                            vnd_pedido_item_componentes:
                                {
                                    orderBy: {
                                        id: "asc",
                                    },

                                    select: {
                                        id: true,

                                        produto_nome_snapshot:
                                            true,

                                        variacao_snapshot:
                                            true,

                                        quantidade:
                                            true,
                                    },
                                },
                        },
                    },

                    fin_pagamentos: {
                        orderBy: {
                            id: "desc",
                        },

                        take: 1,

                        select: {
                            valor: true,

                            fin_pagamento_status: {
                                select: {
                                    codigo: true,
                                    descricao:
                                        true,
                                    color: true,
                                },
                            },

                            fin_pagamento_metodo: {
                                select: {
                                    codigo: true,
                                    descricao:
                                        true,
                                },
                            },
                        },
                    },

                    vnd_pedido_historicos: {
                        orderBy: [
                            {
                                created_at:
                                    "asc",
                            },
                            {
                                id: "asc",
                            },
                        ],

                        select: {
                            id: true,
                            created_at: true,

                            vnd_pedido_status: {
                                select: {
                                    codigo: true,
                                    descricao:
                                        true,
                                    color: true,
                                    icon: true,
                                },
                            },
                        },
                    },
                },
            });

        if (!pedido) {
            return null;
        }

        const pagamento =
            pedido.fin_pagamentos[0] ??
            null;

        return {
            codigo:
            pedido.codigo,

            valor_total:
                Number(
                    pedido.valor_total,
                ),

            created_at:
            pedido.created_at,

            status: {
                codigo:
                pedido
                    .vnd_pedido_status
                    .codigo,

                descricao:
                pedido
                    .vnd_pedido_status
                    .descricao,

                color:
                pedido
                    .vnd_pedido_status
                    .color,

                icon:
                pedido
                    .vnd_pedido_status
                    .icon,
            },

            itens:
                pedido.vnd_pedido_itens.map(
                    (item) => ({
                        id:
                        item.id,

                        produto_nome:
                        item
                            .produto_nome_snapshot,

                        variacao:
                        item
                            .variacao_snapshot,

                        quantidade:
                        item.quantidade,

                        previsao_entrega:
                        item
                            .previsao_entrega_snapshot,

                        componentes:
                            item
                                .vnd_pedido_item_componentes
                                .map(
                                    (
                                        componente,
                                    ) => ({
                                        id:
                                        componente.id,

                                        produto_nome:
                                        componente
                                            .produto_nome_snapshot,

                                        variacao:
                                        componente
                                            .variacao_snapshot,

                                        quantidade:
                                        componente
                                            .quantidade,
                                    }),
                                ),
                    }),
                ),

            pagamento:
                pagamento
                    ? {
                        valor:
                            Number(
                                pagamento.valor,
                            ),

                        status: {
                            codigo:
                            pagamento
                                .fin_pagamento_status
                                .codigo,

                            descricao:
                            pagamento
                                .fin_pagamento_status
                                .descricao,

                            color:
                            pagamento
                                .fin_pagamento_status
                                .color,
                        },

                        metodo: {
                            codigo:
                            pagamento
                                .fin_pagamento_metodo
                                .codigo,

                            descricao:
                            pagamento
                                .fin_pagamento_metodo
                                .descricao,
                        },
                    }
                    : null,

            historico:
                pedido
                    .vnd_pedido_historicos
                    .map(
                        (
                            historico,
                        ) => ({
                            id:
                            historico.id,

                            status: {
                                codigo:
                                historico
                                    .vnd_pedido_status
                                    .codigo,

                                descricao:
                                historico
                                    .vnd_pedido_status
                                    .descricao,

                                color:
                                historico
                                    .vnd_pedido_status
                                    .color,

                                icon:
                                historico
                                    .vnd_pedido_status
                                    .icon,
                            },

                            created_at:
                            historico
                                .created_at,
                        }),
                    ),
        };
    }

    async findExpiredPixPayments(limit = 100) {
        const now = new Date();

        return prisma.finPagamento.findMany({
            where: {
                provider: "mercado_pago",
                external_id: { not: null },
                fin_pagamento_status: {
                    codigo: "pendente",
                },
                fin_pagamento_metodo: {
                    codigo: "pix",
                },
                vnd_pedido: {
                    vnd_estoque_reservas: {
                        some: {
                            expira_at: { lte: now },
                            consumida_at: null,
                            liberada_at: null,
                        },
                    },
                },
            },
            orderBy: {
                created_at: "asc",
            },
            take: Math.max(1, Math.min(limit, 500)),
            select: {
                id: true,
                external_id: true,
                vnd_pedido: {
                    select: {
                        codigo: true,
                    },
                },
            },
        });
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
