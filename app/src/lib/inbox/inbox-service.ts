import { prisma } from "@/lib/prisma";

export type InboxFilter = "all" | "unread" | "requests" | "results" | "archived";
export type InboxSort = "recent" | "oldest" | "unread_first";

type CreateInboxItemInput = {
    sysUsuarioId: number;
    tipoCodigo?: "info" | "request" | "result";
    statusCodigo?: "unread" | "read" | "pending" | "approved" | "rejected" | "archived";
    titulo: string;
    mensagem: string;
    actionUrl?: string | null;
    entidadeTipo?: string | null;
    entidadeId?: number | null;
    metadataText?: string | null;
};

type ListInboxItemsInput = {
    sysUsuarioId: number;
    filter?: InboxFilter;
    sort?: InboxSort;
    page?: number;
    pageSize?: number;
};

function normalizarPage(page?: number) {
    if (!page || page < 1) return 1;
    return Math.floor(page);
}

function normalizarPageSize(pageSize?: number) {
    if (!pageSize) return 20;
    if (pageSize < 5) return 5;
    if (pageSize > 50) return 50;
    return Math.floor(pageSize);
}

async function getTipoId(codigo: string) {
    const tipo = await prisma.sysInboxItemTipo.findUnique({
        where: { codigo },
        select: { id: true },
    });

    if (!tipo) {
        throw new Error(`Tipo de inbox não encontrado: ${codigo}`);
    }

    return tipo.id;
}

async function getStatusId(codigo: string) {
    const status = await prisma.sysInboxItemStatus.findUnique({
        where: { codigo },
        select: { id: true },
    });

    if (!status) {
        throw new Error(`Status de inbox não encontrado: ${codigo}`);
    }

    return status.id;
}

function buildWhere({
                        sysUsuarioId,
                        filter,
                    }: {
    sysUsuarioId: number;
    filter: InboxFilter;
}) {
    const where: any = {
        sys_usuario_id: sysUsuarioId,
        ativo: 1,
        deleted_at: null,
    };

    if (filter === "archived") {
        where.archived_at = {
            not: null,
        };
    } else {
        where.archived_at = null;
    }

    if (filter === "unread") {
        where.read_at = null;
    }

    if (filter === "requests") {
        where.sys_inbox_item_tipo = {
            codigo: "request",
        };
    }

    if (filter === "results") {
        where.sys_inbox_item_tipo = {
            codigo: "result",
        };
    }

    return where;
}

function buildOrderBy(sort: InboxSort) {
    if (sort === "oldest") {
        return [
            {
                created_at: "asc" as const,
            },
        ];
    }

    if (sort === "unread_first") {
        return [
            {
                read_at: "asc" as const,
            },
            {
                created_at: "desc" as const,
            },
        ];
    }

    return [
        {
            created_at: "desc" as const,
        },
    ];
}

export const inboxService = {
    async createItem({
                         sysUsuarioId,
                         tipoCodigo = "info",
                         statusCodigo = "unread",
                         titulo,
                         mensagem,
                         actionUrl = null,
                         entidadeTipo = null,
                         entidadeId = null,
                         metadataText = null,
                     }: CreateInboxItemInput) {
        const [tipoId, statusId] = await Promise.all([
            getTipoId(tipoCodigo),
            getStatusId(statusCodigo),
        ]);

        return prisma.sysInboxItem.create({
            data: {
                sys_usuario_id: sysUsuarioId,
                sys_inbox_item_tipo_id: tipoId,
                sys_inbox_item_status_id: statusId,
                titulo,
                mensagem,
                action_url: actionUrl,
                entidade_tipo: entidadeTipo,
                entidade_id: entidadeId,
                metadata_text: metadataText,
                ativo: 1,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });
    },

    async listItems({
                        sysUsuarioId,
                        filter = "all",
                        sort = "recent",
                        page,
                        pageSize,
                    }: ListInboxItemsInput) {
        const resolvedPage = normalizarPage(page);
        const resolvedPageSize = normalizarPageSize(pageSize);
        const skip = (resolvedPage - 1) * resolvedPageSize;

        const where = buildWhere({
            sysUsuarioId,
            filter,
        });

        const [total, items] = await Promise.all([
            prisma.sysInboxItem.count({ where }),
            prisma.sysInboxItem.findMany({
                where,
                select: {
                    id: true,
                    titulo: true,
                    mensagem: true,
                    action_url: true,
                    entidade_tipo: true,
                    entidade_id: true,
                    read_at: true,
                    archived_at: true,
                    created_at: true,
                    sys_inbox_item_tipo: {
                        select: {
                            codigo: true,
                            nome: true,
                            color: true,
                            icon: true,
                        },
                    },
                    sys_inbox_item_status: {
                        select: {
                            codigo: true,
                            nome: true,
                            color: true,
                            icon: true,
                        },
                    },
                },
                orderBy: buildOrderBy(sort),
                skip,
                take: resolvedPageSize,
            }),
        ]);

        const totalPages = Math.max(1, Math.ceil(total / resolvedPageSize));

        return {
            items,
            pagination: {
                page: resolvedPage,
                pageSize: resolvedPageSize,
                total,
                totalPages,
                hasPreviousPage: resolvedPage > 1,
                hasNextPage: resolvedPage < totalPages,
            },
        };
    },

    async markAsRead({
                         sysUsuarioId,
                         inboxItemId,
                     }: {
        sysUsuarioId: number;
        inboxItemId: number;
    }) {
        const item = await prisma.sysInboxItem.findFirst({
            where: {
                id: inboxItemId,
                sys_usuario_id: sysUsuarioId,
                deleted_at: null,
            },
            select: {
                id: true,
                sys_inbox_item_status: {
                    select: {
                        codigo: true,
                    },
                },
            },
        });

        if (!item) {
            return {
                count: 0,
            };
        }

        const data: any = {
            read_at: new Date(),
            updated_at: new Date(),
        };

        if (item.sys_inbox_item_status.codigo === "unread") {
            data.sys_inbox_item_status_id = await getStatusId("read");
        }

        return prisma.sysInboxItem.updateMany({
            where: {
                id: inboxItemId,
                sys_usuario_id: sysUsuarioId,
                deleted_at: null,
            },
            data,
        });
    },

    async markAsUnread({
                           sysUsuarioId,
                           inboxItemId,
                       }: {
        sysUsuarioId: number;
        inboxItemId: number;
    }) {
        const item = await prisma.sysInboxItem.findFirst({
            where: {
                id: inboxItemId,
                sys_usuario_id: sysUsuarioId,
                deleted_at: null,
            },
            select: {
                id: true,
                sys_inbox_item_status: {
                    select: {
                        codigo: true,
                    },
                },
            },
        });

        if (!item) {
            return {
                count: 0,
            };
        }

        const data: any = {
            read_at: null,
            updated_at: new Date(),
        };

        if (item.sys_inbox_item_status.codigo === "read") {
            data.sys_inbox_item_status_id = await getStatusId("unread");
        }

        return prisma.sysInboxItem.updateMany({
            where: {
                id: inboxItemId,
                sys_usuario_id: sysUsuarioId,
                deleted_at: null,
            },
            data,
        });
    },

    async archive({
                      sysUsuarioId,
                      inboxItemId,
                  }: {
        sysUsuarioId: number;
        inboxItemId: number;
    }) {
        const statusArchivedId = await getStatusId("archived");
        const now = new Date();

        return prisma.sysInboxItem.updateMany({
            where: {
                id: inboxItemId,
                sys_usuario_id: sysUsuarioId,
                deleted_at: null,
            },
            data: {
                sys_inbox_item_status_id: statusArchivedId,
                read_at: now,
                archived_at: now,
                updated_at: now,
            },
        });
    },
};