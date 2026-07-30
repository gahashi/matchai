"use client";

import {
    Bell,
    CheckCircle2,
    Inbox,
    Info, RefreshCw,
} from "lucide-react";
import {
    useRouter,
} from "next/navigation";
import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    AppLink,
} from "@/components/ui/AppLink";
import {
    Button,
} from "@/components/ui/Button";
import {
    Popover,
} from "@/components/ui/Popover";
import {
    Skeleton,
} from "@/components/ui/Skeleton";

type InboxTopbarButtonProps = {
    initialUnreadCount: number;
    mobile?: boolean;
};

import {
    dispatchInboxChanged,
    INBOX_CHANGED_EVENT,
} from "@/lib/sys/inbox/inbox-events";

type PopoverInboxItem = {
    id: number;
    titulo: string;
    contexto_titulo: string | null;
    contexto_descricao: string | null;
    read_at: Date | string | null;
    created_at: Date | string | null;
    sys_inbox_item_tipo: {
        codigo: string;
        nome: string;
        color: string | null;
        icon: string | null;
    };
    actions: Array<{
        codigo: string;
        label: string;
        kind: string;
        href: string | null;
    }>;
};

function formatUnreadCount(
    value: number
) {
    if (value > 99) {
        return "99+";
    }

    return String(value);
}

function formatDate(
    value: Date | string | null
) {
    if (!value) {
        return "Agora";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Agora";
    }

    return new Intl.DateTimeFormat(
        "pt-BR",
        {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        }
    ).format(date);
}

function getTypeIcon(
    codigo: string
) {
    switch (codigo) {
        case "request":
            return <Inbox size={16} />;

        case "result":
            return (
                <CheckCircle2 size={16} />
            );

        case "info":
        default:
            return <Info size={16} />;
    }
}

function getOpenHref(
    item: PopoverInboxItem
) {
    const openAction =
        item.actions.find(
            (action) =>
                action.codigo === "abrir" &&
                action.kind ===
                "navigation" &&
                action.href
        );

    return (
        openAction?.href ??
        "/sys/inbox"
    );
}

export function InboxTopbarButton({
                                      initialUnreadCount,
                                      mobile = false,
                                  }: InboxTopbarButtonProps) {
    const router = useRouter();

    const [open, setOpen] =
        useState(false);

    const [
        unreadCount,
        setUnreadCount,
    ] = useState(
        Math.max(0, initialUnreadCount)
    );

    const [items, setItems] =
        useState<PopoverInboxItem[]>([]);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState<string | null>(null);

    const loadUnreadCount =
        useCallback(async () => {
            try {
                const response = await fetch(
                    "/api/sys/inbox/unread-count",
                    {
                        method: "GET",
                        cache: "no-store",
                    }
                );

                const data =
                    await response.json();

                if (
                    !response.ok ||
                    !data.ok
                ) {
                    return;
                }

                setUnreadCount(
                    Math.max(
                        0,
                        Number(
                            data.unreadCount
                        ) || 0
                    )
                );
            } catch {
                /*
                 * A falha silenciosa aqui não deve
                 * bloquear o restante do layout.
                 */
            }
        }, []);


    const ariaLabel =
        unreadCount > 0
            ? `Inbox com ${unreadCount} mensagem${
                unreadCount === 1
                    ? ""
                    : "s"
            } não lida${
                unreadCount === 1
                    ? ""
                    : "s"
            }`
            : "Inbox";

    const loadPopover =
        useCallback(async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(
                    "/api/sys/inbox?filter=all&sort=unread_first&page=1&pageSize=5",
                    {
                        method: "GET",
                        cache: "no-store",
                    }
                );

                const data =
                    await response.json();

                if (
                    !response.ok ||
                    !data.ok
                ) {
                    throw new Error(
                        data.message ??
                        "Não foi possível carregar as notificações."
                    );
                }

                setItems(
                    Array.isArray(data.items)
                        ? data.items
                        : []
                );

                await loadUnreadCount();
            } catch (loadError) {
                setError(
                    loadError instanceof Error
                        ? loadError.message
                        : "Não foi possível carregar as notificações."
                );
            } finally {
                setLoading(false);
            }
        }, [loadUnreadCount]);

    async function handleOpenChange(
        nextOpen: boolean
    ) {
        setOpen(nextOpen);

        if (nextOpen) {
            await loadPopover();
        }
    }


    useEffect(() => {
        function handleInboxChanged() {
            void loadUnreadCount();

            if (open) {
                void loadPopover();
            }
        }

        window.addEventListener(
            INBOX_CHANGED_EVENT,
            handleInboxChanged
        );

        return () => {
            window.removeEventListener(
                INBOX_CHANGED_EVENT,
                handleInboxChanged
            );
        };
    }, [
        loadPopover,
        loadUnreadCount,
        open,
    ]);


    async function handleOpenItem(
        item: PopoverInboxItem
    ) {
        const wasUnread =
            !item.read_at;

        try {
            if (wasUnread) {
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
                        data.message ??
                        "Não foi possível marcar a mensagem como lida."
                    );
                }

                setUnreadCount(
                    (current) =>
                        Math.max(
                            0,
                            current - 1
                        )
                );

                setItems((current) =>
                    current.map(
                        (currentItem) =>
                            currentItem.id ===
                            item.id
                                ? {
                                    ...currentItem,
                                    read_at:
                                        new Date().toISOString(),
                                }
                                : currentItem
                    )
                );
                dispatchInboxChanged({
                    itemId: item.id,
                    action: "read",
                });
            }

            setOpen(false);

            router.push(
                getOpenHref(item)
            );
        } catch (openError) {
            setError(
                openError instanceof Error
                    ? openError.message
                    : "Não foi possível abrir a mensagem."
            );
        }
    }

    return (
        <Popover
            open={open}
            onOpenChange={
                handleOpenChange
            }
            align="end"
            className={[
                "bp-inbox-popover",
                mobile
                    ? "bp-inbox-popover-mobile"
                    : "",
            ]
                .filter(Boolean)
                .join(" ")}
            trigger={(triggerProps) => (
                <Button
                    ref={triggerProps.ref}
                    type="button"
                    color="secondary"
                    variant="ghost"
                    size="sm"
                    className={[
                        "bp-inbox-topbar-button",
                        mobile
                            ? "bp-inbox-topbar-button-mobile"
                            : "",
                    ]
                        .filter(Boolean)
                        .join(" ")}
                    aria-label={ariaLabel}
                    title={ariaLabel}
                    aria-expanded={
                        triggerProps[
                            "aria-expanded"
                            ]
                    }
                    aria-controls={
                        triggerProps[
                            "aria-controls"
                            ]
                    }
                    aria-haspopup={
                        triggerProps[
                            "aria-haspopup"
                            ]
                    }
                    onClick={
                        triggerProps.onClick
                    }
                >
                    <Bell size={17} />

                    {unreadCount > 0 ? (
                        <span className="bp-inbox-topbar-count">
                            {formatUnreadCount(
                                unreadCount
                            )}
                        </span>
                    ) : null}
                </Button>
            )}
        >
            <div className="bp-inbox-popover-header">
                <div>
                    <strong>
                        Notificações
                    </strong>

                    <span>
                        {unreadCount > 0
                            ? `${unreadCount} não lida${
                                unreadCount === 1
                                    ? ""
                                    : "s"
                            }`
                            : "Nenhuma pendência"}
                    </span>
                </div>

                <Button
                    type="button"
                    color="secondary"
                    variant="ghost"
                    size="sm"
                    aria-label="Atualizar notificações"
                    title="Atualizar notificações"
                    disabled={loading}
                    onClick={loadPopover}
                >
                    <RefreshCw
                        size={16}
                    />                </Button>
            </div>

            <div className="bp-inbox-popover-list">
                {loading ? (
                    Array.from({
                        length: 3,
                    }).map((_, index) => (
                        <div
                            key={index}
                            className="bp-inbox-popover-skeleton"
                        >
                            <Skeleton
                                width={34}
                                height={34}
                                radius={12}
                            />

                            <div>
                                <Skeleton
                                    height={13}
                                    width="75%"
                                />

                                <Skeleton
                                    height={11}
                                    width="50%"
                                />
                            </div>
                        </div>
                    ))
                ) : error ? (
                    <div className="bp-inbox-popover-state bp-inbox-popover-error">
                        <strong>
                            Não foi possível carregar
                        </strong>

                        <span>{error}</span>

                        <Button
                            type="button"
                            color="secondary"
                            variant="soft"
                            size="sm"
                            onClick={
                                loadPopover
                            }
                        >
                            Tentar novamente
                        </Button>
                    </div>
                ) : items.length === 0 ? (
                    <div className="bp-inbox-popover-state">
                        <Bell size={22} />

                        <strong>
                            Nenhuma notificação
                        </strong>

                        <span>
                            Novas mensagens aparecerão aqui.
                        </span>
                    </div>
                ) : (
                    items.map((item) => {
                        const unread =
                            !item.read_at;

                        return (
                            <button
                                key={item.id}
                                type="button"
                                className={[
                                    "bp-inbox-popover-item",
                                    unread
                                        ? "unread"
                                        : "",
                                ]
                                    .filter(Boolean)
                                    .join(" ")}
                                onClick={() =>
                                    handleOpenItem(
                                        item
                                    )
                                }
                            >
                                <span className="bp-inbox-popover-icon">
                                    {getTypeIcon(
                                        item
                                            .sys_inbox_item_tipo
                                            .codigo
                                    )}
                                </span>

                                <span className="bp-inbox-popover-main">
                                    <span className="bp-inbox-popover-title-row">
                                        <strong>
                                            {
                                                item.titulo
                                            }
                                        </strong>

                                        {unread ? (
                                            <span
                                                className="bp-inbox-popover-unread-dot"
                                                aria-label="Não lida"
                                            />
                                        ) : null}
                                    </span>

                                    {item.contexto_titulo ||
                                    item.contexto_descricao ? (
                                        <span className="bp-inbox-popover-context">
                                            {[
                                                item.contexto_titulo,
                                                item.contexto_descricao,
                                            ]
                                                .filter(
                                                    Boolean
                                                )
                                                .join(
                                                    " — "
                                                )}
                                        </span>
                                    ) : null}

                                    <small>
                                        {formatDate(
                                            item.created_at
                                        )}
                                    </small>
                                </span>
                            </button>
                        );
                    })
                )}
            </div>

            <div className="bp-inbox-popover-footer">
                <AppLink
                    href="/sys/inbox"
                    color="primary"
                    variant="soft"
                    size="sm"
                    fullWidth
                    onClick={() =>
                        setOpen(false)
                    }
                >
                    Ver todas as mensagens
                </AppLink>
            </div>
        </Popover>
    );
}