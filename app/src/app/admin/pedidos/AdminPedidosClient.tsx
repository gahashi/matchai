"use client";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    Eye,
    Loader2,
    Plus,
    RefreshCw,
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
    Input,
} from "@/components/ui/Input";

import {
    PageHeader,
} from "@/components/ui/PageHeader";

import {
    Snackbar,
    type SnackbarState,
} from "@/components/ui/Snackbar";

import {
    Table,
} from "@/components/ui/Table";

import {
    PedidoManualModal,
    type PedidoManualProduto,
} from "./PedidoManualModal";

import {
    PedidoDetalheModal,
} from "./PedidoDetalheModal";


type PedidoStatus = {
    id: number;
    codigo: string;
    descricao: string;
    color: string | null;
    icon: string | null;
};

type PedidoPagamento = {
    id: number;
    valor: number;

    status: {
        codigo: string;
        descricao: string;
        color: string | null;
    };

    metodo: {
        codigo: string;
        descricao: string;
    };

    provider: string | null;
    aprovado_at: string | Date | null;
};

type PedidoResumo = {
    id: number;
    codigo: string;

    origem:
        | "loja"
        | "manual"
        | "legado"
        | string;

    data_original:
        | string
        | Date
        | null;

    cliente: {
        nome: string;
        email: string | null;
        telefone: string;
    };

    status: PedidoStatus;

    entrega_tipo: {
        id: number;
        codigo: string;
        descricao: string;
    } | null;

    valor_total: number;

    pagamento:
        | PedidoPagamento
        | null;

    quantidade_itens: number;

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

type AdminPedidosData = {
    statuses: PedidoStatus[];
    pedidos: PedidoResumo[];
};

type AdminPedidosClientProps = {
    initialData: AdminPedidosData;
    initialProdutos: PedidoManualProduto[];
};

type BadgeColor =
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "info";

type BulkAction = {
    statusCode: string;
    label: string;
};

const BULK_ACTIONS_BY_STATUS: Record<
    string,
    BulkAction[]
> = {
    confirmado: [
        {
            statusCode: "em_preparacao",
            label: "Iniciar preparação",
        },
    ],

    em_preparacao: [
        {
            statusCode: "pronto_retirada",
            label: "Marcar como pronto",
        },
        {
            statusCode: "enviado",
            label: "Marcar como enviado",
        },
    ],

    pronto_retirada: [
        {
            statusCode: "entregue",
            label: "Marcar como entregue",
        },
    ],

    enviado: [
        {
            statusCode: "entregue",
            label: "Marcar como entregue",
        },
    ],
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

function getOrigemColor(
    origem: string,
): BadgeColor {
    switch (origem) {
        case "manual":
            return "info";

        case "legado":
            return "warning";

        default:
            return "secondary";
    }
}

function getPedidoDate(
    pedido: PedidoResumo,
) {
    if (
        pedido.origem === "legado" &&
        pedido.data_original
    ) {
        return pedido.data_original;
    }

    return pedido.created_at;
}


export default function AdminPedidosClient({
                                               initialData,
                                               initialProdutos,
                                           }: AdminPedidosClientProps) {
    const [data, setData] =
        useState<AdminPedidosData>(
            initialData,
        );

    const [busca, setBusca] =
        useState("");

    const [
        statusSelecionado,
        setStatusSelecionado,
    ] =
        useState("");

    const [carregando, setCarregando] =
        useState(false);

    const [erro, setErro] =
        useState<string | null>(
            null,
        );

    const [modalOpen, setModalOpen] =
        useState(false);

    const [
        pedidoDetalheId,
        setPedidoDetalheId,
    ] =
        useState<number | null>(
            null,
        );

    const [snackbar, setSnackbar] =
        useState<SnackbarState | null>(
            null,
        );

    const [
        selecionados,
        setSelecionados,
    ] =
        useState<number[]>([]);

    const [
        executandoLote,
        setExecutandoLote,
    ] =
        useState(false);

    const primeiraBusca =
        useRef(true);

    const pedidosSelecionados =
        data.pedidos.filter(
            (pedido) =>
                selecionados.includes(
                    pedido.id,
                ),
        );

    const todosVisiveisSelecionados =
        data.pedidos.length > 0 &&
        data.pedidos.every(
            (pedido) =>
                selecionados.includes(
                    pedido.id,
                ),
        );

    const statusSelecionados =
        Array.from(
            new Set(
                pedidosSelecionados.map(
                    (pedido) =>
                        pedido.status.codigo,
                ),
            ),
        );

    const selecaoMista =
        statusSelecionados.length > 1;

    const acoesLote =
        statusSelecionados.length === 1
            ? BULK_ACTIONS_BY_STATUS[
            statusSelecionados[0]
            ] ?? []
            : [];


    useEffect(() => {
        setSelecionados([]);
    }, [
        busca,
        statusSelecionado,
    ]);


    useEffect(() => {
        if (primeiraBusca.current) {
            primeiraBusca.current = false;
            return;
        }

        const controller =
            new AbortController();

        const timer =
            window.setTimeout(
                async () => {
                    try {
                        setCarregando(
                            true,
                        );

                        setErro(null);

                        const params =
                            new URLSearchParams();

                        const q =
                            busca.trim();

                        if (q) {
                            params.set(
                                "q",
                                q,
                            );
                        }

                        if (
                            statusSelecionado
                        ) {
                            params.set(
                                "status",
                                statusSelecionado,
                            );
                        }

                        const query =
                            params.toString();

                        const response =
                            await fetch(
                                `/api/admin/pedidos${
                                    query
                                        ? `?${query}`
                                        : ""
                                }`,
                                {
                                    method:
                                        "GET",

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
                                "Não foi possível carregar os pedidos.",
                            );
                        }

                        setData(
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
                                : "Não foi possível carregar os pedidos.",
                        );
                    } finally {
                        if (
                            !controller
                                .signal
                                .aborted
                        ) {
                            setCarregando(
                                false,
                            );
                        }
                    }
                },
                300,
            );

        return () => {
            window.clearTimeout(
                timer,
            );

            controller.abort();
        };
    }, [
        busca,
        statusSelecionado,
    ]);


    async function recarregar() {
        try {
            setCarregando(true);
            setErro(null);

            const params =
                new URLSearchParams();

            const q =
                busca.trim();

            if (q) {
                params.set(
                    "q",
                    q,
                );
            }

            if (
                statusSelecionado
            ) {
                params.set(
                    "status",
                    statusSelecionado,
                );
            }

            const query =
                params.toString();

            const response =
                await fetch(
                    `/api/admin/pedidos${
                        query
                            ? `?${query}`
                            : ""
                    }`,
                    {
                        headers: {
                            Accept:
                                "application/json",
                        },
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
                    "Não foi possível carregar os pedidos.",
                );
            }

            setData(
                result.data,
            );
        } catch (error) {
            setErro(
                error instanceof Error
                    ? error.message
                    : "Não foi possível carregar os pedidos.",
            );
        } finally {
            setCarregando(false);
        }
    }


    async function pedidoCriado(
        message: string,
    ) {
        setSnackbar({
            color: "success",
            title:
                "Pedido criado",
            message,
        });

        await recarregar();
    }

    function erroPedido(
        message: string,
    ) {
        setSnackbar({
            color: "danger",
            title:
                "Erro ao criar pedido",
            message,
            autoClose: false,
        });
    }

    async function pedidoAtualizado(
        message: string,
    ) {
        setSnackbar({
            color: "success",
            title:
                "Pedido atualizado",
            message,
        });

        await recarregar();
    }


    function alternarPedidoSelecionado(
        pedidoId: number,
    ) {
        setSelecionados((current) =>
            current.includes(pedidoId)
                ? current.filter(
                    (id) =>
                        id !== pedidoId,
                )
                : [
                    ...current,
                    pedidoId,
                ],
        );
    }

    function alternarTodosVisiveis() {
        if (
            todosVisiveisSelecionados
        ) {
            setSelecionados([]);
            return;
        }

        setSelecionados(
            data.pedidos.map(
                (pedido) =>
                    pedido.id,
            ),
        );
    }

    async function executarAcaoLote(
        action: BulkAction,
    ) {
        if (
            pedidosSelecionados.length ===
            0
        ) {
            return;
        }

        if (selecaoMista) {
            setSnackbar({
                color: "warning",
                title:
                    "Seleção incompatível",
                message:
                    "Os pedidos selecionados possuem status diferentes. Selecione pedidos do mesmo status para executar uma ação em lote.",
            });
            return;
        }

        try {
            setExecutandoLote(true);

            let atualizados = 0;
            const falhas: string[] = [];

            for (
                const pedido of
                pedidosSelecionados
                ) {
                try {
                    const response =
                        await fetch(
                            `/api/admin/pedidos/${pedido.id}`,
                            {
                                method:
                                    "PATCH",

                                headers: {
                                    "Content-Type":
                                        "application/json",
                                    Accept:
                                        "application/json",
                                },

                                body:
                                    JSON.stringify(
                                        {
                                            action:
                                                "set_status",

                                            status_code:
                                            action.statusCode,

                                            observacao:
                                                "Atualização em lote pelo painel administrativo.",
                                        },
                                    ),
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
                            "Falha ao atualizar pedido.",
                        );
                    }

                    atualizados += 1;
                } catch (error) {
                    falhas.push(
                        `${pedido.codigo}: ${
                            error instanceof Error
                                ? error.message
                                : "erro desconhecido"
                        }`,
                    );
                }
            }

            setSelecionados([]);
            await recarregar();

            if (
                falhas.length === 0
            ) {
                setSnackbar({
                    color: "success",
                    title:
                        "Pedidos atualizados",
                    message:
                        `${atualizados} pedido(s) atualizado(s) com sucesso.`,
                });

                return;
            }

            setSnackbar({
                color:
                    atualizados > 0
                        ? "warning"
                        : "danger",

                title:
                    atualizados > 0
                        ? "Atualização parcial"
                        : "Falha na atualização",

                message:
                    `${atualizados} atualizado(s). ${falhas.length} falha(s): ${falhas.join(
                        " | ",
                    )}`,

                autoClose: false,
            });
        } finally {
            setExecutandoLote(false);
        }
    }


    return (
        <>
            <PageHeader
                title="Pedidos"
                subtitle="Acompanhe e gerencie os pedidos realizados."
                actions={
                    <div className="bp-action-row">
                        <Button
                            color="secondary"
                            variant="soft"
                            onClick={
                                recarregar
                            }
                            disabled={
                                carregando
                            }
                        >
                            {carregando ? (
                                <Loader2
                                    size={
                                        17
                                    }
                                />
                            ) : (
                                <RefreshCw
                                    size={
                                        17
                                    }
                                />
                            )}

                            Atualizar
                        </Button>

                        <Button
                            onClick={() => {
                                setModalOpen(
                                    true,
                                );
                                setSnackbar(
                                    null,
                                );
                            }}
                        >
                            <Plus
                                size={
                                    17
                                }
                            />
                            Criar pedido
                        </Button>
                    </div>
                }
            />

            <div className="bp-card bp-mb-4">
                <div
                    className="bp-card-body"
                    style={{
                        display: "grid",
                        gap: 18,
                    }}
                >
                    <div className="bp-badge-row">
                        <Button
                            size="sm"
                            variant={
                                statusSelecionado
                                    ? "ghost"
                                    : "soft"
                            }
                            color={
                                statusSelecionado
                                    ? "secondary"
                                    : "primary"
                            }
                            onClick={() =>
                                setStatusSelecionado(
                                    "",
                                )
                            }
                        >
                            Todos
                        </Button>

                        {data.statuses.map(
                            (status) => (
                                <Button
                                    key={
                                        status.id
                                    }
                                    size="sm"
                                    variant={
                                        statusSelecionado ===
                                        status.codigo
                                            ? "soft"
                                            : "ghost"
                                    }
                                    color={
                                        statusSelecionado ===
                                        status.codigo
                                            ? normalizeBadgeColor(
                                                status.color,
                                            )
                                            : "secondary"
                                    }
                                    onClick={() =>
                                        setStatusSelecionado(
                                            status.codigo,
                                        )
                                    }
                                >
                                    {
                                        status.descricao
                                    }
                                </Button>
                            ),
                        )}
                    </div>

                    <div className="bp-grid-2">
                        <Input
                            label="Buscar pedidos"
                            value={busca}
                            onChange={(
                                event,
                            ) =>
                                setBusca(
                                    event
                                        .target
                                        .value,
                                )
                            }
                            placeholder="Código, cliente, e-mail ou telefone..."
                        />

                        <div
                            style={{
                                minHeight:
                                    42,
                                display:
                                    "flex",
                                alignItems:
                                    "end",
                            }}
                        >
                            {carregando ? (
                                <span
                                    style={{
                                        display:
                                            "inline-flex",
                                        alignItems:
                                            "center",
                                        gap: 8,
                                        color:
                                            "var(--color-text-muted)",
                                        fontSize:
                                            13,
                                    }}
                                >
                                    <Loader2
                                        size={
                                            16
                                        }
                                    />
                                    Atualizando...
                                </span>
                            ) : null}
                        </div>
                    </div>

                    {erro ? (
                        <Alert
                            color="danger"
                            title="Erro ao carregar pedidos"
                        >
                            {erro}
                        </Alert>
                    ) : null}
                </div>
            </div>

            {selecionados.length > 0 ? (
                <div className="bp-card bp-mb-4">
                    <div
                        className="bp-card-body"
                        style={{
                            display: "grid",
                            gap: 12,
                        }}
                    >
                        <div className="bp-row-between">
                            <div>
                                <strong>
                                    {selecionados.length} pedido(s) selecionado(s)
                                </strong>

                                <div
                                    style={{
                                        marginTop: 4,
                                        color:
                                            "var(--color-text-muted)",
                                        fontSize: 12,
                                    }}
                                >
                                    As ações aparecem apenas quando todos os pedidos selecionados são compatíveis.
                                </div>
                            </div>

                            <Button
                                color="secondary"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                    setSelecionados([])
                                }
                                disabled={
                                    executandoLote
                                }
                            >
                                Limpar seleção
                            </Button>
                        </div>

                        {selecaoMista ? (
                            <Alert
                                color="warning"
                                title="Status diferentes"
                            >
                                Os pedidos selecionados possuem status diferentes. Selecione pedidos do mesmo status para executar uma ação em lote.
                            </Alert>
                        ) : acoesLote.length > 0 ? (
                            <div className="bp-action-row">
                                {acoesLote.map(
                                    (action) => (
                                        <Button
                                            key={
                                                action.statusCode
                                            }
                                            onClick={() =>
                                                void executarAcaoLote(
                                                    action,
                                                )
                                            }
                                            disabled={
                                                executandoLote
                                            }
                                        >
                                            {executandoLote ? (
                                                <Loader2
                                                    size={
                                                        16
                                                    }
                                                />
                                            ) : null}

                                            {
                                                action.label
                                            }
                                        </Button>
                                    ),
                                )}
                            </div>
                        ) : (
                            <Alert
                                color="info"
                                title="Nenhuma ação em lote disponível"
                            >
                                O status atual dos pedidos selecionados não possui uma ação operacional em lote nesta etapa.
                            </Alert>
                        )}
                    </div>
                </div>
            ) : null}

            <div className="bp-card">
                <div className="bp-card-body">
                    <div className="bp-row-between bp-mb-3">
                        <div>
                            <strong>
                                Pedidos
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
                                    data
                                        .pedidos
                                        .length
                                }{" "}
                                pedido(s)
                                encontrado(s)
                            </div>
                        </div>

                        {statusSelecionado ? (
                            <Badge
                                color={normalizeBadgeColor(
                                    data.statuses.find(
                                        (
                                            status,
                                        ) =>
                                            status.codigo ===
                                            statusSelecionado,
                                    )
                                        ?.color ??
                                    null,
                                )}
                            >
                                {data.statuses.find(
                                        (
                                            status,
                                        ) =>
                                            status.codigo ===
                                            statusSelecionado,
                                    )
                                        ?.descricao ??
                                    statusSelecionado}
                            </Badge>
                        ) : null}
                    </div>

                    <Table
                        headers={[
                            <label
                                key="selecionar"
                                className="bp-check"
                                title="Selecionar todos os pedidos visíveis"
                            >
                                <input
                                    type="checkbox"
                                    checked={
                                        todosVisiveisSelecionados
                                    }
                                    onChange={
                                        alternarTodosVisiveis
                                    }
                                    aria-label="Selecionar todos os pedidos visíveis"
                                />
                            </label>,
                            "Código",
                            "Cliente",
                            "Data",
                            "Valor",
                            "Pagamento",
                            "Status",
                            "Origem",
                            "Ações",
                        ]}
                        emptyMessage={
                            carregando
                                ? "Carregando pedidos..."
                                : "Nenhum pedido encontrado."
                        }
                    >
                        {data.pedidos.map(
                            (pedido) => (
                                <tr
                                    key={
                                        pedido.id
                                    }
                                >
                                    <td>
                                        <label
                                            className="bp-check"
                                            title={`Selecionar pedido ${pedido.codigo}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selecionados.includes(
                                                    pedido.id,
                                                )}
                                                onChange={() =>
                                                    alternarPedidoSelecionado(
                                                        pedido.id,
                                                    )
                                                }
                                                aria-label={`Selecionar pedido ${pedido.codigo}`}
                                            />
                                        </label>
                                    </td>

                                    <td>
                                        <strong>
                                            {
                                                pedido.codigo
                                            }
                                        </strong>

                                        <div
                                            style={{
                                                marginTop:
                                                    3,
                                                color:
                                                    "var(--color-text-soft)",
                                                fontSize:
                                                    11,
                                            }}
                                        >
                                            #
                                            {
                                                pedido.id
                                            }
                                        </div>
                                    </td>

                                    <td>
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
                                                    3,
                                                display:
                                                    "grid",
                                                gap: 2,
                                                color:
                                                    "var(--color-text-muted)",
                                                fontSize:
                                                    11,
                                            }}
                                        >
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

                                            <span>
                                                {
                                                    pedido
                                                        .cliente
                                                        .telefone
                                                }
                                            </span>
                                        </div>
                                    </td>

                                    <td>
                                        <span>
                                            {formatDate(
                                                getPedidoDate(
                                                    pedido,
                                                ),
                                            )}
                                        </span>

                                        {pedido.origem ===
                                        "legado" &&
                                        pedido.data_original ? (
                                            <div
                                                style={{
                                                    marginTop:
                                                        3,
                                                    color:
                                                        "var(--color-text-soft)",
                                                    fontSize:
                                                        11,
                                                }}
                                            >
                                                Data
                                                original
                                            </div>
                                        ) : null}
                                    </td>

                                    <td>
                                        <strong>
                                            {money(
                                                pedido.valor_total,
                                            )}
                                        </strong>

                                        <div
                                            style={{
                                                marginTop:
                                                    3,
                                                color:
                                                    "var(--color-text-soft)",
                                                fontSize:
                                                    11,
                                            }}
                                        >
                                            {
                                                pedido.quantidade_itens
                                            }{" "}
                                            item(ns)
                                        </div>
                                    </td>

                                    <td>
                                        {pedido.pagamento ? (
                                            <div
                                                style={{
                                                    display:
                                                        "grid",
                                                    gap: 5,
                                                    justifyItems:
                                                        "start",
                                                }}
                                            >
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

                                                <span
                                                    style={{
                                                        color:
                                                            "var(--color-text-muted)",
                                                        fontSize:
                                                            11,
                                                    }}
                                                >
                                                    {
                                                        pedido
                                                            .pagamento
                                                            .metodo
                                                            .descricao
                                                    }
                                                </span>
                                            </div>
                                        ) : (
                                            <Badge color="secondary">
                                                Sem
                                                pagamento
                                            </Badge>
                                        )}
                                    </td>

                                    <td>
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
                                    </td>

                                    <td>
                                        <Badge
                                            color={getOrigemColor(
                                                pedido.origem,
                                            )}
                                        >
                                            {getOrigemLabel(
                                                pedido.origem,
                                            )}
                                        </Badge>
                                    </td>

                                    <td>
                                        <Button
                                            color="secondary"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                setPedidoDetalheId(
                                                    pedido.id,
                                                )
                                            }
                                        >
                                            <Eye
                                                size={
                                                    16
                                                }
                                            />
                                            Ver
                                        </Button>
                                    </td>
                                </tr>
                            ),
                        )}
                    </Table>
                </div>
            </div>

            <PedidoDetalheModal
                open={
                    pedidoDetalheId !==
                    null
                }
                pedidoId={
                    pedidoDetalheId
                }
                onClose={() =>
                    setPedidoDetalheId(
                        null,
                    )
                }
                onUpdated={
                    pedidoAtualizado
                }
            />

            <PedidoManualModal
                open={modalOpen}
                produtos={
                    initialProdutos
                }
                onClose={() => {
                    setModalOpen(
                        false,
                    );
                }}
                onCreated={
                    pedidoCriado
                }
                onError={
                    erroPedido
                }
            />

            {snackbar ? (
                <Snackbar
                    {...snackbar}
                    onClose={() =>
                        setSnackbar(
                            null,
                        )
                    }
                />
            ) : null}
        </>
    );
}
