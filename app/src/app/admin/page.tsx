import {
    BarChart3,
    CalendarDays,
    Building2,

    CircleDollarSign,
    CreditCard,
    Eye,
    MousePointerClick,
    Package,
    ReceiptText,
    ShoppingBag,
    TrendingUp,
    UsersRound,
    WalletCards,
} from "lucide-react";

import {
    AppShell,
} from "@/components/layout/AppShell";

import {
    AppLink,
} from "@/components/ui/AppLink";

import {
    Card,
    CardBody,
} from "@/components/ui/Card";

import {
    PageHeader,
} from "@/components/ui/PageHeader";

import {
    requirePageAccess,
} from "@/lib/auth/require-access";

import {
    prisma,
} from "@/lib/prisma";

const adminOptions = [
    {
        title: "Produtos",
        description:
            "Cadastre e gerencie os produtos disponíveis para venda.",
        href: "/admin/produtos",
        icon: Package,
    },
    {
        title: "Eventos",
        description:
            "Gerencie banners, links e períodos de divulgação dos eventos.",
        href: "/admin/eventos",
        icon: CalendarDays,
    },
    {
        title: "Planos de sócio",
        description:
            "Cadastre e gerencie os planos de associação disponíveis.",
        href: "/admin/planos-socio",
        icon: WalletCards,
    },
    {
        title: "Pedidos",
        description:
            "Acompanhe pedidos, pagamentos e andamento das vendas.",
        href: "/admin/pedidos",
        icon: ShoppingBag,
    },
    {
        title: "Sócios",
        description:
            "Consulte e gerencie os sócios e suas associações.",
        href: "/admin/socios",
        icon: UsersRound,
    },
    {
        title: "Parceiros",
        description:
            "Gerencie estabelecimentos parceiros, responsáveis e identidade visual.",
        href: "/admin/parceiros",
        icon: Building2,
    },
];

function money(
    value: number,
) {
    return new Intl.NumberFormat(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL",
        },
    ).format(value);
}

function metricCardStyle() {
    return {
        minWidth: 0,
    };
}

function sectionGridStyle() {
    return {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 16,
    };
}

function metricGridStyle() {
    return {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(190px, 1fr))",
        gap: 14,
    };
}

function listStyle() {
    return {
        display: "grid",
        gap: 10,
        marginTop: 18,
    };
}

function rowStyle() {
    return {
        display: "flex",
        justifyContent:
            "space-between",
        alignItems: "center",
        gap: 14,
        padding: "10px 0",
        borderBottom:
            "1px solid var(--color-border)",
    };
}

export default async function AdminPage() {
    await requirePageAccess(
        "/admin",
    );

    const agora =
        new Date();

    const periodoInicio =
        new Date(agora);

    periodoInicio.setDate(
        periodoInicio.getDate() -
        30,
    );

    const [
        pagamentosAprovados,
        pedidosPagos,
        sessoes,
        usuariosIdentificados,
        totalPageViews,
        totalClicks,
        rotasAgrupadas,
        cliquesAgrupados,
        pedidosPorStatus,
        statusPedido,
        pagamentosPorMetodo,
        metodosPagamento,
    ] =
        await Promise.all([
            prisma.finPagamento.aggregate({
                where: {
                    aprovado_at: {
                        gte:
                        periodoInicio,
                    },

                    fin_pagamento_status: {
                        codigo:
                            "aprovado",
                    },
                },

                _sum: {
                    valor: true,
                },
            }),

            prisma.finPagamento.findMany({
                where: {
                    aprovado_at: {
                        gte:
                        periodoInicio,
                    },

                    fin_pagamento_status: {
                        codigo:
                            "aprovado",
                    },
                },

                select: {
                    vnd_pedido_id:
                        true,
                },

                distinct: [
                    "vnd_pedido_id",
                ],
            }),

            prisma.sysAnalyticsEvento.findMany({
                where: {
                    tipo:
                        "page_view",

                    created_at: {
                        gte:
                        periodoInicio,
                    },
                },

                select: {
                    session_id:
                        true,
                },

                distinct: [
                    "session_id",
                ],
            }),

            prisma.sysAnalyticsEvento.findMany({
                where: {
                    tipo:
                        "page_view",

                    created_at: {
                        gte:
                        periodoInicio,
                    },

                    sys_usuario_id: {
                        not: null,
                    },
                },

                select: {
                    sys_usuario_id:
                        true,
                },

                distinct: [
                    "sys_usuario_id",
                ],
            }),

            prisma.sysAnalyticsEvento.count({
                where: {
                    tipo:
                        "page_view",

                    created_at: {
                        gte:
                        periodoInicio,
                    },
                },
            }),

            prisma.sysAnalyticsEvento.count({
                where: {
                    tipo:
                        "click",

                    created_at: {
                        gte:
                        periodoInicio,
                    },
                },
            }),

            prisma.sysAnalyticsEvento.groupBy({
                by: [
                    "rota",
                ],

                where: {
                    tipo:
                        "page_view",

                    created_at: {
                        gte:
                        periodoInicio,
                    },
                },

                _count: {
                    id: true,
                },
            }),

            prisma.sysAnalyticsEvento.groupBy({
                by: [
                    "nome",
                    "entidade_tipo",
                    "entidade_id",
                ],

                where: {
                    tipo:
                        "click",

                    created_at: {
                        gte:
                        periodoInicio,
                    },

                    entidade_id: {
                        not: null,
                    },
                },

                _count: {
                    id: true,
                },
            }),

            prisma.vndPedido.groupBy({
                by: [
                    "vnd_pedido_status_id",
                ],

                _count: {
                    id: true,
                },
            }),

            prisma.vndPedidoStatus.findMany({
                select: {
                    id: true,
                    codigo: true,
                    descricao:
                        true,
                },
            }),

            prisma.finPagamento.groupBy({
                by: [
                    "fin_pagamento_metodo_id",
                ],

                where: {
                    aprovado_at: {
                        gte:
                        periodoInicio,
                    },

                    fin_pagamento_status: {
                        codigo:
                            "aprovado",
                    },
                },

                _count: {
                    id: true,
                },

                _sum: {
                    valor: true,
                },
            }),

            prisma.finPagamentoMetodo.findMany({
                select: {
                    id: true,
                    codigo: true,
                    descricao:
                        true,
                },
            }),
        ]);

    const faturamento =
        Number(
            pagamentosAprovados
                ._sum
                .valor ??
            0,
        );

    const quantidadePedidosPagos =
        pedidosPagos.length;

    const ticketMedio =
        quantidadePedidosPagos >
        0
            ? faturamento /
            quantidadePedidosPagos
            : 0;

    const rotasMaisAcessadas =
        [...rotasAgrupadas]
            .sort(
                (a, b) =>
                    b._count.id -
                    a._count.id,
            )
            .slice(
                0,
                6,
            );

    const produtoIds =
        cliquesAgrupados
            .filter(
                (item) =>
                    item.entidade_tipo ===
                    "produto" &&
                    item.entidade_id !==
                    null,
            )
            .map(
                (item) =>
                    item.entidade_id as number,
            );

    const eventoIds =
        cliquesAgrupados
            .filter(
                (item) =>
                    item.entidade_tipo ===
                    "evento" &&
                    item.entidade_id !==
                    null,
            )
            .map(
                (item) =>
                    item.entidade_id as number,
            );

    const planoIds =
        cliquesAgrupados
            .filter(
                (item) =>
                    item.entidade_tipo ===
                    "plano" &&
                    item.entidade_id !==
                    null,
            )
            .map(
                (item) =>
                    item.entidade_id as number,
            );

    const [
        produtos,
        eventos,
        planos,
    ] =
        await Promise.all([
            produtoIds.length >
            0
                ? prisma.prdProduto.findMany({
                    where: {
                        id: {
                            in:
                            produtoIds,
                        },
                    },

                    select: {
                        id: true,
                        nome: true,
                    },
                })
                : Promise.resolve([]),

            eventoIds.length >
            0
                ? prisma.cadEvento.findMany({
                    where: {
                        id: {
                            in:
                            eventoIds,
                        },
                    },

                    select: {
                        id: true,
                        titulo: true,
                    },
                })
                : Promise.resolve([]),

            planoIds.length >
            0
                ? prisma.socPlano.findMany({
                    where: {
                        id: {
                            in:
                            planoIds,
                        },
                    },

                    select: {
                        id: true,
                        nome: true,
                    },
                })
                : Promise.resolve([]),
        ]);

    const produtoMap =
        new Map(
            produtos.map(
                (produto) => [
                    produto.id,
                    produto.nome,
                ],
            ),
        );

    const eventoMap =
        new Map(
            eventos.map(
                (evento) => [
                    evento.id,
                    evento.titulo,
                ],
            ),
        );

    const planoMap =
        new Map(
            planos.map(
                (plano) => [
                    plano.id,
                    plano.nome,
                ],
            ),
        );

    const interesses =
        cliquesAgrupados
            .map((item) => {
                if (
                    item.entidade_id ===
                    null
                ) {
                    return null;
                }

                let label:
                    string | null =
                    null;

                if (
                    item.entidade_tipo ===
                    "produto"
                ) {
                    label =
                        produtoMap.get(
                            item.entidade_id,
                        ) ??
                        `Produto #${item.entidade_id}`;
                }

                if (
                    item.entidade_tipo ===
                    "evento"
                ) {
                    label =
                        eventoMap.get(
                            item.entidade_id,
                        ) ??
                        `Evento #${item.entidade_id}`;
                }

                if (
                    item.entidade_tipo ===
                    "plano"
                ) {
                    label =
                        planoMap.get(
                            item.entidade_id,
                        ) ??
                        `Plano #${item.entidade_id}`;
                }

                if (!label) {
                    return null;
                }

                return {
                    tipo:
                    item.entidade_tipo,
                    label,
                    cliques:
                    item._count.id,
                };
            })
            .filter(
                (
                    item,
                ): item is {
                    tipo: string | null;
                    label: string;
                    cliques: number;
                } =>
                    item !== null,
            )
            .sort(
                (a, b) =>
                    b.cliques -
                    a.cliques,
            )
            .slice(
                0,
                6,
            );

    const statusMap =
        new Map(
            statusPedido.map(
                (status) => [
                    status.id,
                    status,
                ],
            ),
        );

    const contagemStatus =
        new Map<
            string,
            number
        >();

    for (
        const item of
        pedidosPorStatus
        ) {
        const status =
            statusMap.get(
                item.vnd_pedido_status_id,
            );

        if (!status) {
            continue;
        }

        contagemStatus.set(
            status.codigo,
            item._count.id,
        );
    }

    const operationCards = [
        {
            label:
                "Aguardando pagamento",
            codigo:
                "aguardando_pagamento",
        },
        {
            label:
                "Confirmados",
            codigo:
                "confirmado",
        },
        {
            label:
                "Em preparação",
            codigo:
                "em_preparacao",
        },
        {
            label:
                "Prontos para retirada",
            codigo:
                "pronto_retirada",
        },
        {
            label:
                "Enviados",
            codigo:
                "enviado",
        },
        {
            label:
                "Entregues",
            codigo:
                "entregue",
        },
        {
            label:
                "Cancelados",
            codigo:
                "cancelado",
        },
    ];

    const metodoMap =
        new Map(
            metodosPagamento.map(
                (metodo) => [
                    metodo.id,
                    metodo,
                ],
            ),
        );

    const resumoMetodos =
        pagamentosPorMetodo
            .map(
                (item) => {
                    const metodo =
                        metodoMap.get(
                            item.fin_pagamento_metodo_id,
                        );

                    return {
                        descricao:
                            metodo
                                ?.descricao ??
                            metodo
                                ?.codigo ??
                            "Pagamento",

                        quantidade:
                        item
                            ._count
                            .id,

                        valor:
                            Number(
                                item
                                    ._sum
                                    .valor ??
                                0,
                            ),
                    };
                },
            )
            .sort(
                (a, b) =>
                    b.valor -
                    a.valor,
            );

    const produtoClicks =
        cliquesAgrupados
            .filter(
                (item) =>
                    item.nome ===
                    "produto_click",
            )
            .reduce(
                (
                    total,
                    item,
                ) =>
                    total +
                    item._count.id,
                0,
            );

    const carrinhoViews =
        rotasAgrupadas
            .filter(
                (item) =>
                    item.rota ===
                    "/carrinho",
            )
            .reduce(
                (
                    total,
                    item,
                ) =>
                    total +
                    item._count.id,
                0,
            );

    const checkoutViews =
        rotasAgrupadas
            .filter(
                (item) =>
                    item.rota ===
                    "/checkout",
            )
            .reduce(
                (
                    total,
                    item,
                ) =>
                    total +
                    item._count.id,
                0,
            );

    const principaisMetricas = [
        {
            label:
                "Faturamento aprovado",
            value:
                money(faturamento),
            helper:
                "Pagamentos aprovados nos últimos 30 dias.",
            icon:
            CircleDollarSign,
        },
        {
            label:
                "Pedidos pagos",
            value:
                String(
                    quantidadePedidosPagos,
                ),
            helper:
                "Pedidos distintos com pagamento aprovado.",
            icon:
            ShoppingBag,
        },
        {
            label:
                "Ticket médio",
            value:
                money(ticketMedio),
            helper:
                "Valor médio por pedido pago.",
            icon:
            ReceiptText,
        },
        {
            label:
                "Sessões no site",
            value:
                String(
                    sessoes.length,
                ),
            helper:
                `${usuariosIdentificados.length} usuário(s) identificado(s).`,
            icon:
            UsersRound,
        },
    ];

    const jornada = [
        {
            label:
                "Cliques em produtos",
            value:
            produtoClicks,
            icon:
            MousePointerClick,
        },
        {
            label:
                "Visitas ao carrinho",
            value:
            carrinhoViews,
            icon:
            ShoppingBag,
        },
        {
            label:
                "Visitas ao checkout",
            value:
            checkoutViews,
            icon:
            CreditCard,
        },
        {
            label:
                "Compras aprovadas",
            value:
            quantidadePedidosPagos,
            icon:
            TrendingUp,
        },
    ];

    return (
        <AppShell>
            <PageHeader
                title="Administração"
                subtitle="Gerencie vendas, eventos e associações da AAACCU."
            />

            <div className="bp-admin-option-grid">
                {adminOptions.map(
                    (option) => {
                        const Icon =
                            option.icon;

                        return (
                            <AppLink
                                key={
                                    option.href
                                }
                                href={
                                    option.href
                                }
                                className="bp-admin-option-link"
                            >
                                <Card
                                    variant="outline"
                                    className="bp-admin-option-card"
                                >
                                    <CardBody>
                                        <div className="bp-admin-option-content">
                                            <div className="bp-admin-option-icon">
                                                <Icon
                                                    size={
                                                        21
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <h2 className="bp-section-title bp-admin-option-title">
                                                    {
                                                        option.title
                                                    }
                                                </h2>

                                                <p className="bp-section-subtitle bp-admin-option-description">
                                                    {
                                                        option.description
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            </AppLink>
                        );
                    },
                )}
            </div>

            <section
                style={{
                    marginTop: 36,
                }}
            >
                <div
                    style={{
                        display:
                            "flex",
                        alignItems:
                            "flex-end",
                        justifyContent:
                            "space-between",
                        gap: 16,
                        flexWrap:
                            "wrap",
                        marginBottom:
                            18,
                    }}
                >
                    <div>
                        <h2 className="bp-section-title">
                            Visão geral
                        </h2>

                        <p className="bp-section-subtitle">
                            Desempenho da
                            loja nos últimos
                            30 dias e situação
                            atual da operação.
                        </p>
                    </div>

                    <span
                        style={{
                            fontSize:
                                13,
                            color:
                                "var(--color-text-muted)",
                        }}
                    >
                        {
                            totalPageViews
                        }{" "}
                        visualizações ·{" "}
                        {totalClicks}{" "}
                        cliques
                    </span>
                </div>

                <div
                    style={
                        metricGridStyle()
                    }
                >
                    {principaisMetricas.map(
                        (metrica) => {
                            const Icon =
                                metrica.icon;

                            return (
                                <Card
                                    key={
                                        metrica.label
                                    }
                                    variant="outline"
                                    style={
                                        metricCardStyle()
                                    }
                                >
                                    <CardBody>
                                        <div
                                            style={{
                                                display:
                                                    "flex",
                                                justifyContent:
                                                    "space-between",
                                                alignItems:
                                                    "flex-start",
                                                gap: 14,
                                            }}
                                        >
                                            <div>
                                                <span
                                                    style={{
                                                        display:
                                                            "block",
                                                        fontSize:
                                                            13,
                                                        color:
                                                            "var(--color-text-muted)",
                                                        marginBottom:
                                                            8,
                                                    }}
                                                >
                                                    {
                                                        metrica.label
                                                    }
                                                </span>

                                                <strong
                                                    style={{
                                                        display:
                                                            "block",
                                                        fontSize:
                                                            24,
                                                        lineHeight:
                                                            1.1,
                                                    }}
                                                >
                                                    {
                                                        metrica.value
                                                    }
                                                </strong>

                                                <small
                                                    style={{
                                                        display:
                                                            "block",
                                                        marginTop:
                                                            8,
                                                        color:
                                                            "var(--color-text-muted)",
                                                        lineHeight:
                                                            1.4,
                                                    }}
                                                >
                                                    {
                                                        metrica.helper
                                                    }
                                                </small>
                                            </div>

                                            <div className="bp-admin-option-icon">
                                                <Icon
                                                    size={
                                                        20
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            );
                        },
                    )}
                </div>
            </section>

            <section
                style={{
                    marginTop: 24,
                    ...sectionGridStyle(),
                }}
            >
                <Card>
                    <CardBody>
                        <h2 className="bp-section-title">
                            Operação dos
                            pedidos
                        </h2>

                        <p className="bp-section-subtitle">
                            Situação atual
                            dos pedidos no
                            sistema.
                        </p>

                        <div
                            style={
                                listStyle()
                            }
                        >
                            {operationCards.map(
                                (
                                    item,
                                ) => (
                                    <div
                                        key={
                                            item.codigo
                                        }
                                        style={
                                            rowStyle()
                                        }
                                    >
                                        <span>
                                            {
                                                item.label
                                            }
                                        </span>

                                        <strong>
                                            {contagemStatus.get(
                                                    item.codigo,
                                                ) ??
                                                0}
                                        </strong>
                                    </div>
                                ),
                            )}
                        </div>

                        <div
                            style={{
                                marginTop:
                                    18,
                            }}
                        >
                            <AppLink
                                href="/admin/pedidos"
                                variant="soft"
                            >
                                Ver pedidos
                            </AppLink>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <h2 className="bp-section-title">
                            Jornada de compra
                        </h2>

                        <p className="bp-section-subtitle">
                            Sinais principais
                            do caminho até a
                            compra nos últimos
                            30 dias.
                        </p>

                        <div
                            style={{
                                ...metricGridStyle(),
                                marginTop:
                                    18,
                            }}
                        >
                            {jornada.map(
                                (
                                    item,
                                ) => {
                                    const Icon =
                                        item.icon;

                                    return (
                                        <div
                                            key={
                                                item.label
                                            }
                                            style={{
                                                padding:
                                                    14,
                                                border:
                                                    "1px solid var(--color-border)",
                                                borderRadius:
                                                    14,
                                            }}
                                        >
                                            <Icon
                                                size={
                                                    18
                                                }
                                            />

                                            <strong
                                                style={{
                                                    display:
                                                        "block",
                                                    fontSize:
                                                        22,
                                                    marginTop:
                                                        10,
                                                }}
                                            >
                                                {
                                                    item.value
                                                }
                                            </strong>

                                            <span
                                                style={{
                                                    display:
                                                        "block",
                                                    marginTop:
                                                        4,
                                                    fontSize:
                                                        12,
                                                    color:
                                                        "var(--color-text-muted)",
                                                }}
                                            >
                                                {
                                                    item.label
                                                }
                                            </span>
                                        </div>
                                    );
                                },
                            )}
                        </div>

                        <p
                            style={{
                                margin:
                                    "16px 0 0",
                                fontSize:
                                    12,
                                color:
                                    "var(--color-text-muted)",
                                lineHeight:
                                    1.5,
                            }}
                        >
                            Estes números
                            mostram volume de
                            interação, não uma
                            conversão individual
                            exata entre cada
                            etapa.
                        </p>
                    </CardBody>
                </Card>
            </section>

            <section
                style={{
                    marginTop: 24,
                    ...sectionGridStyle(),
                }}
            >
                <Card>
                    <CardBody>
                        <div
                            style={{
                                display:
                                    "flex",
                                alignItems:
                                    "center",
                                gap: 9,
                            }}
                        >
                            <Eye
                                size={19}
                            />

                            <h2
                                className="bp-section-title"
                                style={{
                                    margin:
                                        0,
                                }}
                            >
                                Páginas mais
                                acessadas
                            </h2>
                        </div>

                        <p className="bp-section-subtitle">
                            Rotas com mais
                            visualizações nos
                            últimos 30 dias.
                        </p>

                        <div
                            style={
                                listStyle()
                            }
                        >
                            {rotasMaisAcessadas.length >
                            0 ? (
                                rotasMaisAcessadas.map(
                                    (
                                        item,
                                    ) => (
                                        <div
                                            key={
                                                item.rota
                                            }
                                            style={
                                                rowStyle()
                                            }
                                        >
                                            <span
                                                style={{
                                                    minWidth:
                                                        0,
                                                    overflow:
                                                        "hidden",
                                                    textOverflow:
                                                        "ellipsis",
                                                    whiteSpace:
                                                        "nowrap",
                                                }}
                                            >
                                                {
                                                    item.rota
                                                }
                                            </span>

                                            <strong>
                                                {
                                                    item
                                                        ._count
                                                        .id
                                                }
                                            </strong>
                                        </div>
                                    ),
                                )
                            ) : (
                                <p className="bp-section-subtitle">
                                    Ainda não
                                    existem
                                    acessos
                                    registrados.
                                </p>
                            )}
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <div
                            style={{
                                display:
                                    "flex",
                                alignItems:
                                    "center",
                                gap: 9,
                            }}
                        >
                            <BarChart3
                                size={19}
                            />

                            <h2
                                className="bp-section-title"
                                style={{
                                    margin:
                                        0,
                                }}
                            >
                                Mais procurados
                            </h2>
                        </div>

                        <p className="bp-section-subtitle">
                            Produtos, eventos
                            e planos que mais
                            despertaram
                            interesse.
                        </p>

                        <div
                            style={
                                listStyle()
                            }
                        >
                            {interesses.length >
                            0 ? (
                                interesses.map(
                                    (
                                        item,
                                        index,
                                    ) => (
                                        <div
                                            key={`${item.tipo}:${item.label}:${index}`}
                                            style={
                                                rowStyle()
                                            }
                                        >
                                            <div>
                                                <strong
                                                    style={{
                                                        display:
                                                            "block",
                                                        fontSize:
                                                            14,
                                                    }}
                                                >
                                                    {
                                                        item.label
                                                    }
                                                </strong>

                                                <small
                                                    style={{
                                                        color:
                                                            "var(--color-text-muted)",
                                                        textTransform:
                                                            "capitalize",
                                                    }}
                                                >
                                                    {
                                                        item.tipo
                                                    }
                                                </small>
                                            </div>

                                            <strong>
                                                {
                                                    item.cliques
                                                }{" "}
                                                clique
                                                {item.cliques !==
                                                1
                                                    ? "s"
                                                    : ""}
                                            </strong>
                                        </div>
                                    ),
                                )
                            ) : (
                                <p className="bp-section-subtitle">
                                    Ainda não
                                    existem
                                    cliques
                                    registrados.
                                </p>
                            )}
                        </div>
                    </CardBody>
                </Card>
            </section>

            <section
                style={{
                    marginTop: 24,
                    marginBottom:
                        24,
                }}
            >
                <Card>
                    <CardBody>
                        <div
                            style={{
                                display:
                                    "flex",
                                alignItems:
                                    "center",
                                gap: 9,
                            }}
                        >
                            <CreditCard
                                size={19}
                            />

                            <h2
                                className="bp-section-title"
                                style={{
                                    margin:
                                        0,
                                }}
                            >
                                Pagamentos
                                aprovados
                            </h2>
                        </div>

                        <p className="bp-section-subtitle">
                            Resultado por
                            forma de pagamento
                            nos últimos 30
                            dias.
                        </p>

                        <div
                            style={
                                listStyle()
                            }
                        >
                            {resumoMetodos.length >
                            0 ? (
                                resumoMetodos.map(
                                    (
                                        metodo,
                                    ) => (
                                        <div
                                            key={
                                                metodo.descricao
                                            }
                                            style={
                                                rowStyle()
                                            }
                                        >
                                            <div>
                                                <strong
                                                    style={{
                                                        display:
                                                            "block",
                                                    }}
                                                >
                                                    {
                                                        metodo.descricao
                                                    }
                                                </strong>

                                                <small
                                                    style={{
                                                        color:
                                                            "var(--color-text-muted)",
                                                    }}
                                                >
                                                    {
                                                        metodo.quantidade
                                                    }{" "}
                                                    pagamento
                                                    {metodo.quantidade !==
                                                    1
                                                        ? "s"
                                                        : ""}
                                                </small>
                                            </div>

                                            <strong>
                                                {money(
                                                    metodo.valor,
                                                )}
                                            </strong>
                                        </div>
                                    ),
                                )
                            ) : (
                                <p className="bp-section-subtitle">
                                    Nenhum
                                    pagamento
                                    aprovado no
                                    período.
                                </p>
                            )}
                        </div>
                    </CardBody>
                </Card>
            </section>
        </AppShell>
    );
}