import { prisma } from "@/lib/prisma";

import type {
    PublicEvento,
} from "@/lib/cad/evento-public-types";

type ListHomeEventsOptions = {
    limit?: number;
};

const eventoPublicSelect = {
    id: true,
    titulo: true,
    descricao: true,
    url: true,
    evento_at: true,
    ordem: true,
    destaque: true,

    banner_sys_arquivo: {
        select: {
            public_url: true,
        },
    },
};

class EventoPublicService {
    async listHomeEvents(
        options: ListHomeEventsOptions = {},
    ): Promise<PublicEvento[]> {
        const now = new Date();

        const limit = Math.min(
            Math.max(options.limit ?? 8, 1),
            12,
        );

        const eventos =
            await prisma.cadEvento.findMany({
                where: {
                    deleted_at: null,
                    ativo: 1,
                    visivel_publico: 1,

                    AND: [
                        {
                            OR: [
                                { inicio_exibicao: null },
                                {
                                    inicio_exibicao: {
                                        lte: now,
                                    },
                                },
                            ],
                        },
                        {
                            OR: [
                                { fim_exibicao: null },
                                {
                                    fim_exibicao: {
                                        gte: now,
                                    },
                                },
                            ],
                        },
                    ],
                },

                select: eventoPublicSelect,

                orderBy: [
                    { destaque: "desc" },
                    { ordem: "asc" },
                    { evento_at: "asc" },
                    { id: "desc" },
                ],

                take: limit,
            });

        return eventos.map((evento) => ({
            id: evento.id,
            titulo: evento.titulo,
            descricao: evento.descricao,
            url: evento.url,
            evento_at: evento.evento_at
                ? evento.evento_at.toISOString()
                : null,
            destaque: Boolean(evento.destaque),
            banner: evento.banner_sys_arquivo
                ? {
                    public_url:
                        evento.banner_sys_arquivo.public_url,
                }
                : null,
        }));
    }
}

export const eventoPublicService =
    new EventoPublicService();
