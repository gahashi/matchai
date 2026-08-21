import { randomInt } from "node:crypto";

import { prisma } from "@/lib/prisma";

export type PedidoStatusCode =
    | "recebido"
    | "aguardando_pagamento"
    | "confirmado"
    | "em_preparacao"
    | "pronto_retirada"
    | "enviado"
    | "entregue"
    | "cancelado";

type ListAdminPedidosInput = {
    q?: string | null;
    status?: string | null;
};

type UpdatePedidoStatusInput = {
    id: number;
    statusCode: PedidoStatusCode;
    observacao?: string | null;
    updatedBySysUsuarioId: number;
};


export type PedidoOrigemManual =
    | "manual"
    | "legado";

export type PedidoPagamentoMetodoManual =
    | "pix_manual"
    | "cartao"
    | "dinheiro";

export type PedidoPagamentoStatusManual =
    | "pendente"
    | "aprovado"
    | "recusado"
    | "cancelado"
    | "estornado"
    | "expirado";

export type PedidoManualCampoInput = {
    campoId: number;
    valor: string;
};

export type PedidoManualComponenteInput = {
    componenteId: number;
    variacaoId?: number | null;
    campos?: PedidoManualCampoInput[];
};

export type PedidoManualItemInput = {
    produtoId: number;
    variacaoId?: number | null;
    quantidade: number;
    precoUnitario?: number | null;
    campos?: PedidoManualCampoInput[];
    componentes?: PedidoManualComponenteInput[];
};

export type CreatePedidoManualInput = {
    origem: PedidoOrigemManual;
    dataOriginal?: Date | null;

    clienteNome: string;
    clienteEmail?: string | null;
    clienteTelefone: string;

    statusCode: PedidoStatusCode;

    pagamentoMetodoCode: PedidoPagamentoMetodoManual;
    pagamentoStatusCode: PedidoPagamentoStatusManual;

    movimentarEstoque: boolean;

    observacao?: string | null;

    itens: PedidoManualItemInput[];

    createdBySysUsuarioId: number;
};


const ORDER_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const ORDER_CODE_LENGTH = 6;

function roundMoney(value: number) {
    return Number(value.toFixed(2));
}

function buildOrderCode() {
    let code = "";

    for (
        let index = 0;
        index < ORDER_CODE_LENGTH;
        index += 1
    ) {
        code +=
            ORDER_CODE_ALPHABET[
                randomInt(
                    0,
                    ORDER_CODE_ALPHABET.length,
                )
                ];
    }

    return code;
}

async function generateUniqueOrderCode() {
    for (
        let attempt = 0;
        attempt < 12;
        attempt += 1
    ) {
        const codigo =
            buildOrderCode();

        const existente =
            await prisma.vndPedido.findUnique({
                where: {
                    codigo,
                },
                select: {
                    id: true,
                },
            });

        if (!existente) {
            return codigo;
        }
    }

    throw new Error(
        "Não foi possível gerar o código do pedido.",
    );
}

function validateManualOrderStatus(
    pedidoStatus: PedidoStatusCode,
    pagamentoStatus: PedidoPagamentoStatusManual,
) {
    if (
        pagamentoStatus === "aprovado"
    ) {
        if (
            ![
                "confirmado",
                "em_preparacao",
                "pronto_retirada",
                "enviado",
                "entregue",
            ].includes(pedidoStatus)
        ) {
            throw new Error(
                "Pedido com pagamento aprovado deve iniciar como confirmado ou em uma etapa posterior.",
            );
        }

        return;
    }

    if (
        pagamentoStatus === "pendente"
    ) {
        if (
            ![
                "recebido",
                "aguardando_pagamento",
            ].includes(pedidoStatus)
        ) {
            throw new Error(
                "Pedido com pagamento pendente deve iniciar como recebido ou aguardando pagamento.",
            );
        }

        return;
    }

    if (
        pedidoStatus !== "cancelado"
    ) {
        throw new Error(
            "Pagamento recusado, cancelado, estornado ou expirado exige pedido com status cancelado.",
        );
    }
}

function normalizeManualFieldValue(
    value: string,
) {
    return value.trim();
}

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

async function consumeManualStock(
    tx: any,
    input: {
        pedidoId: number;
        pedidoItemId: number;
        pedidoItemComponenteId: number | null;
        produtoId: number;
        variacaoId: number | null;
        quantidade: number;
        now: Date;
    },
) {
    if (
        !Number.isInteger(
            input.quantidade,
        ) ||
        input.quantidade <= 0
    ) {
        throw new Error(
            "Quantidade de estoque inválida.",
        );
    }

    await lockStockRow(
        tx,
        input.produtoId,
        input.variacaoId,
    );

    const reservadas =
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
        Number(
            reservadas
                ._sum
                .quantidade ?? 0,
        );

    if (
        input.variacaoId !== null
    ) {
        const variacao =
            await tx.prdProdutoVariacao.findUnique({
                where: {
                    id: input.variacaoId,
                },

                select: {
                    id: true,
                    estoque_atual: true,
                },
            });

        if (!variacao) {
            throw new Error(
                "Variação de produto não encontrada.",
            );
        }

        if (
            variacao.estoque_atual !== null
        ) {
            const disponivel =
                variacao.estoque_atual -
                quantidadeReservada;

            if (
                disponivel <
                input.quantidade
            ) {
                throw new Error(
                    "Estoque insuficiente para concluir o pedido manual.",
                );
            }

            await tx.prdProdutoVariacao.update({
                where: {
                    id: variacao.id,
                },

                data: {
                    estoque_atual: {
                        decrement:
                        input.quantidade,
                    },

                    updated_at:
                    input.now,
                },
            });
        }
    } else {
        const produto =
            await tx.prdProduto.findUnique({
                where: {
                    id: input.produtoId,
                },

                select: {
                    id: true,
                    estoque_atual: true,
                },
            });

        if (!produto) {
            throw new Error(
                "Produto não encontrado.",
            );
        }

        if (
            produto.estoque_atual !== null
        ) {
            const disponivel =
                produto.estoque_atual -
                quantidadeReservada;

            if (
                disponivel <
                input.quantidade
            ) {
                throw new Error(
                    "Estoque insuficiente para concluir o pedido manual.",
                );
            }

            await tx.prdProduto.update({
                where: {
                    id: produto.id,
                },

                data: {
                    estoque_atual: {
                        decrement:
                        input.quantidade,
                    },

                    updated_at:
                    input.now,
                },
            });
        }
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
            input.now,

            consumida_at:
            input.now,

            liberada_at:
                null,

            created_at:
            input.now,

            updated_at:
            input.now,
        },
    });
}

const TRANSICOES_PERMITIDAS: Record<
    PedidoStatusCode,
    PedidoStatusCode[]
> = {
    recebido: [
        "aguardando_pagamento",
        "confirmado",
        "cancelado",
    ],

    aguardando_pagamento: [
        "cancelado",
    ],

    confirmado: [
        "em_preparacao",
        "cancelado",
    ],

    em_preparacao: [
        "pronto_retirada",
        "enviado",
        "cancelado",
    ],

    pronto_retirada: [
        "entregue",
        "cancelado",
    ],

    enviado: [
        "entregue",
        "cancelado",
    ],

    entregue: [],
    cancelado: [],
};

function normalizeTelefone(
    value: string,
) {
    const numeros =
        value.replace(/\D/g, "");

    if (
        numeros.length < 10 ||
        numeros.length > 11
    ) {
        throw new Error(
            "Informe um telefone válido com DDD.",
        );
    }

    return numeros;
}

function normalizeOptional(value?: string | null) {
    const normalized = value?.trim();

    return normalized
        ? normalized
        : null;
}

function serializeMoney(value: unknown) {
    if (value === null || value === undefined) {
        return null;
    }

    return Number(value);
}

function serializePedidoResumo(pedido: any) {
    const pagamento =
        pedido.fin_pagamentos?.[0] ?? null;

    return {
        id: pedido.id,
        codigo: pedido.codigo,
        origem: pedido.origem,
        data_original: pedido.data_original,

        cliente: {
            nome: pedido.cliente_nome,
            email: pedido.cliente_email,
            telefone: pedido.cliente_telefone,
        },

        status: {
            id: pedido.vnd_pedido_status.id,
            codigo: pedido.vnd_pedido_status.codigo,
            descricao:
            pedido.vnd_pedido_status.descricao,
            color: pedido.vnd_pedido_status.color,
            icon: pedido.vnd_pedido_status.icon,
        },

        entrega_tipo: pedido.vnd_entrega_tipo
            ? {
                id: pedido.vnd_entrega_tipo.id,
                codigo:
                pedido.vnd_entrega_tipo.codigo,
                descricao:
                pedido.vnd_entrega_tipo.descricao,
            }
            : null,

        valor_total:
            serializeMoney(pedido.valor_total) ?? 0,

        pagamento: pagamento
            ? {
                id: pagamento.id,
                valor:
                    serializeMoney(
                        pagamento.valor,
                    ) ?? 0,

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

                provider:
                pagamento.provider,

                aprovado_at:
                pagamento.aprovado_at,
            }
            : null,

        quantidade_itens:
            pedido._count?.vnd_pedido_itens ??
            0,

        created_at: pedido.created_at,
        updated_at: pedido.updated_at,
        cancelado_at: pedido.cancelado_at,
        concluido_at: pedido.concluido_at,
    };
}

function serializePedidoDetalhe(pedido: any) {
    return {
        ...serializePedidoResumo(pedido),

        sys_usuario_id:
        pedido.sys_usuario_id,

        cliente: {
            nome: pedido.cliente_nome,
            email: pedido.cliente_email,
            telefone: pedido.cliente_telefone,
        },

        entrega_endereco:
        pedido.entrega_endereco,

        retirada_local:
        pedido.retirada_local,

        observacao_cliente:
        pedido.observacao_cliente,

        valores: {
            produtos:
                serializeMoney(
                    pedido.valor_produtos,
                ) ?? 0,

            desconto:
                serializeMoney(
                    pedido.valor_desconto,
                ) ?? 0,

            frete:
                serializeMoney(
                    pedido.valor_frete,
                ) ?? 0,

            acrescimo:
                serializeMoney(
                    pedido.valor_acrescimo,
                ) ?? 0,

            total:
                serializeMoney(
                    pedido.valor_total,
                ) ?? 0,
        },

        itens: (
            pedido.vnd_pedido_itens ?? []
        ).map((item: any) => ({
            id: item.id,

            prd_produto_id:
            item.prd_produto_id,

            prd_produto_variacao_id:
            item.prd_produto_variacao_id,

            produto_codigo:
            item.produto_codigo_snapshot,

            produto_nome:
            item.produto_nome_snapshot,

            variacao:
            item.variacao_snapshot,

            previsao_entrega:
                item.previsao_entrega_snapshot ??
                null,

            quantidade:
            item.quantidade,

            preco_tabela:
                serializeMoney(
                    item.preco_tabela,
                ) ?? 0,

            preco_unitario:
                serializeMoney(
                    item.preco_unitario,
                ) ?? 0,

            valor_desconto:
                serializeMoney(
                    item.valor_desconto,
                ) ?? 0,

            subtotal:
                serializeMoney(
                    item.subtotal,
                ) ?? 0,

            socio_aplicado:
                Boolean(item.socio_aplicado),

            observacao:
            item.observacao,

            campos: (
                item.vnd_pedido_item_campos ??
                []
            )
                .filter(
                    (campo: any) =>
                        campo
                            .vnd_pedido_item_componente_id ===
                        null,
                )
                .map((campo: any) => ({
                    id: campo.id,
                    codigo:
                    campo
                        .campo_codigo_snapshot,
                    nome:
                    campo
                        .campo_nome_snapshot,
                    tipo:
                    campo
                        .campo_tipo_snapshot,
                    valor: campo.valor,
                })),

            componentes: (
                item.vnd_pedido_item_componentes ??
                []
            ).map((componente: any) => ({
                id: componente.id,

                prd_produto_id:
                componente.prd_produto_id,

                prd_produto_variacao_id:
                componente
                    .prd_produto_variacao_id,

                produto_codigo:
                componente
                    .produto_codigo_snapshot,

                produto_nome:
                componente
                    .produto_nome_snapshot,

                variacao:
                componente
                    .variacao_snapshot,

                quantidade:
                componente.quantidade,

                campos: (
                    item
                        .vnd_pedido_item_campos ??
                    []
                )
                    .filter(
                        (campo: any) =>
                            campo
                                .vnd_pedido_item_componente_id ===
                            componente.id,
                    )
                    .map((campo: any) => ({
                        id: campo.id,
                        codigo:
                        campo
                            .campo_codigo_snapshot,
                        nome:
                        campo
                            .campo_nome_snapshot,
                        tipo:
                        campo
                            .campo_tipo_snapshot,
                        valor:
                        campo.valor,
                    })),
            })),
        })),

        pagamentos: (
            pedido.fin_pagamentos ?? []
        ).map((pagamento: any) => ({
            id: pagamento.id,

            valor:
                serializeMoney(
                    pagamento.valor,
                ) ?? 0,

            taxa_gateway:
                serializeMoney(
                    pagamento.taxa_gateway,
                ),

            valor_liquido:
                serializeMoney(
                    pagamento.valor_liquido,
                ),

            provider:
            pagamento.provider,

            external_id:
            pagamento.external_id,

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

            aprovado_at:
            pagamento.aprovado_at,

            expirado_at:
            pagamento.expirado_at,

            cancelado_at:
            pagamento.cancelado_at,

            created_at:
            pagamento.created_at,
        })),

        historico: (
            pedido.vnd_pedido_historicos ??
            []
        ).map((historico: any) => ({
            id: historico.id,

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

            operador:
                historico
                    .sys_usuario_operador
                    ? {
                        id:
                        historico
                            .sys_usuario_operador
                            .id,

                        nome:
                        historico
                            .sys_usuario_operador
                            .nome,
                    }
                    : null,

            observacao:
            historico.observacao,

            created_at:
            historico.created_at,
        })),
    };
}

const pedidoResumoSelect = {
    id: true,
    codigo: true,
    origem: true,
    data_original: true,
    sys_usuario_id: true,

    cliente_nome: true,
    cliente_email: true,
    cliente_telefone: true,

    valor_total: true,

    created_at: true,
    updated_at: true,
    cancelado_at: true,
    concluido_at: true,

    vnd_pedido_status: {
        select: {
            id: true,
            codigo: true,
            descricao: true,
            color: true,
            icon: true,
        },
    },

    vnd_entrega_tipo: {
        select: {
            id: true,
            codigo: true,
            descricao: true,
        },
    },

    fin_pagamentos: {
        orderBy: {
            id: "desc" as const,
        },

        take: 1,

        select: {
            id: true,
            valor: true,
            provider: true,
            aprovado_at: true,

            fin_pagamento_status: {
                select: {
                    codigo: true,
                    descricao: true,
                    color: true,
                },
            },

            fin_pagamento_metodo: {
                select: {
                    codigo: true,
                    descricao: true,
                },
            },
        },
    },

    _count: {
        select: {
            vnd_pedido_itens: true,
        },
    },
};

class PedidoService {
    async listAdminData(
        input: ListAdminPedidosInput = {},
    ) {
        const q =
            normalizeOptional(input.q);

        const status =
            normalizeOptional(input.status);

        const [pedidos, statuses] =
            await Promise.all([
                prisma.vndPedido.findMany({
                    where: {
                        ...(status
                            ? {
                                vnd_pedido_status: {
                                    codigo:
                                    status,
                                },
                            }
                            : {}),

                        ...(q
                            ? {
                                OR: [
                                    {
                                        codigo: {
                                            contains:
                                            q,
                                        },
                                    },
                                    {
                                        cliente_nome: {
                                            contains:
                                            q,
                                        },
                                    },
                                    {
                                        cliente_email: {
                                            contains:
                                            q,
                                        },
                                    },
                                    {
                                        cliente_telefone: {
                                            contains:
                                            q,
                                        },
                                    },
                                ],
                            }
                            : {}),
                    },

                    select:
                    pedidoResumoSelect,

                    orderBy: [
                        {
                            created_at:
                                "desc",
                        },
                        {
                            id: "desc",
                        },
                    ],
                }),

                prisma.vndPedidoStatus.findMany({
                    where: {
                        ativo: 1,
                    },

                    orderBy: {
                        id: "asc",
                    },

                    select: {
                        id: true,
                        codigo: true,
                        descricao: true,
                        color: true,
                        icon: true,
                    },
                }),
            ]);

        return {
            statuses,
            pedidos:
                pedidos.map(
                    serializePedidoResumo,
                ),
        };
    }

    async findById(id: number) {
        const pedido =
            await prisma.vndPedido.findUnique({
                where: {
                    id,
                },

                select: {
                    ...pedidoResumoSelect,

                    valor_produtos: true,
                    valor_desconto: true,
                    valor_frete: true,
                    valor_acrescimo: true,

                    entrega_endereco: true,
                    retirada_local: true,
                    observacao_cliente: true,

                    vnd_pedido_itens: {
                        orderBy: {
                            id: "asc",
                        },

                        select: {
                            id: true,

                            prd_produto_id: true,
                            prd_produto_variacao_id:
                                true,

                            produto_codigo_snapshot:
                                true,

                            produto_nome_snapshot:
                                true,

                            variacao_snapshot:
                                true,

                            previsao_entrega_snapshot:
                                true,

                            quantidade: true,

                            preco_tabela: true,
                            preco_unitario: true,
                            valor_desconto: true,
                            subtotal: true,

                            socio_aplicado: true,
                            observacao: true,

                            vnd_pedido_item_componentes:
                                {
                                    orderBy: {
                                        id: "asc",
                                    },

                                    select: {
                                        id: true,

                                        prd_produto_id:
                                            true,

                                        prd_produto_variacao_id:
                                            true,

                                        produto_codigo_snapshot:
                                            true,

                                        produto_nome_snapshot:
                                            true,

                                        variacao_snapshot:
                                            true,

                                        quantidade:
                                            true,
                                    },
                                },

                            vnd_pedido_item_campos:
                                {
                                    orderBy: {
                                        id: "asc",
                                    },

                                    select: {
                                        id: true,

                                        vnd_pedido_item_componente_id:
                                            true,

                                        campo_codigo_snapshot:
                                            true,

                                        campo_nome_snapshot:
                                            true,

                                        campo_tipo_snapshot:
                                            true,

                                        valor: true,
                                    },
                                },
                        },
                    },

                    fin_pagamentos: {
                        orderBy: {
                            id: "desc",
                        },

                        select: {
                            id: true,
                            valor: true,
                            taxa_gateway: true,
                            valor_liquido: true,

                            provider: true,
                            external_id: true,

                            aprovado_at: true,
                            expirado_at: true,
                            cancelado_at: true,

                            created_at: true,

                            fin_pagamento_status:
                                {
                                    select: {
                                        codigo: true,
                                        descricao:
                                            true,
                                        color: true,
                                    },
                                },

                            fin_pagamento_metodo:
                                {
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
                            observacao: true,
                            created_at: true,

                            vnd_pedido_status:
                                {
                                    select: {
                                        codigo: true,
                                        descricao:
                                            true,
                                        color: true,
                                        icon: true,
                                    },
                                },

                            sys_usuario_operador:
                                {
                                    select: {
                                        id: true,
                                        nome: true,
                                    },
                                },
                        },
                    },
                },
            });

        return pedido
            ? serializePedidoDetalhe(
                pedido,
            )
            : null;
    }

    async createManual(
        input: CreatePedidoManualInput,
    ) {
        if (
            input.origem !== "manual" &&
            input.origem !== "legado"
        ) {
            throw new Error(
                "Origem de pedido manual inválida.",
            );
        }

        if (
            input.origem === "legado" &&
            !input.dataOriginal
        ) {
            throw new Error(
                "Informe a data original do pedido legado.",
            );
        }

        if (
            input.clienteNome.trim().length < 2
        ) {
            throw new Error(
                "Informe o nome do cliente.",
            );
        }

        const clienteTelefone =
            normalizeTelefone(
                input.clienteTelefone,
            );

        if (
            input.itens.length === 0
        ) {
            throw new Error(
                "Adicione pelo menos um item ao pedido.",
            );
        }

        validateManualOrderStatus(
            input.statusCode,
            input.pagamentoStatusCode,
        );

        const produtoIds =
            Array.from(
                new Set(
                    input.itens.map(
                        (item) =>
                            item.produtoId,
                    ),
                ),
            );

        const produtos =
            await prisma.prdProduto.findMany({
                where: {
                    id: {
                        in: produtoIds,
                    },

                    deleted_at: null,
                },

                select: {
                    id: true,
                    codigo: true,
                    nome: true,

                    preco_normal: true,
                    modalidade_venda: true,
                    controla_estoque: true,
                    estoque_atual: true,
                    previsao_entrega: true,

                    prd_produto_variacoes: {
                        where: {
                            deleted_at: null,
                        },

                        select: {
                            id: true,
                            nome: true,
                            estoque_atual: true,
                        },
                    },

                    prd_produto_campos: {
                        where: {
                            deleted_at: null,
                        },

                        select: {
                            id: true,
                            codigo: true,
                            nome: true,
                            tipo: true,
                        },
                    },

                    prd_produto_componentes: {
                        where: {
                            ativo: 1,
                        },

                        orderBy: [
                            {
                                ordem: "asc",
                            },
                            {
                                id: "asc",
                            },
                        ],

                        select: {
                            id: true,
                            quantidade: true,

                            prd_produto_componente: {
                                select: {
                                    id: true,
                                    codigo: true,
                                    nome: true,

                                    controla_estoque:
                                        true,

                                    estoque_atual:
                                        true,

                                    prd_produto_variacoes:
                                        {
                                            where: {
                                                deleted_at:
                                                    null,
                                            },

                                            select: {
                                                id: true,
                                                nome: true,
                                                estoque_atual:
                                                    true,
                                            },
                                        },

                                    prd_produto_campos:
                                        {
                                            where: {
                                                deleted_at:
                                                    null,
                                            },

                                            select: {
                                                id: true,
                                                codigo: true,
                                                nome: true,
                                                tipo: true,
                                            },
                                        },
                                },
                            },
                        },
                    },
                },
            });

        if (
            produtos.length !==
            produtoIds.length
        ) {
            throw new Error(
                "Um ou mais produtos não foram encontrados.",
            );
        }

        const produtoMap =
            new Map(
                produtos.map(
                    (produto) => [
                        produto.id,
                        produto,
                    ],
                ),
            );

        const itensPreparados =
            input.itens.map(
                (item, index) => {
                    if (
                        !Number.isInteger(
                            item.quantidade,
                        ) ||
                        item.quantidade <= 0
                    ) {
                        throw new Error(
                            `Quantidade inválida no item ${index + 1}.`,
                        );
                    }

                    const produto =
                        produtoMap.get(
                            item.produtoId,
                        );

                    if (!produto) {
                        throw new Error(
                            `Produto inválido no item ${index + 1}.`,
                        );
                    }

                    const variacoes =
                        produto
                            .prd_produto_variacoes ??
                        [];

                    let variacao:
                        | typeof variacoes[number]
                        | null =
                        null;

                    if (
                        variacoes.length > 0
                    ) {
                        if (
                            !item.variacaoId
                        ) {
                            throw new Error(
                                `Selecione a variação de ${produto.nome}.`,
                            );
                        }

                        variacao =
                            variacoes.find(
                                (itemVariacao) =>
                                    itemVariacao.id ===
                                    item.variacaoId,
                            ) ?? null;

                        if (!variacao) {
                            throw new Error(
                                `Variação inválida para ${produto.nome}.`,
                            );
                        }
                    } else if (
                        item.variacaoId
                    ) {
                        throw new Error(
                            `${produto.nome} não possui variações.`,
                        );
                    }

                    const camposInput =
                        item.campos ?? [];

                    const campos =
                        camposInput.map(
                            (campoInput) => {
                                const campo =
                                    produto
                                        .prd_produto_campos
                                        .find(
                                            (
                                                itemCampo,
                                            ) =>
                                                itemCampo.id ===
                                                campoInput.campoId,
                                        );

                                if (!campo) {
                                    throw new Error(
                                        `Campo de personalização inválido para ${produto.nome}.`,
                                    );
                                }

                                const valor =
                                    normalizeManualFieldValue(
                                        campoInput.valor,
                                    );

                                if (!valor) {
                                    throw new Error(
                                        `Informe um valor para ${campo.nome}.`,
                                    );
                                }

                                return {
                                    campo_id:
                                    campo.id,

                                    codigo:
                                    campo.codigo,

                                    nome:
                                    campo.nome,

                                    tipo:
                                    campo.tipo,

                                    valor,

                                    valor_normalizado:
                                        valor
                                            .trim()
                                            .toLowerCase(),
                                };
                            },
                        );

                    const definicoesComponentes =
                        produto
                            .prd_produto_componentes ??
                        [];

                    const componentesInput =
                        item.componentes ?? [];

                    if (
                        definicoesComponentes.length !==
                        componentesInput.length
                    ) {
                        if (
                            definicoesComponentes.length >
                            0
                        ) {
                            throw new Error(
                                `Informe todos os componentes do kit ${produto.nome}.`,
                            );
                        }

                        if (
                            componentesInput.length >
                            0
                        ) {
                            throw new Error(
                                `${produto.nome} não é um kit.`,
                            );
                        }
                    }

                    const componentes =
                        definicoesComponentes.map(
                            (definicao) => {
                                const componenteInput =
                                    componentesInput.find(
                                        (
                                            itemComponente,
                                        ) =>
                                            itemComponente
                                                .componenteId ===
                                            definicao.id,
                                    );

                                if (
                                    !componenteInput
                                ) {
                                    throw new Error(
                                        `Componente ausente no kit ${produto.nome}.`,
                                    );
                                }

                                const componenteProduto =
                                    definicao
                                        .prd_produto_componente;

                                const variacoesComponente =
                                    componenteProduto
                                        .prd_produto_variacoes ??
                                    [];

                                let variacaoComponente:
                                    | typeof variacoesComponente[number]
                                    | null =
                                    null;

                                if (
                                    variacoesComponente.length >
                                    0
                                ) {
                                    if (
                                        !componenteInput
                                            .variacaoId
                                    ) {
                                        throw new Error(
                                            `Selecione a variação de ${componenteProduto.nome}.`,
                                        );
                                    }

                                    variacaoComponente =
                                        variacoesComponente.find(
                                            (
                                                itemVariacao,
                                            ) =>
                                                itemVariacao.id ===
                                                componenteInput
                                                    .variacaoId,
                                        ) ??
                                        null;

                                    if (
                                        !variacaoComponente
                                    ) {
                                        throw new Error(
                                            `Variação inválida para ${componenteProduto.nome}.`,
                                        );
                                    }
                                } else if (
                                    componenteInput
                                        .variacaoId
                                ) {
                                    throw new Error(
                                        `${componenteProduto.nome} não possui variações.`,
                                    );
                                }

                                const camposComponente =
                                    (
                                        componenteInput
                                            .campos ??
                                        []
                                    ).map(
                                        (
                                            campoInput,
                                        ) => {
                                            const campo =
                                                componenteProduto
                                                    .prd_produto_campos
                                                    .find(
                                                        (
                                                            itemCampo,
                                                        ) =>
                                                            itemCampo.id ===
                                                            campoInput.campoId,
                                                    );

                                            if (
                                                !campo
                                            ) {
                                                throw new Error(
                                                    `Campo de personalização inválido para ${componenteProduto.nome}.`,
                                                );
                                            }

                                            const valor =
                                                normalizeManualFieldValue(
                                                    campoInput.valor,
                                                );

                                            if (
                                                !valor
                                            ) {
                                                throw new Error(
                                                    `Informe um valor para ${campo.nome}.`,
                                                );
                                            }

                                            return {
                                                campo_id:
                                                campo.id,

                                                codigo:
                                                campo.codigo,

                                                nome:
                                                campo.nome,

                                                tipo:
                                                campo.tipo,

                                                valor,

                                                valor_normalizado:
                                                    valor
                                                        .trim()
                                                        .toLowerCase(),
                                            };
                                        },
                                    );

                                return {
                                    componente_id:
                                    definicao.id,

                                    produto_id:
                                    componenteProduto.id,

                                    produto_codigo:
                                    componenteProduto.codigo,

                                    produto_nome:
                                    componenteProduto.nome,

                                    quantidade_por_kit:
                                    definicao.quantidade,

                                    controla_estoque:
                                        Boolean(
                                            componenteProduto
                                                .controla_estoque,
                                        ),

                                    variacao_id:
                                        variacaoComponente
                                            ?.id ??
                                        null,

                                    variacao_nome:
                                        variacaoComponente
                                            ?.nome ??
                                        null,

                                    campos:
                                    camposComponente,
                                };
                            },
                        );

                    const precoTabela =
                        Number(
                            produto.preco_normal,
                        );

                    const precoUnitario =
                        item.precoUnitario ===
                        null ||
                        item.precoUnitario ===
                        undefined
                            ? precoTabela
                            : Number(
                                item.precoUnitario,
                            );

                    if (
                        !Number.isFinite(
                            precoUnitario,
                        ) ||
                        precoUnitario < 0
                    ) {
                        throw new Error(
                            `Preço inválido para ${produto.nome}.`,
                        );
                    }

                    return {
                        produto,
                        variacao,
                        quantidade:
                        item.quantidade,

                        campos,
                        componentes,

                        preco_tabela:
                            roundMoney(
                                precoTabela,
                            ),

                        preco_unitario:
                            roundMoney(
                                precoUnitario,
                            ),

                        subtotal:
                            roundMoney(
                                precoUnitario *
                                item.quantidade,
                            ),
                    };
                },
            );

        const valorProdutos =
            roundMoney(
                itensPreparados.reduce(
                    (total, item) =>
                        total +
                        item.subtotal,
                    0,
                ),
            );

        if (
            valorProdutos <= 0
        ) {
            throw new Error(
                "O total do pedido precisa ser maior que zero.",
            );
        }

        const [
            pedidoStatus,
            entregaTipo,
            pagamentoStatus,
            pagamentoMetodo,
        ] =
            await Promise.all([
                prisma.vndPedidoStatus.findFirst(
                    {
                        where: {
                            codigo:
                            input.statusCode,
                            ativo: 1,
                        },

                        select: {
                            id: true,
                        },
                    },
                ),

                prisma.vndEntregaTipo.findFirst({
                    where: {
                        codigo:
                            "retirada",
                        ativo: 1,
                    },

                    select: {
                        id: true,
                    },
                }),

                prisma.finPagamentoStatus.findFirst(
                    {
                        where: {
                            codigo:
                            input
                                .pagamentoStatusCode,
                            ativo: 1,
                        },

                        select: {
                            id: true,
                        },
                    },
                ),

                prisma.finPagamentoMetodo.findFirst(
                    {
                        where: {
                            codigo:
                            input
                                .pagamentoMetodoCode,
                            ativo: 1,
                        },

                        select: {
                            id: true,
                        },
                    },
                ),
            ]);

        if (!pedidoStatus) {
            throw new Error(
                "Status do pedido inválido.",
            );
        }

        if (!entregaTipo) {
            throw new Error(
                "Tipo de entrega retirada não encontrado. Execute o seed.",
            );
        }

        if (
            !pagamentoStatus ||
            !pagamentoMetodo
        ) {
            throw new Error(
                "Configuração de pagamento manual inválida.",
            );
        }

        const codigo =
            await generateUniqueOrderCode();

        const now =
            new Date();

        const observacao =
            normalizeOptional(
                input.observacao,
            );

        const movimentarEstoque =
            input.origem === "manual" &&
            input.movimentarEstoque;

        const pedidoId =
            await prisma.$transaction(
                async (tx) => {
                    const pedido =
                        await tx.vndPedido.create({
                            data: {
                                codigo,

                                origem:
                                input.origem,

                                data_original:
                                    input.origem ===
                                    "legado"
                                        ? input
                                            .dataOriginal ??
                                        null
                                        : null,

                                sys_usuario_id:
                                    null,

                                vnd_campanha_id:
                                    null,

                                vnd_pedido_status_id:
                                pedidoStatus.id,

                                vnd_entrega_tipo_id:
                                entregaTipo.id,

                                cliente_nome:
                                    input.clienteNome
                                        .trim(),

                                cliente_email:
                                    normalizeOptional(
                                        input.clienteEmail,
                                    ),

                                cliente_telefone:
                                clienteTelefone,

                                entrega_endereco:
                                    null,

                                retirada_local:
                                    null,

                                observacao_cliente:
                                observacao,

                                valor_produtos:
                                valorProdutos,

                                valor_desconto:
                                    0,

                                valor_frete:
                                    0,

                                valor_acrescimo:
                                    0,

                                valor_total:
                                valorProdutos,

                                cancelado_at:
                                    input.statusCode ===
                                    "cancelado"
                                        ? now
                                        : null,

                                concluido_at:
                                    input.statusCode ===
                                    "entregue"
                                        ? now
                                        : null,

                                created_at:
                                now,

                                updated_at:
                                now,
                            },

                            select: {
                                id: true,
                            },
                        });

                    for (
                        const item of
                        itensPreparados
                        ) {
                        const pedidoItem =
                            await tx.vndPedidoItem.create(
                                {
                                    data: {
                                        vnd_pedido_id:
                                        pedido.id,

                                        prd_produto_id:
                                        item.produto.id,

                                        prd_produto_variacao_id:
                                            item.variacao
                                                ?.id ??
                                            null,

                                        vnd_campanha_id:
                                            null,

                                        produto_codigo_snapshot:
                                        item.produto
                                            .codigo,

                                        produto_nome_snapshot:
                                        item.produto
                                            .nome,

                                        variacao_snapshot:
                                            item.variacao
                                                ?.nome ??
                                            null,

                                        previsao_entrega_snapshot:
                                            item.produto
                                                .modalidade_venda ===
                                            "pre_venda"
                                                ? item
                                                    .produto
                                                    .previsao_entrega
                                                : null,

                                        quantidade:
                                        item.quantidade,

                                        preco_tabela:
                                        item.preco_tabela,

                                        preco_unitario:
                                        item.preco_unitario,

                                        valor_desconto:
                                            0,

                                        subtotal:
                                        item.subtotal,

                                        socio_aplicado:
                                            0,

                                        personalizacao_nome:
                                            null,

                                        personalizacao_numero:
                                            null,

                                        observacao:
                                            null,

                                        created_at:
                                        now,
                                    },

                                    select: {
                                        id: true,
                                    },
                                },
                            );

                        if (
                            item.campos.length >
                            0
                        ) {
                            await tx.vndPedidoItemCampo.createMany(
                                {
                                    data:
                                        item.campos.map(
                                            (
                                                campo,
                                            ) => ({
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

                                                valor:
                                                campo.valor,

                                                valor_normalizado:
                                                campo
                                                    .valor_normalizado,

                                                created_at:
                                                now,
                                            }),
                                        ),
                                },
                            );
                        }

                        const isPreVenda =
                            item.produto
                                .modalidade_venda ===
                            "pre_venda";

                        if (
                            movimentarEstoque &&
                            !isPreVenda &&
                            item.componentes
                                .length ===
                            0 &&
                            Boolean(
                                item.produto
                                    .controla_estoque,
                            )
                        ) {
                            await consumeManualStock(
                                tx,
                                {
                                    pedidoId:
                                    pedido.id,

                                    pedidoItemId:
                                    pedidoItem.id,

                                    pedidoItemComponenteId:
                                        null,

                                    produtoId:
                                    item.produto.id,

                                    variacaoId:
                                        item.variacao
                                            ?.id ??
                                        null,

                                    quantidade:
                                    item.quantidade,

                                    now,
                                },
                            );
                        }

                        for (
                            const componente of
                            item.componentes
                            ) {
                            const pedidoItemComponente =
                                await tx.vndPedidoItemComponente.create(
                                    {
                                        data: {
                                            vnd_pedido_item_id:
                                            pedidoItem.id,

                                            prd_produto_id:
                                            componente
                                                .produto_id,

                                            prd_produto_variacao_id:
                                            componente
                                                .variacao_id,

                                            produto_codigo_snapshot:
                                            componente
                                                .produto_codigo,

                                            produto_nome_snapshot:
                                            componente
                                                .produto_nome,

                                            variacao_snapshot:
                                            componente
                                                .variacao_nome,

                                            quantidade:
                                            componente
                                                .quantidade_por_kit,

                                            created_at:
                                            now,
                                        },

                                        select: {
                                            id: true,
                                        },
                                    },
                                );

                            if (
                                componente
                                    .campos
                                    .length >
                                0
                            ) {
                                await tx.vndPedidoItemCampo.createMany(
                                    {
                                        data:
                                            componente
                                                .campos
                                                .map(
                                                    (
                                                        campo,
                                                    ) => ({
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
                                                        campo
                                                            .valor_normalizado,

                                                        created_at:
                                                        now,
                                                    }),
                                                ),
                                    },
                                );
                            }

                            if (
                                movimentarEstoque &&
                                !isPreVenda &&
                                componente
                                    .controla_estoque
                            ) {
                                await consumeManualStock(
                                    tx,
                                    {
                                        pedidoId:
                                        pedido.id,

                                        pedidoItemId:
                                        pedidoItem.id,

                                        pedidoItemComponenteId:
                                        pedidoItemComponente.id,

                                        produtoId:
                                        componente
                                            .produto_id,

                                        variacaoId:
                                        componente
                                            .variacao_id,

                                        quantidade:
                                            componente
                                                .quantidade_por_kit *
                                            item.quantidade,

                                        now,
                                    },
                                );
                            }
                        }
                    }

                    await tx.vndPedidoHistorico.create(
                        {
                            data: {
                                vnd_pedido_id:
                                pedido.id,

                                vnd_pedido_status_id:
                                pedidoStatus.id,

                                sys_usuario_id:
                                input
                                    .createdBySysUsuarioId,

                                observacao:
                                    input.origem ===
                                    "legado"
                                        ? observacao ??
                                        "Pedido legado cadastrado manualmente pelo administrador."
                                        : observacao ??
                                        "Pedido criado manualmente pelo administrador.",

                                created_at:
                                now,
                            },
                        },
                    );

                    await tx.finPagamento.create({
                        data: {
                            vnd_pedido_id:
                            pedido.id,

                            fin_pagamento_status_id:
                            pagamentoStatus.id,

                            fin_pagamento_metodo_id:
                            pagamentoMetodo.id,

                            valor:
                            valorProdutos,

                            taxa_gateway:
                                input.pagamentoStatusCode ===
                                "aprovado"
                                    ? 0
                                    : null,

                            valor_liquido:
                                input.pagamentoStatusCode ===
                                "aprovado"
                                    ? valorProdutos
                                    : null,

                            provider:
                                "manual",

                            external_id:
                                null,

                            external_reference:
                                null,

                            idempotency_key:
                                null,

                            qr_code_text:
                                null,

                            payment_url:
                                null,

                            aprovado_at:
                                input.pagamentoStatusCode ===
                                "aprovado"
                                    ? now
                                    : null,

                            expirado_at:
                                input.pagamentoStatusCode ===
                                "expirado"
                                    ? now
                                    : null,

                            cancelado_at:
                                input.pagamentoStatusCode ===
                                "cancelado" ||
                                input.pagamentoStatusCode ===
                                "recusado" ||
                                input.pagamentoStatusCode ===
                                "estornado"
                                    ? now
                                    : null,

                            created_at:
                            now,

                            updated_at:
                            now,
                        },
                    });

                    return pedido.id;
                },
            );

        const pedidoCriado =
            await this.findById(
                pedidoId,
            );

        if (!pedidoCriado) {
            throw new Error(
                "Pedido não encontrado após a criação.",
            );
        }

        return pedidoCriado;
    }

    async updateStatus(
        input: UpdatePedidoStatusInput,
    ) {
        const existente =
            await prisma.vndPedido.findUnique({
                where: {
                    id: input.id,
                },

                select: {
                    id: true,
                    codigo: true,

                    vnd_pedido_status: {
                        select: {
                            codigo: true,
                        },
                    },

                    fin_pagamentos: {
                        orderBy: {
                            id: "desc",
                        },

                        take: 1,

                        select: {
                            fin_pagamento_status:
                                {
                                    select: {
                                        codigo:
                                            true,
                                    },
                                },
                        },
                    },
                },
            });

        if (!existente) {
            throw new Error(
                "Pedido não encontrado.",
            );
        }

        const atual =
            existente
                .vnd_pedido_status
                .codigo as PedidoStatusCode;

        if (
            atual === input.statusCode
        ) {
            const pedidoAtual =
                await this.findById(
                    input.id,
                );

            if (!pedidoAtual) {
                throw new Error(
                    "Pedido não encontrado.",
                );
            }

            return pedidoAtual;
        }

        const permitidos =
            TRANSICOES_PERMITIDAS[
                atual
                ] ?? [];

        if (
            !permitidos.includes(
                input.statusCode,
            )
        ) {
            throw new Error(
                `Não é permitido alterar o pedido de "${atual}" para "${input.statusCode}".`,
            );
        }

        /*
         * Não permitimos avançar um pedido do checkout
         * para preparação sem pagamento aprovado.
         *
         * O caso de pedido manual/legado será tratado
         * separadamente na próxima etapa.
         */
        if (
            atual === "confirmado" &&
            input.statusCode ===
            "em_preparacao"
        ) {
            const ultimoPagamento =
                existente
                    .fin_pagamentos?.[0];

            if (
                !ultimoPagamento ||
                ultimoPagamento
                    .fin_pagamento_status
                    .codigo !==
                "aprovado"
            ) {
                throw new Error(
                    "O pedido precisa possuir pagamento aprovado antes de iniciar a preparação.",
                );
            }
        }

        const observacao =
            normalizeOptional(
                input.observacao,
            );

        if (
            input.statusCode ===
            "cancelado" &&
            !observacao
        ) {
            throw new Error(
                "Informe o motivo do cancelamento.",
            );
        }

        const statusDestino =
            await prisma.vndPedidoStatus.findFirst(
                {
                    where: {
                        codigo:
                        input.statusCode,
                        ativo: 1,
                    },

                    select: {
                        id: true,
                    },
                },
            );

        if (!statusDestino) {
            throw new Error(
                "Status de pedido inválido.",
            );
        }

        const now =
            new Date();

        await prisma.$transaction(
            async (tx) => {
                await tx.vndPedido.update({
                    where: {
                        id: input.id,
                    },

                    data: {
                        vnd_pedido_status_id:
                        statusDestino.id,

                        cancelado_at:
                            input.statusCode ===
                            "cancelado"
                                ? now
                                : undefined,

                        concluido_at:
                            input.statusCode ===
                            "entregue"
                                ? now
                                : undefined,

                        updated_at:
                        now,
                    },
                });



                if (
                    input.statusCode ===
                    "cancelado"
                ) {
                    await tx.vndEstoqueReserva.updateMany({
                        where: {
                            vnd_pedido_id:
                            input.id,

                            consumida_at:
                                null,

                            liberada_at:
                                null,
                        },

                        data: {
                            liberada_at:
                            now,

                            updated_at:
                            now,
                        },
                    });
                }

                await tx.vndPedidoHistorico.create(
                    {
                        data: {
                            vnd_pedido_id:
                            input.id,

                            vnd_pedido_status_id:
                            statusDestino.id,

                            sys_usuario_id:
                            input
                                .updatedBySysUsuarioId,

                            observacao:
                                observacao ??
                                `Status alterado para ${input.statusCode} pelo administrador.`,

                            created_at:
                            now,
                        },
                    },
                );
            },
        );

        const pedidoAtualizado =
            await this.findById(
                input.id,
            );

        if (!pedidoAtualizado) {
            throw new Error(
                "Pedido não encontrado após a atualização.",
            );
        }

        return pedidoAtualizado;
    }

    getAllowedNextStatuses(
        statusCode: string,
    ) {
        return (
            TRANSICOES_PERMITIDAS[
                statusCode as PedidoStatusCode
                ] ?? []
        );
    }
}

export const pedidoService =
    new PedidoService();