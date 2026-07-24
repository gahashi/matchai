"use client";

import {useMemo, useState} from "react";
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

import {AppLink} from "@/components/ui/AppLink";
import {Badge} from "@/components/ui/Badge";
import {Button} from "@/components/ui/Button";
import {Card, CardBody} from "@/components/ui/Card";
import {EmptyState} from "@/components/ui/EmptyState";
import {Modal} from "@/components/ui/Modal";
import {PageHeader} from "@/components/ui/PageHeader";
import {Snackbar, type SnackbarState} from "@/components/ui/Snackbar";

type InboxFilter = "all" | "unread" | "requests" | "results" | "archived";
type InboxSort = "recent" | "oldest" | "unread_first";

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
    action_url: string | null;
    entidade_tipo: string | null;
    entidade_id: number | null;
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
};

type InboxClientProps = {
    initialItems: InboxItem[];
    initialPagination: InboxPagination;
};

const filters: Array<{
    label: string;
    value: InboxFilter;
}> = [
    {label: "Todos", value: "all"},
    {label: "Não lidas", value: "unread"},
    {label: "Solicitações", value: "requests"},
    {label: "Resultados", value: "results"},
    {label: "Arquivadas", value: "archived"},
];

function formatDate(value: Date | string | null) {
    if (!value) return "Agora";

    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

function getTypeIcon(codigo: string) {
    switch (codigo) {
        case "request":
            return <Inbox size={18}/>;
        case "result":
            return <CheckCircle2 size={18}/>;
        case "info":
        default:
            return <Info size={18}/>;
    }
}

function getStatusIcon(codigo: string) {
    switch (codigo) {
        case "read":
            return <Check size={13}/>;
        case "pending":
            return <Clock size={13}/>;
        case "approved":
            return <CheckCircle2 size={13}/>;
        case "rejected":
            return <XCircle size={13}/>;
        case "archived":
            return <Archive size={13}/>;
        case "unread":
        default:
            return <Circle size={13}/>;
    }
}

function getSafeColor(color: string | null | undefined) {
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

function getPaginationText(pagination: InboxPagination) {
    if (pagination.total === 0) {
        return "Nenhuma mensagem";
    }

    const start = (pagination.page - 1) * pagination.pageSize + 1;
    const end = Math.min(pagination.page * pagination.pageSize, pagination.total);

    return `Mostrando ${start}–${end} de ${pagination.total}`;
}

export default function InboxClient({
                                        initialItems,
                                        initialPagination,
                                    }: InboxClientProps) {
    const [items, setItems] = useState<InboxItem[]>(initialItems);
    const [pagination, setPagination] = useState<InboxPagination>(initialPagination);
    const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);
    const [filter, setFilter] = useState<InboxFilter>("all");
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);

    const unreadCount = useMemo(() => {
        return items.filter((item) => !item.read_at).length;
    }, [items]);

    async function loadItems({
                                 nextFilter = filter,
                                 nextPage = pagination.page,
                             }: {
        nextFilter?: InboxFilter;
        nextPage?: number;
    } = {}) {
        try {
            setLoading(true);

            const params = new URLSearchParams({
                filter: nextFilter,
                sort: "recent" satisfies InboxSort,
                page: String(nextPage),
                pageSize: String(pagination.pageSize),
            });

            const response = await fetch(`/api/sys/inbox?${params.toString()}`, {
                method: "GET",
            });

            const data = await response.json();

            if (!response.ok || !data.ok) {
                throw new Error(data.message || "Erro ao carregar inbox.");
            }

            setItems(data.items);
            setPagination(data.pagination);
        } catch (error) {
            setSnackbar({
                color: "danger",
                title: "Erro ao carregar Inbox",
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

    async function handleChangeFilter(nextFilter: InboxFilter) {
        setFilter(nextFilter);
        await loadItems({
            nextFilter,
            nextPage: 1,
        });
    }

    async function markItemAsRead(item: InboxItem) {
        if (item.read_at) return item;

        const response = await fetch(`/api/sys/inbox/${item.id}/read`, {
            method: "PATCH",
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
            throw new Error(data.message || "Erro ao marcar como lida.");
        }

        const nextItem: InboxItem = {
            ...item,
            read_at: new Date().toISOString(),
            sys_inbox_item_status:
                item.sys_inbox_item_status.codigo === "unread"
                    ? {
                        ...item.sys_inbox_item_status,
                        codigo: "read",
                        nome: "Lida",
                        color: "secondary",
                        icon: "check",
                    }
                    : item.sys_inbox_item_status,
        };

        setItems((current) =>
            current.map((currentItem) =>
                currentItem.id === item.id ? nextItem : currentItem,
            ),
        );

        return nextItem;
    }

    async function handleOpenItem(item: InboxItem) {
        try {
            const nextItem = await markItemAsRead(item);
            setSelectedItem(nextItem);
        } catch (error) {
            setSnackbar({
                color: "danger",
                title: "Erro ao abrir mensagem",
                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível abrir a mensagem.",
                autoClose: false,
            });
        }
    }

    async function handleMarkAsUnread(item: InboxItem) {
        try {
            const response = await fetch(`/api/sys/inbox/${item.id}/unread`, {
                method: "PATCH",
            });

            const data = await response.json();

            if (!response.ok || !data.ok) {
                throw new Error(data.message || "Erro ao marcar como não lida.");
            }

            const nextItem: InboxItem = {
                ...item,
                read_at: null,
                sys_inbox_item_status:
                    item.sys_inbox_item_status.codigo === "read"
                        ? {
                            ...item.sys_inbox_item_status,
                            codigo: "unread",
                            nome: "Não lida",
                            color: "primary",
                            icon: "circle",
                        }
                        : item.sys_inbox_item_status,
            };

            setItems((current) =>
                current.map((currentItem) =>
                    currentItem.id === item.id ? nextItem : currentItem,
                ),
            );

            setSelectedItem(nextItem);

            setSnackbar({
                color: "success",
                title: "Mensagem atualizada",
                message: "A mensagem foi marcada como não lida.",
            });
        } catch (error) {
            setSnackbar({
                color: "danger",
                title: "Erro ao atualizar mensagem",
                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível marcar a mensagem como não lida.",
                autoClose: false,
            });
        }
    }

    async function handleArchive(item: InboxItem) {
        try {
            const response = await fetch(`/api/sys/inbox/${item.id}/archive`, {
                method: "PATCH",
            });

            const data = await response.json();

            if (!response.ok || !data.ok) {
                throw new Error(data.message || "Erro ao arquivar mensagem.");
            }

            setItems((current) => {
                if (filter === "archived") {
                    return current.map((currentItem) =>
                        currentItem.id === item.id
                            ? {
                                ...currentItem,
                                read_at: new Date().toISOString(),
                                archived_at: new Date().toISOString(),
                                sys_inbox_item_status: {
                                    ...currentItem.sys_inbox_item_status,
                                    codigo: "archived",
                                    nome: "Arquivada",
                                    color: "secondary",
                                    icon: "archive",
                                },
                            }
                            : currentItem,
                    );
                }

                return current.filter((currentItem) => currentItem.id !== item.id);
            });

            setPagination((current) => ({
                ...current,
                total: Math.max(0, current.total - (filter === "archived" ? 0 : 1)),
            }));

            setSelectedItem(null);

            setSnackbar({
                color: "success",
                title: "Mensagem arquivada",
                message: "A mensagem foi movida para arquivadas.",
            });
        } catch (error) {
            setSnackbar({
                color: "danger",
                title: "Erro ao arquivar mensagem",
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
                <div className="bp-inbox-filter-tabs" aria-label="Filtros do inbox">
                    {filters.map((item) => (
                        <button
                            key={item.value}
                            type="button"
                            className={[
                                "bp-inbox-filter-tab",
                                filter === item.value ? "active" : "",
                            ]
                                .filter(Boolean)
                                .join(" ")}
                            onClick={() => handleChangeFilter(item.value)}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="bp-inbox-filter-summary">
                    <span>{getPaginationText(pagination)}</span>

                    {unreadCount > 0 && (
                        <Badge color="primary" variant="soft">
                            {unreadCount} não lida{unreadCount > 1 ? "s" : ""}
                        </Badge>
                    )}

                    <Button
                        color="secondary"
                        variant="ghost"
                        size="sm"
                        onClick={() => loadItems()}
                        disabled={loading}
                        aria-label="Atualizar inbox"
                        title="Atualizar inbox"
                    >
                        <RefreshCw size={16}/>
                    </Button>
                </div>
            </div>

            <Card>
                {items.length === 0 ? (
                    <EmptyState
                        icon={<Bell size={26}/>}
                        title="Nenhuma mensagem encontrada"
                        description="Quando houver avisos, solicitações ou resultados importantes, eles aparecerão aqui."
                    />
                ) : (
                    <div className="bp-inbox-simple-list">
                        {items.map((item) => {
                            const unread = !item.read_at;

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
                                    onClick={() => handleOpenItem(item)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter" || event.key === " ") {
                                            event.preventDefault();
                                            handleOpenItem(item);
                                        }
                                    }}
                                >
                                    <span
                                        className={`bp-inbox-item-icon bp-ui-${getSafeColor(
                                            item.sys_inbox_item_tipo.color,
                                        )}`}
                                    >
                                        {getTypeIcon(item.sys_inbox_item_tipo.codigo)}
                                    </span>

                                    <span className="bp-inbox-notification-main">
                                        <span className="bp-inbox-notification-title-row">
                                            <strong>{item.titulo}</strong>

                                            <span className="bp-inbox-notification-meta">
                                                {formatDate(item.created_at)}
                                            </span>
                                        </span>

                                        <small>{item.mensagem}</small>

                                        <span className="bp-inbox-notification-footer">
                                            <Badge
                                                color={getSafeColor(
                                                    item.sys_inbox_item_status.color,
                                                )}
                                                variant="soft"
                                            >
                                                {getStatusIcon(
                                                    item.sys_inbox_item_status.codigo,
                                                )}
                                                {item.sys_inbox_item_status.nome}
                                            </Badge>

                                            {item.entidade_tipo && (
                                                <span className="bp-inbox-context-inline">
                                                    {item.entidade_tipo}
                                                    {item.entidade_id
                                                        ? ` #${item.entidade_id}`
                                                        : ""}
                                                </span>
                                            )}
                                        </span>
                                    </span>

                                    <span className="bp-inbox-notification-actions">
    {unread ? (
        <Button
            color="secondary"
            variant="ghost"
            size="sm"
            title="Marcar como lida"
            aria-label="Marcar como lida"
            onClick={(event) => {
                event.stopPropagation();
                markItemAsRead(item);
            }}
        >
            <MailOpen size={15}/>
        </Button>
    ) : (
        <Button
            color="secondary"
            variant="ghost"
            size="sm"
            title="Marcar como não lida"
            aria-label="Marcar como não lida"
            onClick={(event) => {
                event.stopPropagation();
                handleMarkAsUnread(item);
            }}
        >
            <Mail size={15}/>
        </Button>
    )}

                                        {!item.archived_at && (
                                            <Button
                                                color="secondary"
                                                variant="ghost"
                                                size="sm"
                                                title="Arquivar"
                                                aria-label="Arquivar"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    handleArchive(item);
                                                }}
                                            >
                                                <Archive size={15}/>
                                            </Button>
                                        )}

                                        {unread && <span className="bp-inbox-unread-dot"/>}
</span></div>
                            );
                        })}
                    </div>
                )}
            </Card>

            {items.length > 0 && (
                <div className="bp-inbox-pagination">
                    <Button
                        color="secondary"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            loadItems({
                                nextPage: pagination.page - 1,
                            })
                        }
                        disabled={loading || !pagination.hasPreviousPage}
                    >
                        Anterior
                    </Button>

                    <span>
                        Página {pagination.page} de {pagination.totalPages}
                    </span>

                    <Button
                        color="secondary"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                            loadItems({
                                nextPage: pagination.page + 1,
                            })
                        }
                        disabled={loading || !pagination.hasNextPage}
                    >
                        Próxima
                    </Button>
                </div>
            )}

            <Modal
                open={Boolean(selectedItem)}
                title={selectedItem?.titulo ?? "Mensagem"}
                description={
                    selectedItem
                        ? `${selectedItem.sys_inbox_item_tipo.nome} • ${formatDate(
                            selectedItem.created_at,
                        )}`
                        : undefined
                }
                onClose={() => setSelectedItem(null)}
            >
                {selectedItem && (
                    <div className="bp-inbox-modal-content">
                        <div className="bp-inbox-modal-status-row">
                            <Badge
                                color={getSafeColor(
                                    selectedItem.sys_inbox_item_status.color,
                                )}
                                variant="soft"
                            >
                                {getStatusIcon(selectedItem.sys_inbox_item_status.codigo)}
                                {selectedItem.sys_inbox_item_status.nome}
                            </Badge>

                            {selectedItem.read_at ? (
                                <Badge color="secondary" variant="soft">
                                    <MailOpen size={13}/>
                                    Lida
                                </Badge>
                            ) : (
                                <Badge color="primary" variant="soft">
                                    <Mail size={13}/>
                                    Não lida
                                </Badge>
                            )}
                        </div>

                        <p className="bp-inbox-message">{selectedItem.mensagem}</p>

                        {(selectedItem.entidade_tipo || selectedItem.entidade_id) && (
                            <div className="bp-inbox-context">
                                <span>Contexto</span>
                                <strong>
                                    {selectedItem.entidade_tipo || "Entidade"}
                                    {selectedItem.entidade_id
                                        ? ` #${selectedItem.entidade_id}`
                                        : ""}
                                </strong>
                            </div>
                        )}

                        <div className="bp-inbox-detail-actions">
                            {selectedItem.action_url && (
                                <AppLink
                                    href={selectedItem.action_url}
                                    color="primary"
                                    variant="solid"
                                >
                                    <ExternalLink size={17}/>
                                    Abrir
                                </AppLink>
                            )}

                            {selectedItem.read_at ? (
                                <Button
                                    color="secondary"
                                    variant="soft"
                                    onClick={() => handleMarkAsUnread(selectedItem)}
                                >
                                    <Mail size={17}/>
                                    Marcar como não lida
                                </Button>
                            ) : (
                                <Button
                                    color="secondary"
                                    variant="soft"
                                    onClick={() => markItemAsRead(selectedItem)}
                                >
                                    <MailOpen size={17}/>
                                    Marcar como lida
                                </Button>
                            )}

                            {!selectedItem.archived_at && (
                                <Button
                                    color="secondary"
                                    variant="ghost"
                                    onClick={() => handleArchive(selectedItem)}
                                >
                                    <Archive size={17}/>
                                    Arquivar
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {snackbar && <Snackbar {...snackbar} onClose={() => setSnackbar(null)}/>}
        </div>
    );
}