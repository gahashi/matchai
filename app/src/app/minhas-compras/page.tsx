import type {
    Metadata,
} from "next";
import Link from "next/link";
import {
    Package,
    ShoppingBag,
} from "lucide-react";
import {
    redirect,
} from "next/navigation";

import {
    PublicStoreShell,
} from "@/components/public/PublicStoreShell";
import {
    AppLink,
} from "@/components/ui/AppLink";
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
    title: "Minhas compras | AAACCU",
};


type BadgeColor =
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "info";

type PageProps = {
    searchParams: Promise<{
        status?: string;
    }>;
};

type AbaCode =
    | "todas"
    | "andamento"
    | "concluidas"
    | "canceladas";


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
        },
    ).format(date);
}

function normalizeAba(
    value?: string,
): AbaCode {
    if (
        value === "andamento" ||
        value === "concluidas" ||
        value === "canceladas"
    ) {
        return value;
    }

    return "todas";
}


export default async function MinhasComprasPage({
                                                    searchParams,
                                                }: PageProps) {
    const session =
        await getAuthSession();

    if (!session) {
        redirect(
            "/login?next=/minhas-compras",
        );
    }

    const {
        status,
    } =
        await searchParams;

    const abaAtiva =
        normalizeAba(status);

    const compras =
        await pedidoPublicService
            .listUserOrders(
                session.user.id,
            );

    const emAndamento =
        compras.filter(
            (pedido) =>
                pedido.status.codigo !==
                "entregue" &&
                pedido.status.codigo !==
                "cancelado",
        );

    const concluidas =
        compras.filter(
            (pedido) =>
                pedido.status.codigo ===
                "entregue",
        );

    const canceladas =
        compras.filter(
            (pedido) =>
                pedido.status.codigo ===
                "cancelado",
        );

    const pedidosExibidos =
        abaAtiva === "andamento"
            ? emAndamento
            : abaAtiva === "concluidas"
                ? concluidas
                : abaAtiva === "canceladas"
                    ? canceladas
                    : compras;

    const abas = [
        {
            codigo: "todas" as const,
            label: "Todas",
            quantidade:
            compras.length,
        },
        {
            codigo: "andamento" as const,
            label: "Em andamento",
            quantidade:
            emAndamento.length,
        },
        {
            codigo: "concluidas" as const,
            label: "Concluídas",
            quantidade:
            concluidas.length,
        },
        {
            codigo: "canceladas" as const,
            label: "Canceladas",
            quantidade:
            canceladas.length,
        },
    ];

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
                <div className="bp-mb-24">
                    <span className="bp-public-kicker">
                        Pedidos
                    </span>

                    <h1
                        style={{
                            margin:
                                "6px 0 4px",
                        }}
                    >
                        Minhas compras
                    </h1>

                    <p
                        style={{
                            margin: 0,
                            color:
                                "var(--color-text-muted)",
                        }}
                    >
                        Veja seus pedidos e acompanhe
                        o status atual de cada compra.
                    </p>
                </div>

                {compras.length === 0 ? (
                    <div className="bp-card">
                        <div
                            className="bp-card-body"
                            style={{
                                minHeight: 180,
                                display:
                                    "grid",
                                placeItems:
                                    "center",
                                textAlign:
                                    "center",
                            }}
                        >
                            <div
                                className="bp-grid"
                                style={{
                                    justifyItems:
                                        "center",
                                }}
                            >
                                <ShoppingBag
                                    size={28}
                                />

                                <strong>
                                    Você ainda não possui
                                    compras.
                                </strong>

                                <Link
                                    href="/"
                                    className="bp-link"
                                >
                                    Ver produtos
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <nav
                            className="bp-action-row bp-mb-24"
                            aria-label="Filtrar compras"
                        >
                            {abas.map(
                                (aba) => {
                                    const ativa =
                                        aba.codigo ===
                                        abaAtiva;

                                    const href =
                                        aba.codigo ===
                                        "todas"
                                            ? "/minhas-compras"
                                            : `/minhas-compras?status=${aba.codigo}`;

                                    return (
                                        <AppLink
                                            key={
                                                aba.codigo
                                            }
                                            href={
                                                href
                                            }
                                            size="sm"
                                            color={
                                                ativa
                                                    ? "primary"
                                                    : "secondary"
                                            }
                                            variant={
                                                ativa
                                                    ? "solid"
                                                    : "soft"
                                            }
                                        >
                                            {
                                                aba.label
                                            }
                                            {" "}
                                            ({
                                            aba.quantidade
                                        })
                                        </AppLink>
                                    );
                                },
                            )}
                        </nav>

                        <div
                            className="bp-row-between bp-mb-16"
                        >
                            <strong>
                                {
                                    abas.find(
                                        (aba) =>
                                            aba.codigo ===
                                            abaAtiva,
                                    )?.label
                                }
                            </strong>

                            <span
                                style={{
                                    color:
                                        "var(--color-text-muted)",
                                    fontSize:
                                        12,
                                }}
                            >
                                {
                                    pedidosExibidos.length
                                }{" "}
                                pedido(s)
                            </span>
                        </div>

                        {pedidosExibidos.length ===
                        0 ? (
                            <div className="bp-card">
                                <div className="bp-card-body">
                                    <span
                                        style={{
                                            color:
                                                "var(--color-text-muted)",
                                        }}
                                    >
                                        Nenhuma compra nesta categoria.
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="bp-grid bp-grid-2">
                                {pedidosExibidos.map(
                                    (
                                        pedido,
                                    ) => (
                                        <Link
                                            key={
                                                pedido.id
                                            }
                                            href={`/minhas-compras/${pedido.codigo}`}
                                            className="bp-card"
                                            style={{
                                                textDecoration:
                                                    "none",
                                                color:
                                                    "inherit",
                                            }}
                                        >
                                            <div
                                                className="bp-card-body"
                                                style={{
                                                    minHeight:
                                                        "100%",
                                                    display:
                                                        "grid",
                                                    alignContent:
                                                        "space-between",
                                                    gap: 16,
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
                                                                    16,
                                                            }}
                                                        >
                                                            {
                                                                pedido.codigo
                                                            }
                                                        </strong>
                                                    </div>

                                                    <Badge
                                                        color={normalizeBadgeColor(
                                                            pedido
                                                                .status
                                                                .color,
                                                        )}
                                                    >
                                                        {
                                                            pedido
                                                                .status
                                                                .descricao
                                                        }
                                                    </Badge>
                                                </div>

                                                <div
                                                    className="bp-grid"
                                                    style={{
                                                        gap: 6,
                                                    }}
                                                >
                                                    <strong
                                                        style={{
                                                            fontSize:
                                                                13,
                                                        }}
                                                    >
                                                        {pedido
                                                                .primeiro_item
                                                                ?.produto_nome ??
                                                            "Pedido"}
                                                        {pedido
                                                            .quantidade_itens >
                                                        1
                                                            ? ` + ${pedido.quantidade_itens - 1} item(ns)`
                                                            : ""}
                                                    </strong>

                                                    <span
                                                        style={{
                                                            color:
                                                                "var(--color-text-muted)",
                                                            fontSize:
                                                                12,
                                                        }}
                                                    >
                                                        {formatDate(
                                                            pedido.created_at,
                                                        )}
                                                        {" • "}
                                                        {money(
                                                            pedido.valor_total,
                                                        )}
                                                    </span>

                                                    {pedido.previsao_entrega ? (
                                                        <span
                                                            style={{
                                                                color:
                                                                    "var(--color-text-muted)",
                                                                fontSize:
                                                                    12,
                                                            }}
                                                        >
                                                            Previsão:{" "}
                                                            {formatDate(
                                                                pedido.previsao_entrega,
                                                            )}
                                                        </span>
                                                    ) : null}
                                                </div>

                                                <div
                                                    className="bp-row"
                                                    style={{
                                                        fontSize:
                                                            12,
                                                        fontWeight:
                                                            700,
                                                    }}
                                                >
                                                    <Package
                                                        size={
                                                            15
                                                        }
                                                    />
                                                    Ver detalhes
                                                </div>
                                            </div>
                                        </Link>
                                    ),
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </PublicStoreShell>
    );
}
