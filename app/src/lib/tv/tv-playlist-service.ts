import {
    prisma,
} from "@/lib/prisma";


export type TvPlaylistItem = {
    id: string;
    origem: "evento" | "promocao";
    origem_id: number;

    titulo: string;
    descricao: string | null;

    kicker: string;
    preco_label: string | null;

    media_url: string | null;
    media_tipo: "imagem" | "video";

    link: string | null;

    meta: string[];

    cor_destaque: string;

    parceiro: {
        id: number;
        slug: string;
        nome: string;
        logo_url: string | null;
    } | null;
};


export type TvPlaylistData = {
    contexto: {
        tipo: "geral" | "aaaccu" | "parceiro";
        slug: string | null;
        titulo: string;
        subtitulo: string;
    };

    itens: TvPlaylistItem[];
    generated_at: string;
};


const EVENTO_COR = "#f4d35e";


function formatMoney(
    value: number,
) {
    return new Intl.NumberFormat(
        "pt-BR",
        {
            style:
                "currency",

            currency:
                "BRL",
        },
    ).format(
        value,
    );
}


function formatEventoDate(
    value: Date | null,
) {
    if (!value) {
        return null;
    }

    return new Intl.DateTimeFormat(
        "pt-BR",
        {
            timeZone:
                "America/Sao_Paulo",

            day:
                "2-digit",

            month:
                "long",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit",
        },
    ).format(
        value,
    );
}


function getSaoPauloNow() {
    const parts =
        new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone:
                    "America/Sao_Paulo",

                year:
                    "numeric",

                month:
                    "2-digit",

                day:
                    "2-digit",

                hour:
                    "2-digit",

                minute:
                    "2-digit",

                hourCycle:
                    "h23",

                weekday:
                    "short",
            },
        )
            .formatToParts(
                new Date(),
            );

    const values =
        Object.fromEntries(
            parts.map(
                (
                    part,
                ) => [
                    part.type,
                    part.value,
                ],
            ),
        );

    const weekdayMap:
        Record<string, number> = {
        Sun: 0,
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6,
    };

    return {
        date:
            `${values.year}-${values.month}-${values.day}`,

        weekday:
            weekdayMap[
                values.weekday
            ],

        minuteOfDay:
            Number(
                values.hour,
            ) *
            60 +
            Number(
                values.minute,
            ),
    };
}


function dateOnly(
    value: Date | null,
) {
    if (!value) {
        return null;
    }

    return [
        value
            .getUTCFullYear(),

        String(
            value
                .getUTCMonth() +
            1,
        ).padStart(
            2,
            "0",
        ),

        String(
            value
                .getUTCDate(),
        ).padStart(
            2,
            "0",
        ),
    ].join(
        "-",
    );
}


function timeToString(
    value: Date,
) {
    return `${String(
        value.getUTCHours(),
    ).padStart(
        2,
        "0",
    )}:${String(
        value.getUTCMinutes(),
    ).padStart(
        2,
        "0",
    )}`;
}


function timeToMinutes(
    value: Date,
) {
    return (
        value.getUTCHours() *
        60
    ) +
        value.getUTCMinutes();
}


function isHorarioAtual(
    horario: {
        dia_semana: number;
        hora_inicio: Date;
        hora_fim: Date;
    },

    now:
        ReturnType<
            typeof getSaoPauloNow
        >,
) {
    const inicio =
        timeToMinutes(
            horario
                .hora_inicio,
        );

    const fim =
        timeToMinutes(
            horario
                .hora_fim,
        );

    if (
        inicio <
        fim
    ) {
        return (
            now.weekday ===
            horario.dia_semana &&
            now.minuteOfDay >=
            inicio &&
            now.minuteOfDay <
            fim
        );
    }

    const diaSeguinte =
        (
            horario.dia_semana +
            1
        ) %
        7;

    return (
        (
            now.weekday ===
            horario.dia_semana &&
            now.minuteOfDay >=
            inicio
        ) ||
        (
            now.weekday ===
            diaSeguinte &&
            now.minuteOfDay <
            fim
        )
    );
}


function isPromocaoValidaAgora(
    promocao: {
        validade_inicio: Date | null;
        validade_fim: Date | null;

        crd_promocao_horarios: Array<{
            dia_semana: number;
            hora_inicio: Date;
            hora_fim: Date;
        }>;
    },

    now:
        ReturnType<
            typeof getSaoPauloNow
        >,
) {
    const inicio =
        dateOnly(
            promocao
                .validade_inicio,
        );

    const fim =
        dateOnly(
            promocao
                .validade_fim,
        );

    if (
        inicio &&
        inicio >
        now.date
    ) {
        return false;
    }

    if (
        fim &&
        fim <
        now.date
    ) {
        return false;
    }

    return promocao
        .crd_promocao_horarios
        .some(
            (
                horario,
            ) =>
                isHorarioAtual(
                    horario,
                    now,
                ),
        );
}


function getMediaTipo(
    mimeType: string | null,
): "imagem" | "video" {
    return mimeType?.startsWith(
        "video/",
    )
        ? "video"
        : "imagem";
}


function getDayShortLabel(
    diaSemana: number,
) {
    const labels = [
        "Dom",
        "Seg",
        "Ter",
        "Qua",
        "Qui",
        "Sex",
        "Sáb",
    ];

    return labels[
        diaSemana
    ] ??
        "";
}


function getHorarioAtualResumo(
    horarios: Array<{
        dia_semana: number;
        hora_inicio: Date;
        hora_fim: Date;
    }>,

    now:
        ReturnType<
            typeof getSaoPauloNow
        >,
) {
    const horario =
        horarios.find(
            (
                item,
            ) =>
                isHorarioAtual(
                    item,
                    now,
                ),
        );

    if (!horario) {
        return null;
    }

    return `${getDayShortLabel(
        horario.dia_semana,
    )} ${timeToString(
        horario.hora_inicio,
    )}–${timeToString(
        horario.hora_fim,
    )}`;
}


function interleaveGroups(
    groups:
        TvPlaylistItem[][],
) {
    const queues =
        groups
            .filter(
                (
                    group,
                ) =>
                    group.length >
                    0,
            )
            .map(
                (
                    group,
                ) => [
                    ...group,
                ],
            );

    const result:
        TvPlaylistItem[] =
        [];

    while (
        queues.some(
            (
                queue,
            ) =>
                queue.length >
                0,
        )
    ) {
        for (
            const queue
            of queues
        ) {
            const item =
                queue.shift();

            if (
                item
            ) {
                result.push(
                    item,
                );
            }
        }
    }

    return result;
}


class TvPlaylistService {
    async getPlaylist(
        slugValue?:
            string |
            null,
    ): Promise<TvPlaylistData | null> {
        const slug =
            slugValue
                ?.trim()
                .toLowerCase() ||
            null;

        const isAaaccu =
            slug ===
            "aaaccu";

        let parceiroFiltro:
            {
                id: number;
                slug: string;
                nome: string;
            } |
            null =
            null;

        if (
            slug &&
            !isAaaccu
        ) {
            parceiroFiltro =
                await prisma
                    .parParceiro
                    .findFirst({
                        where: {
                            slug,
                            ativo: 1,
                            visivel_publico: 1,
                            deleted_at: null,
                        },

                        select: {
                            id: true,
                            slug: true,
                            nome: true,
                        },
                    });

            if (
                !parceiroFiltro
            ) {
                return null;
            }
        }

        const includeEventos =
            !slug ||
            isAaaccu;

        const includePromocoes =
            !isAaaccu;

        const [
            eventos,
            promocoes,
        ] =
            await Promise.all([
                includeEventos
                    ? prisma
                        .cadEvento
                        .findMany({
                            where: {
                                deleted_at: null,
                                ativo: 1,
                                visivel_publico: 1,

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
                                                        new Date(),
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
                                                        new Date(),
                                                },
                                            },
                                        ],
                                    },
                                ],
                            },

                            select: {
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
                                        mime_type: true,
                                        deleted_at: true,
                                    },
                                },
                            },

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
                        })
                    : Promise.resolve(
                        [],
                    ),

                includePromocoes
                    ? prisma
                        .crdPromocao
                        .findMany({
                            where: {
                                deleted_at: null,
                                ativo: 1,
                                exibir_tv: 1,

                                par_parceiro_id:
                                    parceiroFiltro
                                        ?.id,

                                par_parceiro: {
                                    ativo: 1,
                                    visivel_publico: 1,
                                    deleted_at: null,
                                },
                            },

                            select: {
                                id: true,
                                titulo: true,
                                descricao: true,
                                preco_promocional: true,
                                validade_inicio: true,
                                validade_fim: true,
                                ordem: true,

                                imagem_sys_arquivo: {
                                    select: {
                                        public_url: true,
                                        mime_type: true,
                                        deleted_at: true,
                                    },
                                },

                                par_parceiro: {
                                    select: {
                                        id: true,
                                        slug: true,
                                        nome: true,

                                        par_parceiro_tema: {
                                            select: {
                                                ativo: true,
                                                cor_primaria: true,

                                                logo_sys_arquivo: {
                                                    select: {
                                                        public_url: true,
                                                        deleted_at: true,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },

                                crd_promocao_horarios: {
                                    select: {
                                        dia_semana: true,
                                        hora_inicio: true,
                                        hora_fim: true,
                                    },

                                    orderBy: [
                                        {
                                            dia_semana:
                                                "asc",
                                        },
                                        {
                                            hora_inicio:
                                                "asc",
                                        },
                                        {
                                            id:
                                                "asc",
                                        },
                                    ],
                                },

                                crd_promocao_itens: {
                                    select: {
                                        ordem: true,

                                        crd_item: {
                                            select: {
                                                id: true,
                                                nome: true,
                                                ativo: true,
                                                deleted_at: true,

                                                crd_categoria: {
                                                    select: {
                                                        ativo: true,
                                                        deleted_at: true,
                                                    },
                                                },

                                                imagem_sys_arquivo: {
                                                    select: {
                                                        public_url: true,
                                                        mime_type: true,
                                                        deleted_at: true,
                                                    },
                                                },
                                            },
                                        },
                                    },

                                    orderBy: [
                                        {
                                            ordem:
                                                "asc",
                                        },
                                        {
                                            id:
                                                "asc",
                                        },
                                    ],
                                },
                            },

                            orderBy: [
                                {
                                    par_parceiro: {
                                        nome:
                                            "asc",
                                    },
                                },
                                {
                                    ordem:
                                        "asc",
                                },
                                {
                                    id:
                                        "asc",
                                },
                            ],
                        })
                    : Promise.resolve(
                        [],
                    ),
            ]);

        const eventoItems:
            TvPlaylistItem[] =
            eventos.map(
                (
                    evento,
                ) => {
                    const banner =
                        evento
                            .banner_sys_arquivo;

                    const bannerValido =
                        banner &&
                        !banner.deleted_at
                            ? banner
                            : null;

                    const dataEvento =
                        formatEventoDate(
                            evento
                                .evento_at,
                        );

                    return {
                        id:
                            `evento:${evento.id}`,

                        origem:
                            "evento",

                        origem_id:
                            evento.id,

                        titulo:
                            evento.titulo,

                        descricao:
                            evento.descricao,

                        kicker:
                            evento.destaque
                                ? "Evento em destaque"
                                : "Evento AAACCU",

                        preco_label:
                            null,

                        media_url:
                            bannerValido
                                ?.public_url ??
                            null,

                        media_tipo:
                            getMediaTipo(
                                bannerValido
                                    ?.mime_type ??
                                null,
                            ),

                        link:
                            evento.url,

                        meta: [
                            dataEvento,
                            "AAACCU",
                            evento.url
                                ? "Escaneie o QR Code"
                                : null,
                        ].filter(
                            (
                                value,
                            ): value is string =>
                                Boolean(
                                    value,
                                ),
                        ),

                        cor_destaque:
                            EVENTO_COR,

                        parceiro:
                            null,
                    };
                },
            );

        const now =
            getSaoPauloNow();

        const promocaoItems =
            promocoes
                .filter(
                    (
                        promocao,
                    ) =>
                        isPromocaoValidaAgora(
                            promocao,
                            now,
                        ),
                )
                .map(
                    (
                        promocao,
                    ) => {
                        const itensAtivos =
                            promocao
                                .crd_promocao_itens
                                .filter(
                                    (
                                        vinculo,
                                    ) =>
                                        Boolean(
                                            vinculo
                                                .crd_item
                                                .ativo,
                                        ) &&
                                        !vinculo
                                            .crd_item
                                            .deleted_at &&
                                        Boolean(
                                            vinculo
                                                .crd_item
                                                .crd_categoria
                                                .ativo,
                                        ) &&
                                        !vinculo
                                            .crd_item
                                            .crd_categoria
                                            .deleted_at,
                                );

                        if (
                            itensAtivos.length ===
                            0
                        ) {
                            return null;
                        }

                        const imagemPromocao =
                            promocao
                                .imagem_sys_arquivo &&
                            !promocao
                                .imagem_sys_arquivo
                                .deleted_at
                                ? promocao
                                    .imagem_sys_arquivo
                                : null;

                        const itemImagem =
                            itensAtivos
                                .map(
                                    (
                                        vinculo,
                                    ) =>
                                        vinculo
                                            .crd_item
                                            .imagem_sys_arquivo,
                                )
                                .find(
                                    (
                                        arquivo,
                                    ) =>
                                        arquivo &&
                                        !arquivo
                                            .deleted_at &&
                                        arquivo
                                            .public_url,
                                ) ??
                            null;

                        const media =
                            imagemPromocao ??
                            itemImagem;

                        const tema =
                            promocao
                                .par_parceiro
                                .par_parceiro_tema;

                        const temaAtivo =
                            tema &&
                            tema.ativo
                                ? tema
                                : null;

                        const logo =
                            temaAtivo
                                ?.logo_sys_arquivo;

                        const horarioAtual =
                            getHorarioAtualResumo(
                                promocao
                                    .crd_promocao_horarios,
                                now,
                            );

                        const nomesItens =
                            itensAtivos
                                .slice(
                                    0,
                                    3,
                                )
                                .map(
                                    (
                                        vinculo,
                                    ) =>
                                        vinculo
                                            .crd_item
                                            .nome,
                                );

                        const restante =
                            itensAtivos.length -
                            nomesItens.length;

                        const itensResumo =
                            restante >
                            0
                                ? `${nomesItens.join(
                                    ", ",
                                )} +${restante}`
                                : nomesItens.join(
                                    ", ",
                                );

                        return {
                            id:
                                `promocao:${promocao.id}`,

                            origem:
                                "promocao" as const,

                            origem_id:
                                promocao.id,

                            titulo:
                                promocao.titulo,

                            descricao:
                                promocao.descricao,

                            kicker:
                                "Promoção do cardápio",

                            preco_label:
                                promocao
                                    .preco_promocional ===
                                    null
                                    ? null
                                    : formatMoney(
                                        Number(
                                            promocao
                                                .preco_promocional,
                                        ),
                                    ),

                            media_url:
                                media
                                    ?.public_url ??
                                null,

                            media_tipo:
                                getMediaTipo(
                                    media
                                        ?.mime_type ??
                                    null,
                                ),

                            link:
                                `/cardapio/${promocao.par_parceiro.slug}`,

                            meta: [
                                promocao
                                    .par_parceiro
                                    .nome,
                                horarioAtual,
                                itensResumo ||
                                    null,
                            ].filter(
                                (
                                    value,
                                ): value is string =>
                                    Boolean(
                                        value,
                                    ),
                            ),

                            cor_destaque:
                                temaAtivo
                                    ?.cor_primaria ??
                                "#9CD91A",

                            parceiro: {
                                id:
                                    promocao
                                        .par_parceiro
                                        .id,

                                slug:
                                    promocao
                                        .par_parceiro
                                        .slug,

                                nome:
                                    promocao
                                        .par_parceiro
                                        .nome,

                                logo_url:
                                    logo &&
                                    !logo.deleted_at
                                        ? logo
                                            .public_url
                                        : null,
                            },
                        } satisfies TvPlaylistItem;
                    },
                )
                .filter(
                    (
                        item,
                    ): item is NonNullable<typeof item> =>
                        item !==
                        null,
                );

        let itens:
            TvPlaylistItem[];

        if (
            slug ===
            "aaaccu"
        ) {
            itens =
                eventoItems;
        } else if (
            parceiroFiltro
        ) {
            itens =
                promocaoItems;
        } else {
            const promocoesPorParceiro =
                new Map<
                    number,
                    TvPlaylistItem[]
                >();

            for (
                const item
                of promocaoItems
            ) {
                const parceiroId =
                    item
                        .parceiro
                        ?.id;

                if (
                    !parceiroId
                ) {
                    continue;
                }

                const group =
                    promocoesPorParceiro
                        .get(
                            parceiroId,
                        ) ??
                    [];

                group.push(
                    item,
                );

                promocoesPorParceiro
                    .set(
                        parceiroId,
                        group,
                    );
            }

            const partnerGroups =
                [
                    ...promocoesPorParceiro
                        .values(),
                ];

            itens =
                interleaveGroups([
                    eventoItems,
                    ...partnerGroups,
                ]);
        }

        return {
            contexto:
                parceiroFiltro
                    ? {
                        tipo:
                            "parceiro",

                        slug:
                            parceiroFiltro.slug,

                        titulo:
                            parceiroFiltro.nome,

                        subtitulo:
                            "Promoções do parceiro",
                    }
                    : isAaaccu
                        ? {
                            tipo:
                                "aaaccu",

                            slug:
                                "aaaccu",

                            titulo:
                                "AAACCU",

                            subtitulo:
                                "Eventos universitários",
                        }
                        : {
                            tipo:
                                "geral",

                            slug:
                                null,

                            titulo:
                                "Brava Pass",

                            subtitulo:
                                "Eventos e promoções",
                        },

            itens,

            generated_at:
                new Date()
                    .toISOString(),
        };
    }
}


export const tvPlaylistService =
    new TvPlaylistService();
