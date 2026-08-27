"use client";

import { FormEvent, useState } from "react";
import { Clock3, Loader2, Package, Search } from "lucide-react";

import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type BadgeColor =
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "info";

type PedidoPublico = {
    codigo: string;
    cliente: {
        nome: string;
    };
    status: {
        codigo: string;
        descricao: string;
        color: string | null;
        icon: string | null;
    };
    entrega_tipo: {
        codigo: string;
        descricao: string;
    } | null;
    valor_total: number;
    created_at: string | Date | null;
    concluido_at: string | Date | null;
    cancelado_at: string | Date | null;
    itens: Array<{
        id: number;
        produto_nome: string;
        variacao: string | null;
        quantidade: number;
        previsao_entrega: string | Date | null;
        componentes: Array<{
            id: number;
            produto_nome: string;
            variacao: string | null;
            quantidade: number;
        }>;
    }>;
    historico: Array<{
        id: number;
        status: {
            codigo: string;
            descricao: string;
            color: string | null;
            icon: string | null;
        };
        created_at: string | Date | null;
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

function formatTelefone(value: string) {
    const numeros = value
        .replace(/\D/g, "")
        .slice(0, 11);

    if (numeros.length <= 2) {
        return numeros;
    }

    if (numeros.length <= 6) {
        return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    }

    if (numeros.length <= 10) {
        return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
    }

    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
}

function formatDate(
    value: string | Date | null,
) {
    if (!value) {
        return "—";
    }

    const date =
        value instanceof Date
            ? value
            : new Date(value);

    if (Number.isNaN(date.getTime())) {
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
    value: string | Date | null,
) {
    if (!value) {
        return "—";
    }

    const date =
        value instanceof Date
            ? value
            : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return new Intl.DateTimeFormat(
        "pt-BR",
        {
            dateStyle: "short",
        },
    ).format(date);
}

export function AcompanharPedidoClient() {
    const [codigo, setCodigo] =
        useState("");

    const [telefone, setTelefone] =
        useState("");

    const [pedido, setPedido] =
        useState<PedidoPublico | null>(
            null,
        );

    const [carregando, setCarregando] =
        useState(false);

    const [erro, setErro] =
        useState<string | null>(
            null,
        );

    async function consultar(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        const codigoNormalizado =
            codigo.trim().toUpperCase();

        const telefoneNumeros =
            telefone.replace(/\D/g, "");

        if (
            !codigoNormalizado ||
            telefoneNumeros.length < 10
        ) {
            setPedido(null);
            setErro(
                "Informe o código do pedido e um telefone válido com DDD.",
            );
            return;
        }

        try {
            setCarregando(true);
            setErro(null);
            setPedido(null);

            const response =
                await fetch(
                    "/api/public/pedidos/acompanhar",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                            Accept:
                                "application/json",
                        },
                        body: JSON.stringify({
                            codigo:
                            codigoNormalizado,
                            telefone:
                            telefoneNumeros,
                        }),
                    },
                );

            const result =
                await response.json();

            if (
                !response.ok ||
                !result.ok
            ) {
                throw new Error(
                    result.message ||
                    "Não foi possível consultar o pedido.",
                );
            }

            setPedido(
                result.data.pedido,
            );
        } catch (error) {
            setErro(
                error instanceof Error
                    ? error.message
                    : "Não foi possível consultar o pedido.",
            );
        } finally {
            setCarregando(false);
        }
    }

    return (
        <div className="bp-public-container bp-public-order-lookup-page">
            <section className="bp-public-order-lookup-card">
                <div className="bp-public-order-lookup-icon">
                    <Package size={27} />
                </div>

                <div className="bp-public-order-lookup-heading">
                    <span className="bp-public-kicker">
                        Pedidos
                    </span>

                    <h1>
                        Acompanhar pedido
                    </h1>

                    <p>
                        Informe o código público do pedido e o telefone usado na compra.
                    </p>
                </div>

                <form
                    className="bp-public-order-lookup-form"
                    onSubmit={
                        consultar
                    }
                >
                    <Input
                        label="Código do pedido"
                        value={
                            codigo
                        }
                        onChange={(event) =>
                            setCodigo(
                                event.target.value
                                    .toUpperCase()
                                    .replace(
                                        /[^A-Z0-9]/g,
                                        "",
                                    ),
                            )
                        }
                        placeholder="Ex.: A9F6TR"
                        autoComplete="off"
                        required
                    />

                    <Input
                        type="tel"
                        inputMode="numeric"
                        label="Telefone da compra"
                        value={
                            telefone
                        }
                        onChange={(event) =>
                            setTelefone(
                                formatTelefone(
                                    event.target.value,
                                ),
                            )
                        }
                        placeholder="(47) 99999-9999"
                        maxLength={15}
                        required
                    />

                    <Button
                        type="submit"
                        fullWidth
                        disabled={
                            carregando
                        }
                    >
                        {carregando ? (
                            <Loader2
                                size={17}
                            />
                        ) : (
                            <Search
                                size={17}
                            />
                        )}

                        {carregando
                            ? "Consultando..."
                            : "Consultar pedido"}
                    </Button>
                </form>

                {erro ? (
                    <Alert
                        color="danger"
                        title="Não foi possível localizar o pedido"
                    >
                        {erro}
                    </Alert>
                ) : null}
            </section>

            {pedido ? (
                <section
                    style={{
                        display: "grid",
                        gap: 16,
                        marginTop: 18,
                    }}
                >
                    <div className="bp-card">
                        <div
                            className="bp-card-body"
                            style={{
                                display:
                                    "grid",
                                gap: 14,
                            }}
                        >
                            <div className="bp-row-between">
                                <div>
                                    <div
                                        style={{
                                            color:
                                                "var(--color-text-muted)",
                                            fontSize:
                                                12,
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
                                        {pedido.codigo}
                                    </strong>
                                </div>

                                <Badge
                                    color={normalizeBadgeColor(
                                        pedido.status.color,
                                    )}
                                >
                                    {pedido.status.descricao}
                                </Badge>
                            </div>

                            <div
                                style={{
                                    color:
                                        "var(--color-text-muted)",
                                    fontSize:
                                        13,
                                }}
                            >
                                Compra de{" "}
                                <strong>
                                    {pedido.cliente.nome}
                                </strong>
                                {" • "}
                                realizada em{" "}
                                {formatDate(
                                    pedido.created_at,
                                )}
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gap: 12,
                        }}
                    >
                        <div
                            style={{
                                display:
                                    "flex",
                                alignItems:
                                    "center",
                                gap: 8,
                            }}
                        >
                            <Package size={17} />
                            <strong>
                                Itens do pedido
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
                                            gap: 10,
                                        }}
                                    >
                                        <div className="bp-row-between">
                                            <div>
                                                <strong>
                                                    {item.produto_nome}
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
                                                        {item.variacao}
                                                    </div>
                                                ) : null}
                                            </div>

                                            <Badge color="secondary">
                                                {item.quantidade} un.
                                            </Badge>
                                        </div>

                                        {item.previsao_entrega ? (
                                            <Alert
                                                color="info"
                                                title="Previsão de entrega"
                                            >
                                                {formatDay(
                                                    item.previsao_entrega,
                                                )}
                                            </Alert>
                                        ) : null}

                                        {item.componentes.length > 0 ? (
                                            <div
                                                style={{
                                                    display:
                                                        "grid",
                                                    gap: 7,
                                                }}
                                            >
                                                <strong
                                                    style={{
                                                        fontSize:
                                                            12,
                                                    }}
                                                >
                                                    Itens do kit
                                                </strong>

                                                {item.componentes.map(
                                                    (componente) => (
                                                        <div
                                                            key={
                                                                componente.id
                                                            }
                                                            className="bp-row-between"
                                                            style={{
                                                                fontSize:
                                                                    12,
                                                            }}
                                                        >
                                                            <span>
                                                                {componente.produto_nome}
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
                                                                {componente.quantidade} un.
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
                    </div>

                    <div
                        style={{
                            display: "grid",
                            gap: 12,
                        }}
                    >
                        <div
                            style={{
                                display:
                                    "flex",
                                alignItems:
                                    "center",
                                gap: 8,
                            }}
                        >
                            <Clock3 size={17} />
                            <strong>
                                Andamento
                            </strong>
                        </div>

                        {pedido.historico.map(
                            (historico) => (
                                <div
                                    key={
                                        historico.id
                                    }
                                    className="bp-card"
                                >
                                    <div
                                        className="bp-card-body"
                                        style={{
                                            display:
                                                "grid",
                                            gap: 7,
                                        }}
                                    >
                                        <div className="bp-row-between">
                                            <Badge
                                                color={normalizeBadgeColor(
                                                    historico.status.color,
                                                )}
                                            >
                                                {historico.status.descricao}
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
                                    </div>
                                </div>
                            ),
                        )}
                    </div>
                </section>
            ) : null}
        </div>
    );
}
