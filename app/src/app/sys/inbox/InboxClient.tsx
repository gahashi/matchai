"use client";

import {
    useMemo,
    useState,
} from "react";
import {
    Archive,
    Bell,
    Check,
    CheckCircle2,
    Circle,
    Clock,
    ExternalLink,
    Inbox,
    Info,
    Mail,
    MailOpen,
    RefreshCw,
    XCircle,
} from "lucide-react";

import { AppLink } from "@/components/ui/AppLink";
import {
    resolveInboxActions,
    type InboxAvailableAction,
    type InboxActionCode,
} from "@/lib/sys/inbox/inbox-action-policy";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import {
    Snackbar,
    type SnackbarState,
} from "@/components/ui/Snackbar";
import {
    dispatchInboxChanged,
} from "@/lib/sys/inbox/inbox-events";

type InboxFilter =
    | "all"
    | "unread"
    | "requests"
    | "results"
    | "archived";

type InboxSort =
    | "recent"
    | "oldest"
    | "unread_first";

type InboxPagination = {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
};

type InboxItem = {
    id: number;
    titulo: string;
    mensagem: string;
    contexto_titulo: string | null;
    contexto_descricao: string | null;
    action_url: string | null;
    entidade_tipo: string | null;
    entidade_id: number | null;
    metadata_text: string | null;
    read_at: Date | string | null;
    archived_at: Date | string | null;
    created_at: Date | string | null;
    sys_inbox_item_tipo: {
        codigo: string;
        nome: string;
        color: string | null;
        icon: string | null;
    };
    sys_inbox_item_status: {
        codigo: string;
        nome: string;
        color: string | null;
        icon: string | null;
    };
    actions: InboxAvailableAction[];
};

type InboxClientProps = {
    initialItems: InboxItem[];
    initialPagination: InboxPagination;
};

const filters: Array<{
    label: string;
    value: InboxFilter;
}> = [
    {
        label: "Todos",
        value: "all",
    },
    {
        label: "Não lidas",
        value: "unread",
    },
    {
        label: "Solicitações",
        value: "requests",
    },
    {
        label: "Resultados",
        value: "results",
    },
    {
        label: "Arquivadas",
        value: "archived",
    },
];

function formatDate(
    value: Date | string | null
) {
    if (!value) {
        return "Agora";
    }

    return new Intl.DateTimeFormat(
        "pt-BR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }
    ).format(new Date(value));
}

function getTypeIcon(codigo: string) {
    switch (codigo) {
        case "request":
            return <Inbox size={18} />;

        case "result":
            return (
                <CheckCircle2 size={18} />
            );

        case "info":
        default:
            return <Info size={18} />;
    }
}

function getStatusIcon(codigo: string) {
    switch (codigo) {
        case "read":
            return <Check size={13} />;

        case "pending":
            return <Clock size={13} />;

        case "approved":
            return (
                <CheckCircle2 size={13} />
            );

        case "rejected":
            return <XCircle size={13} />;

        case "archived":
            return <Archive size={13} />;

        case "unread":
        default:
            return <Circle size={13} />;
    }
}

function getSafeColor(
    color: string | null | undefined
) {
    if (
        color === "primary" ||
        color === "secondary" ||
        color === "success" ||
        color === "warning" ||
        color === "danger" ||
        color === "info"
    ) {
        return color;
    }

    return "secondary";
}

function getPaginationText(
    pagination: InboxPagination
) {
    if (pagination.total === 0) {
        return "Nenhuma mensagem";
    }

    const start =
        (pagination.page - 1) *
        pagination.pageSize +
        1;

    const end = Math.min(
        pagination.page *
        pagination.pageSize,
        pagination.total
    );

    return `Mostrando ${start}–${end} de ${pagination.total}`;
}

function temContextoHumano(
    item: InboxItem
) {
    return Boolean(
        item.contexto_titulo ||
        item.contexto_descricao
    );
}

function getInboxAction(
    item: InboxItem,
    codigo: InboxActionCode
) {
    return item.actions.find(
        (action) => action.codigo === codigo
    );
}

function rebuildInboxActions(
    item: InboxItem,
    changes: {
        readAt?: Date | string | null;
        archivedAt?: Date | string | null;
        statusCodigo?: string;
    }
) {
    return resolveInboxActions({
        tipoCodigo:
        item.sys_inbox_item_tipo.codigo,
        statusCodigo:
            changes.statusCodigo ??
            item.sys_inbox_item_status.codigo,
        actionUrl: item.action_url,
        entidadeTipo: item.entidade_tipo,
        metadataText: item.metadata_text,
        readAt:
            changes.readAt !== undefined
                ? changes.readAt
                : item.read_at,
        archivedAt:
            changes.archivedAt !== undefined
                ? changes.archivedAt
                : item.archived_at,
    });
}

export default function InboxClient({
                                        initialItems,
                                        initialPagination,
                                    }: InboxClientProps) {
    const [items, setItems] =
        useState<InboxItem[]>(
            initialItems
        );

    const [
        pagination,
        setPagination,
    ] =
        useState<InboxPagination>(
            initialPagination
        );

    const [
        selectedItem,
        setSelectedItem,
    ] = useState<InboxItem | null>(
        null
    );

    const [filter, setFilter] =
        useState<InboxFilter>("all");

    const [loading, setLoading] =
        useState(false);

    const [
        snackbar,
        setSnackbar,
    ] =
        useState<SnackbarState | null>(
            null
        );

    const unreadCount = useMemo(
        () =>
            items.filter(
                (item) => !item.read_at
            ).length,
        [items]
    );

    async function loadItems({
                                 nextFilter = filter,
                                 nextPage = pagination.page,
                             }: {
        nextFilter?: InboxFilter;
        nextPage?: number;
    } = {}) {
        try {
            setLoading(true);

            const params =
                new URLSearchParams({
                    filter: nextFilter,
                    sort:
                        "recent" satisfies InboxSort,
                    page: String(nextPage),
                    pageSize: String(
                        pagination.pageSize
                    ),
                });

            const response = await fetch(
                `/api/sys/inbox?${params.toString()}`,
                {
                    method: "GET",
                }
            );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.ok
            ) {
                throw new Error(
                    data.message ||
                    "Erro ao carregar inbox."
                );
            }

            setItems(data.items);
            setPagination(
                data.pagination
            );
        } catch (error) {
            setSnackbar({
                color: "danger",
                title:
                    "Erro ao carregar Inbox",
                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível carregar suas mensagens.",
                autoClose: false,
            });
        } finally {
            setLoading(false);
        }
    }

    async function handleChangeFilter(
        nextFilter: InboxFilter
    ) {
        setFilter(nextFilter);

        await loadItems({
            nextFilter,
            nextPage: 1,
        });
    }

    async function markItemAsRead(
        item: InboxItem
    ) {
        if (item.read_at) {
            return item;
        }

        const response = await fetch(
            `/api/sys/inbox/${item.id}/read`,
            {
                method: "PATCH",
            }
        );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.ok
        ) {
            throw new Error(
                data.message ||
                "Erro ao marcar como lida."
            );
        }

        const readAt =
            new Date().toISOString();

        const nextStatus =
            item.sys_inbox_item_status.codigo ===
            "unread"
                ? {
                    ...item.sys_inbox_item_status,
                    codigo: "read",
                    nome: "Lida",
                    color: "secondary",
                    icon: "check",
                }
                : item.sys_inbox_item_status;

        const nextItem: InboxItem = {
            ...item,
            read_at: readAt,
            sys_inbox_item_status: nextStatus,
            actions: rebuildInboxActions(
                item,
                {
                    readAt,
                    statusCodigo:
                    nextStatus.codigo,
                }
            ),
        };

        setItems((current) =>
            current.map(
                (currentItem) =>
                    currentItem.id ===
                    item.id
                        ? nextItem
                        : currentItem
            )
        );

        dispatchInboxChanged({
            itemId: item.id,
            action: "read",
        });

        return nextItem;
    }

    async function handleOpenItem(
        item: InboxItem
    ) {
        try {
            const nextItem =
                await markItemAsRead(
                    item
                );

            setSelectedItem(nextItem);
        } catch (error) {
            setSnackbar({
                color: "danger",
                title:
                    "Erro ao abrir mensagem",
                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível abrir a mensagem.",
                autoClose: false,
            });
        }
    }

    async function handleMarkAsUnread(
        item: InboxItem
    ) {
        try {
            const response = await fetch(
                `/api/sys/inbox/${item.id}/unread`,
                {
                    method: "PATCH",
                }
            );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.ok
            ) {
                throw new Error(
                    data.message ||
                    "Erro ao marcar como não lida."
                );
            }

            const nextStatus =
                item.sys_inbox_item_status.codigo ===
                "read"
                    ? {
                        ...item.sys_inbox_item_status,
                        codigo: "unread",
                        nome: "Não lida",
                        color: "primary",
                        icon: "circle",
                    }
                    : item.sys_inbox_item_status;

            const nextItem: InboxItem = {
                ...item,
                read_at: null,
                sys_inbox_item_status: nextStatus,
                actions: rebuildInboxActions(
                    item,
                    {
                        readAt: null,
                        statusCodigo:
                        nextStatus.codigo,
                    }
                ),
            };

            setItems((current) =>
                current.map(
                    (currentItem) =>
                        currentItem.id ===
                        item.id
                            ? nextItem
                            : currentItem
                )
            );

            setSelectedItem(nextItem);

            setSnackbar({
                color: "success",
                title:
                    "Mensagem atualizada",
                message:
                    "A mensagem foi marcada como não lida.",
            });
        } catch (error) {
            setSnackbar({
                color: "danger",
                title:
                    "Erro ao atualizar mensagem",
                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível marcar a mensagem como não lida.",
                autoClose: false,
            });
        }
    }

    async function handleArchive(
        item: InboxItem
    ) {
        try {
            const response = await fetch(
                `/api/sys/inbox/${item.id}/archive`,
                {
                    method: "PATCH",
                }
            );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.ok
            ) {
                throw new Error(
                    data.message ||
                    "Erro ao arquivar mensagem."
                );
            }

            setItems((current) => {
                if (
                    filter === "archived"
                ) {
                    return current.map(
                        (currentItem) =>
                            currentItem.id ===
                            item.id
                                ? (() => {
                                    const archivedAt =
                                        new Date().toISOString();

                                    return {
                                        ...currentItem,
                                        read_at: archivedAt,
                                        archived_at: archivedAt,
                                        sys_inbox_item_status: {
                                            ...currentItem.sys_inbox_item_status,
                                            codigo: "archived",
                                            nome: "Arquivada",
                                            color: "secondary",
                                            icon: "archive",
                                        },
                                        actions: rebuildInboxActions(
                                            currentItem,
                                            {
                                                readAt: archivedAt,
                                                archivedAt,
                                                statusCodigo: "archived",
                                            }
                                        ),
                                    };
                                })()
                                : currentItem
                    );
                }

                return current.filter(
                    (currentItem) =>
                        currentItem.id !==
                        item.id
                );
            });

            setPagination(
                (current) => ({
                    ...current,
                    total: Math.max(
                        0,
                        current.total -
                        (filter ===
                        "archived"
                            ? 0
                            : 1)
                    ),
                })
            );

            setSelectedItem(null);

            dispatchInboxChanged({
                itemId: item.id,
                action: "archive",
            });

            setSnackbar({
                color: "success",
                title:
                    "Mensagem arquivada",
                message:
                    "A mensagem foi movida para arquivadas.",
            });
        } catch (error) {
            setSnackbar({
                color: "danger",
                title:
                    "Erro ao arquivar mensagem",
                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível arquivar a mensagem.",
                autoClose: false,
            });
        }
    }

    return (
        <div className="bp-grid">
            <PageHeader
                title="Inbox"
                subtitle="Central de mensagens, solicitações e resultados importantes do sistema."
            />

            <div className="bp-inbox-filter-bar">
                <div
                    className="bp-inbox-filter-tabs"
                    aria-label="Filtros do inbox"
                >
                    {filters.map(
                        (item) => (
                            <button
                                key={
                                    item.value
                                }
                                type="button"
                                className={[
                                    "bp-inbox-filter-tab",
                                    filter ===
                                    item.value
                                        ? "active"
                                        : "",
                                ]
                                    .filter(
                                        Boolean
                                    )
                                    .join(
                                        " "
                                    )}
                                onClick={() =>
                                    handleChangeFilter(
                                        item.value
                                    )
                                }
                            >
                                {
                                    item.label
                                }
                            </button>
                        )
                    )}
                </div>

                <div className="bp-inbox-filter-summary">
                    <span>
                        {getPaginationText(
                            pagination
                        )}
                    </span>

                    {unreadCount > 0 ? (
                        <Badge
                            color="primary"
                            variant="soft"
                        >
                            {unreadCount} não
                            lida
                            {unreadCount >
                            1
                                ? "s"
                                : ""}
                        </Badge>
                    ) : null}

                    <Button
                        color="secondary"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            loadItems()
                        }
                        disabled={loading}
                        aria-label="Atualizar inbox"
                        title="Atualizar inbox"
                    >
                        <RefreshCw
                            size={16}
                        />
                    </Button>
                </div>
            </div>

            <Card>
                {items.length === 0 ? (
                    <EmptyState
                        icon={
                            <Bell
                                size={26}
                            />
                        }
                        title="Nenhuma mensagem encontrada"
                        description="Quando houver avisos, solicitações ou resultados importantes, eles aparecerão aqui."
                    />
                ) : (
                    <div className="bp-inbox-simple-list">
                        {items.map(
                            (item) => {
                                const unread =
                                    !item.read_at;

                                const markReadAction =
                                    getInboxAction(
                                        item,
                                        "marcar_como_lida"
                                    );

                                const markUnreadAction =
                                    getInboxAction(
                                        item,
                                        "marcar_como_nao_lida"
                                    );

                                const archiveAction =
                                    getInboxAction(
                                        item,
                                        "arquivar"
                                    );

                                const openAction =
                                    getInboxAction(
                                        item,
                                        "abrir"
                                    );

                                return (
                                    <div
                                        key={item.id}
                                        role="button"
                                        tabIndex={0}
                                        className={[
                                            "bp-inbox-notification",
                                            unread ? "unread" : "",
                                        ]
                                            .filter(Boolean)
                                            .join(" ")}
                                        onClick={() =>
                                            handleOpenItem(item)
                                        }
                                        onKeyDown={(event) => {
                                            if (
                                                event.key === "Enter" ||
                                                event.key === " "
                                            ) {
                                                event.preventDefault();
                                                handleOpenItem(item);
                                            }
                                        }}
                                    >
                                        <div className="bp-inbox-notification-main">
                                            <div className="bp-inbox-notification-head">
            <span
                className={`bp-inbox-item-icon bp-ui-${getSafeColor(
                    item.sys_inbox_item_tipo.color
                )}`}
            >
                {getTypeIcon(
                    item.sys_inbox_item_tipo.codigo
                )}
            </span>

                                                <div className="bp-inbox-notification-heading">
                                                    <strong>
                                                        {item.titulo}
                                                    </strong>

                                                    <span className="bp-inbox-notification-meta">
                    {formatDate(
                        item.created_at
                    )}
                </span>
                                                </div>
                                            </div>

                                            <small className="bp-inbox-notification-message">
                                                {item.mensagem}
                                            </small>

                                            <div className="bp-inbox-notification-footer">
                                                <Badge
                                                    color={getSafeColor(
                                                        item
                                                            .sys_inbox_item_status
                                                            .color
                                                    )}
                                                    variant="soft"
                                                >
                                                    {getStatusIcon(
                                                        item
                                                            .sys_inbox_item_status
                                                            .codigo
                                                    )}

                                                    {
                                                        item
                                                            .sys_inbox_item_status
                                                            .nome
                                                    }
                                                </Badge>

                                                {item.contexto_titulo ? (
                                                    <span className="bp-inbox-context-inline">
                    {item.contexto_titulo}
                </span>
                                                ) : null}

                                                {item.contexto_descricao ? (
                                                    <span className="bp-inbox-context-inline">
                    {
                        item.contexto_descricao
                    }
                </span>
                                                ) : null}
                                            </div>
                                        </div>

                                        <div className="bp-inbox-notification-actions">
                                            {markReadAction ? (
                                                <Button
                                                    color={markReadAction.color}
                                                    variant={markReadAction.variant}
                                                    size="sm"
                                                    title={markReadAction.label}
                                                    aria-label={markReadAction.label}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        void markItemAsRead(item);
                                                    }}
                                                >
                                                    <MailOpen size={15} />
                                                </Button>
                                            ) : null}

                                            {markUnreadAction ? (
                                                <Button
                                                    color={markUnreadAction.color}
                                                    variant={markUnreadAction.variant}
                                                    size="sm"
                                                    title={markUnreadAction.label}
                                                    aria-label={markUnreadAction.label}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        void handleMarkAsUnread(item);
                                                    }}
                                                >
                                                    <Mail size={15} />
                                                </Button>
                                            ) : null}

                                            {archiveAction ? (
                                                <Button
                                                    color={archiveAction.color}
                                                    variant={archiveAction.variant}
                                                    size="sm"
                                                    title={archiveAction.label}
                                                    aria-label={archiveAction.label}
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        void handleArchive(item);
                                                    }}
                                                >
                                                    <Archive size={15} />
                                                </Button>
                                            ) : null}

                                            {openAction?.href ? (
                                                <AppLink
                                                    href={openAction.href}
                                                    color={openAction.color}
                                                    variant={openAction.variant}
                                                    size="sm"
                                                    className="bp-inbox-open-action"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        void markItemAsRead(item);
                                                    }}
                                                >
                                                    <ExternalLink size={15} />
                                                    {openAction.label}
                                                </AppLink>
                                            ) : null}

                                            {unread ? (
                                                <span className="bp-inbox-unread-dot" />
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            }
                        )}
                    </div>
                )}
            </Card>

            {items.length > 0 ? (
                <div className="bp-inbox-pagination">
                    <Button
                        color="secondary"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            loadItems({
                                nextPage:
                                    pagination.page -
                                    1,
                            })
                        }
                        disabled={
                            loading ||
                            !pagination.hasPreviousPage
                        }
                    >
                        Anterior
                    </Button>

                    <span>
                        Página{" "}
                        {pagination.page} de{" "}
                        {
                            pagination.totalPages
                        }
                    </span>

                    <Button
                        color="secondary"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            loadItems({
                                nextPage:
                                    pagination.page +
                                    1,
                            })
                        }
                        disabled={
                            loading ||
                            !pagination.hasNextPage
                        }
                    >
                        Próxima
                    </Button>
                </div>
            ) : null}

            <Modal
                open={Boolean(
                    selectedItem
                )}
                title={
                    selectedItem?.titulo ??
                    "Mensagem"
                }
                description={
                    selectedItem
                        ? `${selectedItem.sys_inbox_item_tipo.nome} • ${formatDate(
                            selectedItem.created_at
                        )}`
                        : undefined
                }
                onCloseAction={() =>
                    setSelectedItem(null)
                }
            >
                {selectedItem ? (() => {
                    const markReadAction =
                        getInboxAction(
                            selectedItem,
                            "marcar_como_lida"
                        );

                    const markUnreadAction =
                        getInboxAction(
                            selectedItem,
                            "marcar_como_nao_lida"
                        );

                    const archiveAction =
                        getInboxAction(
                            selectedItem,
                            "arquivar"
                        );

                    const openAction =
                        getInboxAction(
                            selectedItem,
                            "abrir"
                        );

                    return (
                        <div className="bp-inbox-modal-content">
                            <div className="bp-inbox-modal-status-row">
                                <Badge
                                    color={getSafeColor(
                                        selectedItem
                                            .sys_inbox_item_status
                                            .color
                                    )}
                                    variant="soft"
                                >
                                    {getStatusIcon(
                                        selectedItem
                                            .sys_inbox_item_status
                                            .codigo
                                    )}

                                    {
                                        selectedItem
                                            .sys_inbox_item_status
                                            .nome
                                    }
                                </Badge>

                                {selectedItem.read_at ? (
                                    <Badge
                                        color="secondary"
                                        variant="soft"
                                    >
                                        <MailOpen
                                            size={
                                                13
                                            }
                                        />
                                        Lida
                                    </Badge>
                                ) : (
                                    <Badge
                                        color="primary"
                                        variant="soft"
                                    >
                                        <Mail
                                            size={
                                                13
                                            }
                                        />
                                        Não lida
                                    </Badge>
                                )}
                            </div>

                            <p className="bp-inbox-message">
                                {
                                    selectedItem.mensagem
                                }
                            </p>

                            {temContextoHumano(
                                selectedItem
                            ) ? (
                                <div className="bp-inbox-context">
                                <span>
                                    Contexto
                                </span>

                                    <strong>
                                        {selectedItem.contexto_titulo ??
                                            selectedItem.contexto_descricao}

                                        {selectedItem.contexto_titulo &&
                                        selectedItem.contexto_descricao
                                            ? ` — ${selectedItem.contexto_descricao}`
                                            : ""}
                                    </strong>
                                </div>
                            ) : null}

                            <div className="bp-inbox-detail-actions">
                                {archiveAction ? (
                                    <Button
                                        color={archiveAction.color}
                                        variant={archiveAction.variant}
                                        onClick={() =>
                                            handleArchive(selectedItem)
                                        }
                                    >
                                        <Archive size={17} />
                                        {archiveAction.label}
                                    </Button>
                                ) : null}

                                {markReadAction ? (
                                    <Button
                                        color={markReadAction.color}
                                        variant={markReadAction.variant}
                                        onClick={() =>
                                            markItemAsRead(selectedItem)
                                        }
                                    >
                                        <MailOpen size={17} />
                                        {markReadAction.label}
                                    </Button>
                                ) : null}

                                {markUnreadAction ? (
                                    <Button
                                        color={markUnreadAction.color}
                                        variant={markUnreadAction.variant}
                                        onClick={() =>
                                            handleMarkAsUnread(selectedItem)
                                        }
                                    >
                                        <Mail size={17} />
                                        {markUnreadAction.label}
                                    </Button>
                                ) : null}

                                {openAction?.href ? (
                                    <AppLink
                                        href={openAction.href}
                                        color={openAction.color}
                                        variant={openAction.variant}
                                        className="bp-inbox-detail-primary-action"
                                    >
                                        <ExternalLink size={17} />
                                        {openAction.label}
                                    </AppLink>
                                ) : null}
                            </div>
                        </div>
                    );
                })() : null}
            </Modal>

            {snackbar ? (
                <Snackbar
                    {...snackbar}
                    onClose={() =>
                        setSnackbar(null)
                    }
                />
            ) : null}
        </div>
    );
}