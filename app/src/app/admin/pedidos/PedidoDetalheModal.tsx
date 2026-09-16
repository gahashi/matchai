"use client";

import {
    useEffect,
    useState,
} from "react";

import {
    Clock3,
    Loader2,
    Mail,
    Package,
    ReceiptText,
    UserRound,
} from "lucide-react";

import {
    Alert,
} from "@/components/ui/Alert";

import {
    Badge,
} from "@/components/ui/Badge";

import {
    Button,
} from "@/components/ui/Button";

import {
    Modal,
} from "@/components/ui/Modal";

import {
    Textarea,
} from "@/components/ui/Textarea";


type BadgeColor =
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "info";

type PedidoDetalhe = {
    id: number;
    codigo: string;
    origem: string;

    data_original:
        | string
        | Date
        | null;

    cliente: {
        nome: string;
        email: string | null;
        telefone: string;
    };

    status: {
        id: number;
        codigo: string;
        descricao: string;
        color: string | null;
        icon: string | null;
    };

    entrega_tipo: {
        id: number;
        codigo: string;
        descricao: string;
    } | null;

    entrega_endereco: string | null;
    retirada_local: string | null;
    observacao_cliente: string | null;

    valores: {
        produtos: number;
        desconto: number;
        frete: number;
        acrescimo: number;
        total: number;
    };

    itens: Array<{
        id: number;
        prd_produto_id: number | null;
        prd_produto_variacao_id: number | null;
        produto_codigo: string;
        produto_nome: string;
        variacao: string | null;
        previsao_entrega:
            | string
            | Date
            | null;
        quantidade: number;
        preco_tabela: number;
        preco_unitario: number;
        valor_desconto: number;
        subtotal: number;
        socio_aplicado: boolean;
        observacao: string | null;

        campos: Array<{
            id: number;
            codigo: string;
            nome: string;
            tipo: string;
            valor: string;
        }>;

        componentes: Array<{
            id: number;
            prd_produto_id: number;
            prd_produto_variacao_id:
                | number
                | null;
            produto_codigo: string;
            produto_nome: string;
            variacao: string | null;
            quantidade: number;

            campos: Array<{
                id: number;
                codigo: string;
                nome: string;
                tipo: string;
                valor: string;
            }>;
        }>;
    }>;

    pagamentos: Array<{
        id: number;
        valor: number;
        taxa_gateway: number | null;
        valor_liquido: number | null;
        provider: string | null;
        external_id: string | null;

        status: {
            codigo: string;
            descricao: string;
            color: string | null;
        };

        metodo: {
            codigo: string;
            descricao: string;
        };

        aprovado_at:
            | string
            | Date
            | null;

        expirado_at:
            | string
            | Date
            | null;

        cancelado_at:
            | string
            | Date
            | null;

        created_at:
            | string
            | Date
            | null;
    }>;

    historico: Array<{
        id: number;

        status: {
            codigo: string;
            descricao: string;
            color: string | null;
            icon: string | null;
        };

        operador: {
            id: number;
            nome: string;
        } | null;

        observacao: string | null;

        created_at:
            | string
            | Date
            | null;
    }>;

    created_at:
        | string
        | Date
        | null;

    updated_at:
        | string
        | Date
        | null;

    cancelado_at:
        | string
        | Date
        | null;

    concluido_at:
        | string
        | Date
        | null;
};

type PedidoDetalheResponse = {
    pedido: PedidoDetalhe;

    emails:
        PedidoEmailStatus[];

    proximos_status:
        string[];
};

type PedidoEmailStatus = {
    evento:
        | "confirmado"
        | "pronto_retirada"
        | "cancelado";

    label: string;
    template: string;
    status: string;

    error_message:
        | string
        | null;

    sent_at:
        | string
        | Date
        | null;

    created_at:
        | string
        | Date
        | null;

    can_resend: boolean;
};

type Props = {
    open: boolean;
    pedidoId: number | null;
    onClose: () => void;
    onUpdated: (message: string) => Promise<void> | void;
};


const STATUS_LABELS: Record<
    string,
    string
> = {
    recebido: "Pedido recebido",
    aguardando_pagamento:
        "Aguardando pagamento",
    confirmado: "Pedido confirmado",
    em_preparacao: "Em preparação",
    pronto_retirada:
        "Pronto para retirada",
    enviado: "Enviado",
    entregue: "Entregue",
    cancelado: "Cancelado",
};


const STATUS_ACTION_LABELS: Record<
    string,
    string
> = {
    aguardando_pagamento:
        "Aguardar pagamento",
    confirmado:
        "Confirmar pedido",
    em_preparacao:
        "Iniciar preparação",
    pronto_retirada:
        "Marcar como pronto",
    enviado:
        "Marcar como enviado",
    entregue:
        "Marcar como entregue",
};


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

function formatTelefone(
    value: string,
) {
    const numeros =
        value.replace(/\D/g, "");

    if (numeros.length === 11) {
        return `(${numeros.slice(
            0,
            2,
        )}) ${numeros.slice(
            2,
            7,
        )}-${numeros.slice(7)}`;
    }

    if (numeros.length === 10) {
        return `(${numeros.slice(
            0,
            2,
        )}) ${numeros.slice(
            2,
            6,
        )}-${numeros.slice(6)}`;
    }

    return value;
}

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

function getOrigemLabel(
    origem: string,
) {
    switch (origem) {
        case "manual":
            return "Manual";

        case "legado":
            return "Legado";

        case "loja":
            return "Loja";

        default:
            return origem;
    }
}


export function PedidoDetalheModal({
                                       open,
                                       pedidoId,
                                       onClose,
                                       onUpdated,
                                   }: Props) {
    const [
        detalhe,
        setDetalhe,
    ] =
        useState<PedidoDetalheResponse | null>(
            null,
        );

    const [carregando, setCarregando] =
        useState(false);

    const [erro, setErro] =
        useState<string | null>(
            null,
        );

    const [
        atualizandoStatus,
        setAtualizandoStatus,
    ] =
        useState(false);

    const [
        reenviandoEmail,
        setReenviandoEmail,
    ] =
        useState<string | null>(
            null,
        );

    const [
        observacaoStatus,
        setObservacaoStatus,
    ] =
        useState("");


    useEffect(() => {
        if (
            !open ||
            !pedidoId
        ) {
            setDetalhe(null);
            setErro(null);
            setObservacaoStatus("");
            return;
        }

        const controller =
            new AbortController();

        async function carregar() {
            try {
                setCarregando(true);
                setErro(null);
                setDetalhe(null);
                setObservacaoStatus("");

                const response =
                    await fetch(
                        `/api/admin/pedidos/${pedidoId}`,
                        {
                            headers: {
                                Accept:
                                    "application/json",
                            },

                            signal:
                            controller.signal,
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
                        "Não foi possível carregar o pedido.",
                    );
                }

                setDetalhe(
                    result.data,
                );
            } catch (error) {
                if (
                    error instanceof
                    DOMException &&
                    error.name ===
                    "AbortError"
                ) {
                    return;
                }

                setErro(
                    error instanceof Error
                        ? error.message
                        : "Não foi possível carregar o pedido.",
                );
            } finally {
                if (
                    !controller.signal
                        .aborted
                ) {
                    setCarregando(
                        false,
                    );
                }
            }
        }

        void carregar();

        return () => {
            controller.abort();
        };
    }, [
        open,
        pedidoId,
    ]);


    async function atualizarStatus(
        statusCode: string,
    ) {
        if (!pedidoId) {
            return;
        }

        try {
            setAtualizandoStatus(true);
            setErro(null);

            const response =
                await fetch(
                    `/api/admin/pedidos/${pedidoId}`,
                    {
                        method: "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json",
                            Accept:
                                "application/json",
                        },

                        body: JSON.stringify({
                            action:
                                "set_status",
                            status_code:
                            statusCode,
                            observacao:
                                observacaoStatus.trim() ||
                                null,
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
                    "Não foi possível atualizar o status do pedido.",
                );
            }

            setDetalhe(
                result.data,
            );

            setObservacaoStatus("");

            await onUpdated(
                result.message ||
                "Status do pedido atualizado com sucesso.",
            );
        } catch (error) {
            setErro(
                error instanceof Error
                    ? error.message
                    : "Não foi possível atualizar o status do pedido.",
            );
        } finally {
            setAtualizandoStatus(false);
        }
    }

    async function reenviarEmail(
        evento: PedidoEmailStatus["evento"],
    ) {
        if (!pedidoId) {
            return;
        }

        try {
            setReenviandoEmail(
                evento,
            );

            setErro(null);

            const response =
                await fetch(
                    `/api/admin/pedidos/${pedidoId}`,
                    {
                        method: "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json",

                            Accept:
                                "application/json",
                        },

                        body: JSON.stringify({
                            action:
                                "resend_email",

                            evento,
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
                    "Não foi possível reenviar o e-mail.",
                );
            }

            setDetalhe(
                result.data,
            );

            await onUpdated(
                result.message ||
                "E-mail reenviado com sucesso.",
            );
        } catch (error) {
            setErro(
                error instanceof Error
                    ? error.message
                    : "Não foi possível reenviar o e-mail.",
            );
        } finally {
            setReenviandoEmail(
                null,
            );
        }
    }


    const pedido =
        detalhe?.pedido ?? null;

    const proximosStatus =
        detalhe?.proximos_status ?? [];

    const emails =
        detalhe?.emails ?? [];

    const proximosStatusOperacionais =
        proximosStatus.filter(
            (status) =>
                status !== "cancelado",
        );

    return (
        <Modal
            open={open}
            size="xl"
            scrollMode="body"
            title={
                pedido
                    ? `Pedido ${pedido.codigo}`
                    : "Detalhe do pedido"
            }
            description={
                pedido
                    ? `Pedido #${pedido.id}`
                    : "Carregando informações do pedido."
            }
            onCloseAction={
                onClose
            }
        >
            {carregando ? (
                <div
                    style={{
                        minHeight:
                            220,
                        display:
                            "grid",
                        placeItems:
                            "center",
                    }}
                >
                    <div
                        style={{
                            display:
                                "inline-flex",
                            alignItems:
                                "center",
                            gap: 10,
                            color:
                                "var(--color-text-muted)",
                        }}
                    >
                        <Loader2
                            size={20}
                        />
                        Carregando pedido...
                    </div>
                </div>
            ) : erro ? (
                <Alert
                    color="danger"
                    title="Erro ao carregar pedido"
                >
                    {erro}
                </Alert>
            ) : pedido ? (
                <div
                    style={{
                        display: "grid",
                        gap: 18,
                    }}
                >
                    <div className="bp-row-between">
                        <div className="bp-badge-row">
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

                            <Badge color="secondary">
                                {getOrigemLabel(
                                    pedido.origem,
                                )}
                            </Badge>

                            {pedido.entrega_tipo ? (
                                <Badge color="info">
                                    {
                                        pedido
                                            .entrega_tipo
                                            .descricao
                                    }
                                </Badge>
                            ) : null}
                        </div>

                        <strong
                            style={{
                                fontSize: 22,
                            }}
                        >
                            {money(
                                pedido.valores
                                    .total,
                            )}
                        </strong>
                    </div>

                    {proximosStatusOperacionais.length >
                    0 ? (
                        <section className="bp-card bp-card-soft">
                            <div
                                className="bp-card-body"
                                style={{
                                    display:
                                        "grid",
                                    gap: 14,
                                }}
                            >
                                <div>
                                    <strong>
                                        Próxima ação
                                    </strong>

                                    <div
                                        style={{
                                            marginTop:
                                                4,
                                            color:
                                                "var(--color-text-muted)",
                                            fontSize:
                                                13,
                                            lineHeight:
                                                1.5,
                                        }}
                                    >
                                        Escolha somente uma
                                        etapa compatível com o
                                        estado atual do pedido.
                                    </div>
                                </div>

                                <Textarea
                                    label="Observação da atualização"
                                    value={
                                        observacaoStatus
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setObservacaoStatus(
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    rows={2}
                                    placeholder="Opcional"
                                    disabled={
                                        atualizandoStatus
                                    }
                                />

                                <div className="bp-action-row">
                                    {proximosStatusOperacionais.map(
                                        (
                                            status,
                                        ) => (
                                            <Button
                                                key={
                                                    status
                                                }
                                                onClick={() =>
                                                    void atualizarStatus(
                                                        status,
                                                    )
                                                }
                                                disabled={
                                                    atualizandoStatus
                                                }
                                            >
                                                {atualizandoStatus ? (
                                                    <Loader2
                                                        size={
                                                            16
                                                        }
                                                    />
                                                ) : null}

                                                {STATUS_ACTION_LABELS[
                                                        status
                                                        ] ??
                                                    STATUS_LABELS[
                                                        status
                                                        ] ??
                                                    status}
                                            </Button>
                                        ),
                                    )}
                                </div>
                            </div>
                        </section>
                    ) : null}


                        <section className="bp-card bp-card-outline">
                            <div
                                className="bp-card-body"
                                style={{
                                    display:
                                        "grid",
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
                                    <UserRound
                                        size={17}
                                    />
                                    <strong>
                                        Cliente
                                    </strong>
                                </div>

                                <div>
                                    <strong>
                                        {
                                            pedido
                                                .cliente
                                                .nome
                                        }
                                    </strong>

                                    <div
                                        style={{
                                            marginTop:
                                                5,
                                            display:
                                                "grid",
                                            gap: 3,
                                            color:
                                                "var(--color-text-muted)",
                                            fontSize:
                                                13,
                                        }}
                                    >
                                        <span>
                                            {formatTelefone(
                                                pedido
                                                    .cliente
                                                    .telefone,
                                            )}
                                        </span>

                                        {pedido
                                            .cliente
                                            .email ? (
                                            <span>
                                                {
                                                    pedido
                                                        .cliente
                                                        .email
                                                }
                                            </span>
                                        ) : null}
                                    </div>
                                </div>

                                {pedido.observacao_cliente ? (
                                    <Alert
                                        color="secondary"
                                        title="Observação do cliente"
                                    >
                                        {
                                            pedido.observacao_cliente
                                        }
                                    </Alert>
                                ) : null}
                            </div>
                        </section>


                        <section className="bp-card bp-card-outline">
                            <div
                                className="bp-card-body"
                                style={{
                                    display:
                                        "grid",
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
                                    <Clock3
                                        size={17}
                                    />
                                    <strong>
                                        Datas
                                    </strong>
                                </div>

                                <div
                                    style={{
                                        display:
                                            "grid",
                                        gap: 8,
                                        fontSize:
                                            13,
                                    }}
                                >
                                    <div>
                                        <span
                                            style={{
                                                color:
                                                    "var(--color-text-muted)",
                                            }}
                                        >
                                            Criado:
                                        </span>{" "}
                                        {formatDate(
                                            pedido.created_at,
                                        )}
                                    </div>

                                    {pedido.origem ===
                                    "legado" &&
                                    pedido.data_original ? (
                                        <div>
                                            <span
                                                style={{
                                                    color:
                                                        "var(--color-text-muted)",
                                                }}
                                            >
                                                Data
                                                original:
                                            </span>{" "}
                                            {formatDate(
                                                pedido.data_original,
                                            )}
                                        </div>
                                    ) : null}

                                    {pedido.concluido_at ? (
                                        <div>
                                            <span
                                                style={{
                                                    color:
                                                        "var(--color-text-muted)",
                                                }}
                                            >
                                                Concluído:
                                            </span>{" "}
                                            {formatDate(
                                                pedido.concluido_at,
                                            )}
                                        </div>
                                    ) : null}

                                    {pedido.cancelado_at ? (
                                        <div>
                                            <span
                                                style={{
                                                    color:
                                                        "var(--color-text-muted)",
                                                }}
                                            >
                                                Cancelado:
                                            </span>{" "}
                                            {formatDate(
                                                pedido.cancelado_at,
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </section>



                    <section
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
                            <Package
                                size={17}
                            />
                            <strong>
                                Itens
                            </strong>
                        </div>

                        {pedido.itens.map(
                            (item) => (
                                <div
                                    key={
                                        item.id
                                    }
                                    className="bp-card bp-card-outline"
                                >
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
                                                <strong>
                                                    {
                                                        item.produto_nome
                                                    }
                                                </strong>

                                                <div
                                                    style={{
                                                        marginTop:
                                                            4,
                                                        color:
                                                            "var(--color-text-muted)",
                                                        fontSize:
                                                            12,
                                                    }}
                                                >
                                                    {
                                                        item.produto_codigo
                                                    }
                                                    {item.variacao
                                                        ? ` • ${item.variacao}`
                                                        : ""}
                                                </div>
                                            </div>

                                            <strong>
                                                {money(
                                                    item.subtotal,
                                                )}
                                            </strong>
                                        </div>

                                        <div className="bp-badge-row">
                                            <Badge color="secondary">
                                                {
                                                    item.quantidade
                                                }{" "}
                                                unidade(s)
                                            </Badge>

                                            <Badge color="secondary">
                                                {money(
                                                    item.preco_unitario,
                                                )}{" "}
                                                cada
                                            </Badge>

                                            {item.socio_aplicado ? (
                                                <Badge color="success">
                                                    Valor de
                                                    sócio
                                                </Badge>
                                            ) : null}
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

                                        {item.campos.length >
                                        0 ? (
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
                                                            13,
                                                    }}
                                                >
                                                    Personalização
                                                </strong>

                                                {item.campos.map(
                                                    (
                                                        campo,
                                                    ) => (
                                                        <div
                                                            key={
                                                                campo.id
                                                            }
                                                            className="bp-row-between"
                                                            style={{
                                                                fontSize:
                                                                    13,
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    color:
                                                                        "var(--color-text-muted)",
                                                                }}
                                                            >
                                                                {
                                                                    campo.nome
                                                                }
                                                            </span>

                                                            <strong>
                                                                {
                                                                    campo.valor
                                                                }
                                                            </strong>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        ) : null}

                                        {item.componentes.length >
                                        0 ? (
                                            <div
                                                style={{
                                                    display:
                                                        "grid",
                                                    gap: 8,
                                                }}
                                            >
                                                <strong
                                                    style={{
                                                        fontSize:
                                                            13,
                                                    }}
                                                >
                                                    Componentes
                                                    do kit
                                                </strong>

                                                {item.componentes.map(
                                                    (
                                                        componente,
                                                    ) => (
                                                        <div
                                                            key={
                                                                componente.id
                                                            }
                                                            className="bp-card bp-card-soft"
                                                        >
                                                            <div
                                                                className="bp-card-body"
                                                                style={{
                                                                    display:
                                                                        "grid",
                                                                    gap: 8,
                                                                }}
                                                            >
                                                                <div className="bp-row-between">
                                                                    <div>
                                                                        <strong>
                                                                            {
                                                                                componente.produto_nome
                                                                            }
                                                                        </strong>

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
                                                                                componente.produto_codigo
                                                                            }
                                                                            {componente.variacao
                                                                                ? ` • ${componente.variacao}`
                                                                                : ""}
                                                                        </div>
                                                                    </div>

                                                                    <Badge color="secondary">
                                                                        {
                                                                            componente.quantidade
                                                                        }{" "}
                                                                        un.
                                                                    </Badge>
                                                                </div>

                                                                {componente.campos.map(
                                                                    (
                                                                        campo,
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                campo.id
                                                                            }
                                                                            className="bp-row-between"
                                                                            style={{
                                                                                fontSize:
                                                                                    13,
                                                                            }}
                                                                        >
                                                                            <span
                                                                                style={{
                                                                                    color:
                                                                                        "var(--color-text-muted)",
                                                                                }}
                                                                            >
                                                                                {
                                                                                    campo.nome
                                                                                }
                                                                            </span>

                                                                            <strong>
                                                                                {
                                                                                    campo.valor
                                                                                }
                                                                            </strong>
                                                                        </div>
                                                                    ),
                                                                )}
                                                            </div>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        ) : null}

                                        {item.observacao ? (
                                            <Alert color="secondary">
                                                {
                                                    item.observacao
                                                }
                                            </Alert>
                                        ) : null}
                                    </div>
                                </div>
                            ),
                        )}
                    </section>


                        <section className="bp-card bp-card-outline">
                            <div
                                className="bp-card-body"
                                style={{
                                    display:
                                        "grid",
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
                                    <ReceiptText
                                        size={17}
                                    />
                                    <strong>
                                        Pagamento
                                    </strong>
                                </div>

                                {pedido.pagamentos.length >
                                0 ? (
                                    pedido.pagamentos.map(
                                        (
                                            pagamento,
                                        ) => (
                                            <div
                                                key={
                                                    pagamento.id
                                                }
                                                className="bp-card bp-card-soft"
                                            >
                                                <div
                                                    className="bp-card-body"
                                                    style={{
                                                        display:
                                                            "grid",
                                                        gap: 8,
                                                    }}
                                                >
                                                    <div className="bp-row-between">
                                                        <Badge
                                                            color={normalizeBadgeColor(
                                                                pagamento
                                                                    .status
                                                                    .color,
                                                            )}
                                                        >
                                                            {
                                                                pagamento
                                                                    .status
                                                                    .descricao
                                                            }
                                                        </Badge>

                                                        <strong>
                                                            {money(
                                                                pagamento.valor,
                                                            )}
                                                        </strong>
                                                    </div>

                                                    <div
                                                        style={{
                                                            display:
                                                                "grid",
                                                            gap: 5,
                                                            color:
                                                                "var(--color-text-muted)",
                                                            fontSize:
                                                                12,
                                                        }}
                                                    >
                                                        <span>
                                                            {
                                                                pagamento
                                                                    .metodo
                                                                    .descricao
                                                            }
                                                        </span>
                                                        {pagamento.taxa_gateway !== null ? (
                                                            <span>
        Taxa do gateway:{" "}
                                                                <strong>
            {money(
                pagamento.taxa_gateway,
            )}
        </strong>
    </span>
                                                        ) : null}

                                                        {pagamento.valor_liquido !== null ? (
                                                            <span>
        Valor líquido:{" "}
                                                                <strong>
            {money(
                pagamento.valor_liquido,
            )}
        </strong>
    </span>
                                                        ) : null}

                                                        {pagamento.provider ? (
                                                            <span>
                                                                Provider:{" "}
                                                                {
                                                                    pagamento.provider
                                                                }
                                                            </span>
                                                        ) : null}

                                                        <span>
                                                            Criado:{" "}
                                                            {formatDate(
                                                                pagamento.created_at,
                                                            )}
                                                        </span>

                                                        {pagamento.aprovado_at ? (
                                                            <span>
                                                                Aprovado:{" "}
                                                                {formatDate(
                                                                    pagamento.aprovado_at,
                                                                )}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                        ),
                                    )
                                ) : (
                                    <span
                                        style={{
                                            color:
                                                "var(--color-text-muted)",
                                            fontSize:
                                                13,
                                        }}
                                    >
                                        Nenhum pagamento
                                        registrado.
                                    </span>
                                )}
                            </div>
                        </section>


                        <section className="bp-card bp-card-outline">
                            <div
                                className="bp-card-body"
                                style={{
                                    display:
                                        "grid",
                                    gap: 12,
                                }}
                            >
                                <strong>
                                    Valores
                                </strong>

                                <div
                                    style={{
                                        display:
                                            "grid",
                                        gap: 8,
                                        fontSize:
                                            13,
                                    }}
                                >
                                    <div className="bp-row-between">
                                        <span>
                                            Produtos
                                        </span>
                                        <strong>
                                            {money(
                                                pedido
                                                    .valores
                                                    .produtos,
                                            )}
                                        </strong>
                                    </div>

                                    <div className="bp-row-between">
                                        <span>
                                            Desconto
                                        </span>
                                        <strong>
                                            {money(
                                                pedido
                                                    .valores
                                                    .desconto,
                                            )}
                                        </strong>
                                    </div>

                                    <div className="bp-row-between">
                                        <span>
                                            Frete
                                        </span>
                                        <strong>
                                            {money(
                                                pedido
                                                    .valores
                                                    .frete,
                                            )}
                                        </strong>
                                    </div>

                                    <div className="bp-row-between">
                                        <span>
                                            Taxa cobrada do cliente
                                        </span>
                                        <strong>
                                            {money(
                                                pedido
                                                    .valores
                                                    .acrescimo,
                                            )}
                                        </strong>
                                    </div>

                                    <div className="bp-row-between">
                                        <strong>
                                            Total
                                        </strong>

                                        <strong
                                            style={{
                                                fontSize:
                                                    18,
                                            }}
                                        >
                                            {money(
                                                pedido
                                                    .valores
                                                    .total,
                                            )}
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        </section>

                    {emails.length > 0 ? (
                        <section className="bp-card bp-card-outline">
                            <div
                                className="bp-card-body"
                                style={{
                                    display: "grid",
                                    gap: 12,
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                    }}
                                >
                                    <Mail size={17}/>

                                    <strong>
                                        E-mails do pedido
                                    </strong>
                                </div>

                                {emails.map(
                                    (email) => (
                                        <div
                                            key={
                                                email.evento
                                            }
                                            className="bp-card bp-card-soft"
                                        >
                                            <div
                                                className="bp-card-body"
                                                style={{
                                                    display:
                                                        "grid",

                                                    gap: 8,
                                                }}
                                            >
                                                <div className="bp-row-between">
                                                    <strong>
                                                        {
                                                            email.label
                                                        }
                                                    </strong>

                                                    <Badge
                                                        color={
                                                            email.status ===
                                                            "sent"
                                                                ? "success"
                                                                : email.status ===
                                                                "failed"
                                                                    ? "danger"
                                                                    : "secondary"
                                                        }
                                                    >
                                                        {email.status ===
                                                        "sent"
                                                            ? "Enviado"
                                                            : email.status ===
                                                            "failed"
                                                                ? "Falhou"
                                                                : email.status}
                                                    </Badge>
                                                </div>

                                                <div
                                                    style={{
                                                        display:
                                                            "grid",

                                                        gap: 4,

                                                        color:
                                                            "var(--color-text-muted)",

                                                        fontSize:
                                                            12,
                                                    }}
                                                >
                                                    {email.sent_at ? (
                                                        <span>
                                        Enviado:{" "}
                                                            {formatDate(
                                                                email.sent_at,
                                                            )}
                                    </span>
                                                    ) : (
                                                        <span>
                                        Tentativa:{" "}
                                                            {formatDate(
                                                                email.created_at,
                                                            )}
                                    </span>
                                                    )}

                                                    {email.status ===
                                                    "failed" &&
                                                    email.error_message ? (
                                                        <span>
                                        Erro:{" "}
                                                            {
                                                                email.error_message
                                                            }
                                    </span>
                                                    ) : null}
                                                </div>

                                                {email.can_resend ? (
                                                    <div className="bp-action-row">
                                                        <Button
                                                            size="sm"
                                                            variant="soft"
                                                            color="warning"
                                                            disabled={
                                                                reenviandoEmail !==
                                                                null
                                                            }
                                                            onClick={() =>
                                                                void reenviarEmail(
                                                                    email.evento,
                                                                )
                                                            }
                                                        >
                                                            {reenviandoEmail ===
                                                            email.evento ? (
                                                                <Loader2
                                                                    size={
                                                                        15
                                                                    }
                                                                />
                                                            ) : (
                                                                <Mail
                                                                    size={
                                                                        15
                                                                    }
                                                                />
                                                            )}

                                                            Reenviar e-mail
                                                        </Button>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        </section>
                    ) : null}

                    <section
                        style={{
                            display: "grid",
                            gap: 12,
                        }}
                    >
                        <strong>
                            Histórico
                        </strong>

                        {pedido.historico.length >
                        0 ? (
                            pedido.historico.map(
                                (
                                    historico,
                                ) => (
                                    <div
                                        key={
                                            historico.id
                                        }
                                        className="bp-card bp-card-soft"
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

                                            {historico.observacao ? (
                                                <div
                                                    style={{
                                                        fontSize:
                                                            13,
                                                    }}
                                                >
                                                    {
                                                        historico.observacao
                                                    }
                                                </div>
                                            ) : null}

                                            <div
                                                style={{
                                                    color:
                                                        "var(--color-text-muted)",
                                                    fontSize:
                                                        12,
                                                }}
                                            >
                                                {historico.operador
                                                    ? `Por ${historico.operador.nome}`
                                                    : "Atualização automática"}
                                            </div>
                                        </div>
                                    </div>
                                ),
                            )
                        ) : (
                            <span
                                style={{
                                    color:
                                        "var(--color-text-muted)",
                                    fontSize:
                                        13,
                                }}
                            >
                                Nenhum histórico
                                registrado.
                            </span>
                        )}
                    </section>
                </div>
            ) : null}
        </Modal>
    );
}
