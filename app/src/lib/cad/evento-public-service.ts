import {
    prisma,
} from "@/lib/prisma";

import type {
    PublicEvento,
} from "@/lib/cad/evento-public-types";


type ListHomeEventsOptions = {
    limit?: number;
};


type ListPartnerEventsOptions = {
    parceiroId: number;
    limit?: number;
};


type ListEventsOptions = {
    parceiroId: number | null;
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
            public_url:
                true,
        },
    },
};


class EventoPublicService {
    private async listEvents(
        options: ListEventsOptions,
    ): Promise<PublicEvento[]> {
        const now =
            new Date();


        const limit =
            options.limit !== undefined
                ? Math.min(
                    Math.max(options.limit, 1),
                    100,
                )
                : undefined;


        const eventos =
            await prisma
                .cadEvento
                .findMany({
                    where: {
                        par_parceiro_id:
                        options
                            .parceiroId,

                        deleted_at:
                            null,

                        ativo:
                            1,

                        visivel_publico:
                            1,

                        AND: [
                            {
                                OR: [
                                    {
                                        inicio_exibicao:
                                            null,
                                    },
                                    {
                                        inicio_exibicao: {
                                            lte:
                                            now,
                                        },
                                    },
                                ],
                            },
                            {
                                OR: [
                                    {
                                        fim_exibicao:
                                            null,
                                    },
                                    {
                                        fim_exibicao: {
                                            gte:
                                            now,
                                        },
                                    },
                                ],
                            },
                        ],
                    },

                    select:
                    eventoPublicSelect,

                    orderBy: [
                        {
                            destaque:
                                "desc",
                        },
                        {
                            ordem:
                                "asc",
                        },
                        {
                            evento_at:
                                "asc",
                        },
                        {
                            id:
                                "desc",
                        },
                    ],

                    ...(limit !== undefined
                        ? {
                            take: limit,
                        }
                        : {}),
                });


        return eventos.map(
            (
                evento,
            ) => ({
                id:
                evento.id,

                titulo:
                evento.titulo,

                descricao:
                evento.descricao,

                url:
                evento.url,

                evento_at:
                    evento.evento_at
                        ? evento
                            .evento_at
                            .toISOString()
                        : null,

                destaque:
                    Boolean(
                        evento.destaque,
                    ),

                banner:
                    evento
                        .banner_sys_arquivo
                        ? {
                            public_url:
                            evento
                                .banner_sys_arquivo
                                .public_url,
                        }
                        : null,
            }),
        );
    }


    async listHomeEvents(
        options:
        ListHomeEventsOptions = {},
    ) {
        /*
         * Página pública da AAACCU:
         * somente eventos sem parceiro.
         */
        return this.listEvents({
            parceiroId:
                null,

            limit:
            options.limit,
        });
    }


    async listPartnerEvents(
        options:
        ListPartnerEventsOptions,
    ) {
        if (
            !Number.isInteger(
                options.parceiroId,
            ) ||
            options.parceiroId <= 0
        ) {
            return [];
        }


        return this.listEvents({
            parceiroId:
            options
                .parceiroId,

            limit:
            options.limit,
        });
    }
}


export const eventoPublicService =
    new EventoPublicService();