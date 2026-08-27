import type {
    Metadata,
} from "next";
import Link from "next/link";
import {
    ArrowLeft,
    Clock3,
    Package,
    ReceiptText,
} from "lucide-react";
import {
    notFound,
    redirect,
} from "next/navigation";

import {
    PublicStoreShell,
} from "@/components/public/PublicStoreShell";
import {
    Badge,
} from "@/components/ui/Badge";
import {
    getAuthSession,
} from "@/lib/auth/session";
import {
    pedidoPublicService,
} from "@/lib/vnd/pedido-public-service";


export const metadata: Metadata = {
    title: "Detalhe da compra | AAACCU",
};


type BadgeColor =
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "info";

type PageProps = {
    params: Promise<{
        codigo: string;
    }>;
};


function normalizeBadgeColor(
    color: string | null,
): BadgeColor {
    switch (color) {
        case "primary":
        case "success":
        case "warning":
        case "danger":
        case "info":
            return color;

        default:
            return "secondary";
    }
}

function money(value: number) {
    return new Intl.NumberFormat(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL",
        },
    ).format(value);
}

function formatDate(
    value:
        | string
        | Date
        | null,
) {
    if (!value) {
        return "—";
    }

    const date =
        value instanceof Date
            ? value
            : new Date(value);

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return "—";
    }

    return new Intl.DateTimeFormat(
        "pt-BR",
        {
            dateStyle: "short",
            timeStyle: "short",
        },
    ).format(date);
}

function formatDay(
    value:
        | string
        | Date
        | null,
) {
    if (!value) {
        return "—";
    }

    const date =
        value instanceof Date
            ? value
            : new Date(value);

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        return "—";
    }

    return new Intl.DateTimeFormat(
        "pt-BR",
        {
            dateStyle: "short",
        },
    ).format(date);
}


export default async function MinhaCompraDetalhePage({
                                                         params,
                                                     }: PageProps) {
    const session =
        await getAuthSession();

    if (!session) {
        redirect(
            "/login?next=/minhas-compras",
        );
    }

    const {
        codigo,
    } =
        await params;

    const pedido =
        await pedidoPublicService
            .findUserOrderByCode({
                sysUsuarioId:
                session.user.id,

                codigo,
            });

    if (!pedido) {
        notFound();
    }

    return (
        <PublicStoreShell
            user={{
                nome:
                session.user.nome,

                avatar_url:
                    session.user
                        .avatar_url ??
                    null,

                isAdmin:
                    session.user
                        .sys_usuario_tipo
                        .codigo ===
                    "admin",
            }}
        >
            <div className="bp-public-container">
                <Link
                    href="/minhas-compras"
                    className="bp-link"
                    style={{
                        display:
                            "inline-flex",
                        alignItems:
                            "center",
                        gap: 6,
                        marginBottom:
                            16,
                    }}
                >
                    <ArrowLeft
                        size={16}
                    />
                    Minhas compras
                </Link>

                <div className="bp-grid">
                    <div className="bp-card">
                        <div
                            className="bp-card-body"
                            style={{
                                display:
                                    "grid",
                                gap: 10,
                            }}
                        >
                            <div
                                className="bp-row-between"
                                style={{
                                    alignItems:
                                        "flex-start",
                                }}
                            >
                                <div>
                                    <div
                                        style={{
                                            color:
                                                "var(--color-text-soft)",
                                            fontSize:
                                                11,
                                            marginBottom:
                                                3,
                                        }}
                                    >
                                        Pedido
                                    </div>

                                    <strong
                                        style={{
                                            fontSize:
                                                20,
                                        }}
                                    >
                                        {
                                            pedido.codigo
                                        }
                                    </strong>
                                </div>

                                <Badge
                                    color={normalizeBadgeColor(
                                        pedido.status
                                            .color,
                                    )}
                                >
                                    {
                                        pedido.status
                                            .descricao
                                    }
                                </Badge>
                            </div>

                            <span
                                style={{
                                    color:
                                        "var(--color-text-muted)",
                                    fontSize:
                                        12,
                                }}
                            >
                                Realizado em{" "}
                                {formatDate(
                                    pedido.created_at,
                                )}
                                {" • "}
                                {money(
                                    pedido.valor_total,
                                )}
                            </span>
                        </div>
                    </div>

                    <div className="bp-page-grid">
                        <section
                            className="bp-grid"
                            style={{
                                alignContent:
                                    "start",
                            }}
                        >
                            <div className="bp-row">
                                <Package
                                    size={17}
                                />

                                <strong>
                                    Itens da compra
                                </strong>
                            </div>

                            {pedido.itens.map(
                                (item) => (
                                    <div
                                        key={
                                            item.id
                                        }
                                        className="bp-card"
                                    >
                                        <div
                                            className="bp-card-body"
                                            style={{
                                                display:
                                                    "grid",
                                                gap: 12,
                                            }}
                                        >
                                            <div
                                                className="bp-row-between"
                                                style={{
                                                    alignItems:
                                                        "flex-start",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        minWidth:
                                                            0,
                                                    }}
                                                >
                                                    <strong>
                                                        {
                                                            item.produto_nome
                                                        }
                                                    </strong>

                                                    {item.variacao ? (
                                                        <div
                                                            style={{
                                                                marginTop:
                                                                    3,
                                                                color:
                                                                    "var(--color-text-muted)",
                                                                fontSize:
                                                                    12,
                                                            }}
                                                        >
                                                            {
                                                                item.variacao
                                                            }
                                                        </div>
                                                    ) : null}
                                                </div>

                                                <Badge color="secondary">
                                                    {
                                                        item.quantidade
                                                    }{" "}
                                                    un.
                                                </Badge>
                                            </div>

                                            {item.previsao_entrega ? (
                                                <div
                                                    style={{
                                                        paddingTop:
                                                            10,
                                                        borderTop:
                                                            "1px solid var(--color-border-soft)",
                                                        color:
                                                            "var(--color-text-muted)",
                                                        fontSize:
                                                            12,
                                                    }}
                                                >
                                                    Previsão de entrega:{" "}
                                                    <strong
                                                        style={{
                                                            color:
                                                                "var(--color-text)",
                                                        }}
                                                    >
                                                        {formatDay(
                                                            item.previsao_entrega,
                                                        )}
                                                    </strong>
                                                </div>
                                            ) : null}

                                            {item.componentes.length >
                                            0 ? (
                                                <div
                                                    style={{
                                                        paddingTop:
                                                            10,
                                                        borderTop:
                                                            "1px solid var(--color-border-soft)",
                                                        display:
                                                            "grid",
                                                        gap: 8,
                                                        fontSize:
                                                            12,
                                                    }}
                                                >
                                                    <strong>
                                                        Itens do kit
                                                    </strong>

                                                    {item.componentes.map(
                                                        (
                                                            componente,
                                                        ) => (
                                                            <div
                                                                key={
                                                                    componente.id
                                                                }
                                                                className="bp-row-between"
                                                            >
                                                                <span>
                                                                    {
                                                                        componente.produto_nome
                                                                    }
                                                                    {componente.variacao
                                                                        ? ` • ${componente.variacao}`
                                                                        : ""}
                                                                </span>

                                                                <span
                                                                    style={{
                                                                        color:
                                                                            "var(--color-text-muted)",
                                                                    }}
                                                                >
                                                                    {
                                                                        componente.quantidade
                                                                    }{" "}
                                                                    un.
                                                                </span>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                ),
                            )}
                        </section>

                        <aside
                            className="bp-grid"
                            style={{
                                alignContent:
                                    "start",
                            }}
                        >
                            <div className="bp-row">
                                <ReceiptText
                                    size={17}
                                />

                                <strong>
                                    Pagamento
                                </strong>
                            </div>

                            <section className="bp-card">
                                <div
                                    className="bp-card-body"
                                    style={{
                                        display:
                                            "grid",
                                        gap: 14,
                                    }}
                                >
                                    {pedido.pagamento ? (
                                        <>
                                            <div className="bp-row-between">
                                                <div
                                                    style={{
                                                        display:
                                                            "grid",
                                                        gap: 3,
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            color:
                                                                "var(--color-text-soft)",
                                                            fontSize:
                                                                11,
                                                        }}
                                                    >
                                                        Método
                                                    </span>

                                                    <strong>
                                                        {
                                                            pedido
                                                                .pagamento
                                                                .metodo
                                                                .descricao
                                                        }
                                                    </strong>
                                                </div>

                                                <Badge
                                                    color={normalizeBadgeColor(
                                                        pedido
                                                            .pagamento
                                                            .status
                                                            .color,
                                                    )}
                                                >
                                                    {
                                                        pedido
                                                            .pagamento
                                                            .status
                                                            .descricao
                                                    }
                                                </Badge>
                                            </div>

                                            <div
                                                style={{
                                                    paddingTop:
                                                        12,
                                                    borderTop:
                                                        "1px solid var(--color-border-soft)",
                                                    display:
                                                        "grid",
                                                    gap: 3,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        color:
                                                            "var(--color-text-soft)",
                                                        fontSize:
                                                            11,
                                                    }}
                                                >
                                                    Total
                                                </span>

                                                <strong
                                                    style={{
                                                        fontSize:
                                                            20,
                                                    }}
                                                >
                                                    {money(
                                                        pedido
                                                            .pagamento
                                                            .valor,
                                                    )}
                                                </strong>
                                            </div>
                                        </>
                                    ) : (
                                        <span
                                            style={{
                                                color:
                                                    "var(--color-text-muted)",
                                                fontSize:
                                                    13,
                                            }}
                                        >
                                            Nenhum pagamento registrado.
                                        </span>
                                    )}
                                </div>
                            </section>
                        </aside>
                    </div>

                    <section
                        className="bp-grid"
                        style={{
                            marginTop: 8,
                        }}
                    >
                        <div className="bp-row">
                            <Clock3
                                size={17}
                            />

                            <strong>
                                Andamento do pedido
                            </strong>
                        </div>

                        <div className="bp-card">
                            <div
                                className="bp-card-body"
                                style={{
                                    display:
                                        "grid",
                                    gap: 0,
                                }}
                            >
                                {pedido.historico.map(
                                    (
                                        historico,
                                        index,
                                    ) => (
                                        <div
                                            key={
                                                historico.id
                                            }
                                            className="bp-row-between"
                                            style={{
                                                minHeight:
                                                    44,
                                                padding:
                                                    "8px 0",
                                                borderTop:
                                                    index ===
                                                    0
                                                        ? undefined
                                                        : "1px solid var(--color-border-soft)",
                                            }}
                                        >
                                            <Badge
                                                color={normalizeBadgeColor(
                                                    historico
                                                        .status
                                                        .color,
                                                )}
                                            >
                                                {
                                                    historico
                                                        .status
                                                        .descricao
                                                }
                                            </Badge>

                                            <span
                                                style={{
                                                    color:
                                                        "var(--color-text-muted)",
                                                    fontSize:
                                                        12,
                                                }}
                                            >
                                                {formatDate(
                                                    historico.created_at,
                                                )}
                                            </span>
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </PublicStoreShell>
    );
}
