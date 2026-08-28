import {
    prisma,
} from "@/lib/prisma";

import {
    arquivoService,
} from "@/lib/storage/arquivo-service";


export type TvOrigem =
    | "evento"
    | "promocao"
    | "divulgacao";


export type TvPlaylistItem = {
    id: string;
    origem: TvOrigem;
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

    duracao_segundos:
        number |
        null;

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


export type TvProgramacaoStatus =
    | "exibindo"
    | "programado"
    | "fora_horario"
    | "inativo"
    | "encerrado";


export type TvProgramacaoHorario = {
    id: number;
    dia_semana: number;
    hora_inicio: string;
    hora_fim: string;
};


export type TvProgramacaoItem = {
    id: number;
    tipo: TvOrigem;

    parceiro_id: number | null;

    parceiro: {
        id: number;
        slug: string;
        nome: string;
    } | null;

    fonte_id: number | null;
    fonte_titulo: string | null;

    titulo: string;
    titulo_override: string | null;

    descricao: string | null;
    descricao_override: string | null;

    link: string | null;
    link_override: string | null;

    kicker: string | null;
    cor_destaque: string | null;

    media_url: string | null;
    media_tipo: "imagem" | "video";

    midia_propria: {
        sys_arquivo_id: number;
        public_url: string | null;
        original_name: string;
    } | null;

    duracao_segundos: number | null;

    ordem: number;
    ativo: number;

    inicio_exibicao: string | null;
    fim_exibicao: string | null;

    horarios: TvProgramacaoHorario[];

    status: TvProgramacaoStatus;
};


export type TvDisponivelItem = {
    tipo: "evento" | "promocao";
    id: number;

    parceiro_id: number | null;
    parceiro_nome: string | null;

    titulo: string;
    descricao: string | null;

    ativo: number;
};


export type TvCanal = {
    key: string;

    tipo: "geral" | "aaaccu" | "parceiro";

    parceiro_id: number | null;

    label: string;
    slug: string | null;

    tv_url: string;
};


export type TvProgramacaoData = {
    canais: TvCanal[];
    itens: TvProgramacaoItem[];
    disponiveis: TvDisponivelItem[];
};


export type TvHorarioInput = {
    diaSemana: number;
    horaInicio: string;
    horaFim: string;
};


type UpdateInput = {
    id: number;

    scopeParceiroId?: number;

    titulo?: string | null;
    descricao?: string | null;
    link?: string | null;
    kicker?: string | null;

    corDestaque?: string | null;

    duracaoSegundos?: number | null;

    ordem?: number;
    ativo?: boolean;

    inicioExibicao?: Date | null;
    fimExibicao?: Date | null;

    horarios?: TvHorarioInput[];
};


type CreateDivulgacaoInput = {
    parceiroId: number | null;

    titulo: string;
    descricao?: string | null;
    link?: string | null;
    kicker?: string | null;

    corDestaque?: string | null;

    duracaoSegundos?: number | null;

    ordem: number;
    ativo: boolean;

    inicioExibicao?: Date | null;
    fimExibicao?: Date | null;

    horarios: TvHorarioInput[];
};


const DEFAULT_ACCENT =
    "#9CD91A";


function optionalText(
    value?: string | null,
) {
    const normalized =
        value?.trim();

    return normalized || null;
}


function externalUrl(
    value?: string | null,
) {
    const normalized =
        optionalText(value);

    if (!normalized) {
        return null;
    }

    let parsed: URL;

    try {
        parsed = new URL(normalized);
    } catch {
        throw new Error(
            "Informe uma URL válida.",
        );
    }

    if (
        parsed.protocol !== "http:" &&
        parsed.protocol !== "https:"
    ) {
        throw new Error(
            "A URL precisa começar com http:// ou https://.",
        );
    }

    return parsed.toString();
}


function writeColor(
    value?: string | null,
) {
    const normalized =
        optionalText(value);

    if (!normalized) {
        return null;
    }

    if (
        !/^#[0-9A-Fa-f]{6}$/.test(
            normalized,
        )
    ) {
        throw new Error(
            "Informe a cor no formato #RRGGBB.",
        );
    }

    return normalized.toUpperCase();
}


function readColor(
    value?: string | null,
) {
    if (
        value &&
        /^#[0-9A-Fa-f]{6}$/.test(
            value,
        )
    ) {
        return value;
    }

    return null;
}


function validOrder(
    value: number,
) {
    if (
        !Number.isInteger(value) ||
        value < 0
    ) {
        throw new Error(
            "Informe uma ordem válida.",
        );
    }

    return value;
}


function validDuration(
    value:
        number |
        null |
        undefined,
) {
    if (
        value === null ||
        value === undefined
    ) {
        return null;
    }

    if (
        !Number.isInteger(value) ||
        value <= 0
    ) {
        throw new Error(
            "A duração deve ser um número inteiro maior que zero.",
        );
    }

    return value;
}


function validatePeriod(
    start?: Date | null,
    end?: Date | null,
) {
    if (
        start &&
        end &&
        end < start
    ) {
        throw new Error(
            "O fim da exibição não pode ser anterior ao início.",
        );
    }
}


function parseTime(
    value: string,
) {
    if (
        !/^\d{2}:\d{2}$/.test(
            value,
        )
    ) {
        throw new Error(
            "Informe os horários no formato HH:mm.",
        );
    }

    const [
        hour,
        minute,
    ] =
        value
            .split(":")
            .map(Number);

    if (
        !Number.isInteger(hour) ||
        hour < 0 ||
        hour > 23 ||
        !Number.isInteger(minute) ||
        minute < 0 ||
        minute > 59
    ) {
        throw new Error(
            "Informe um horário válido.",
        );
    }

    return new Date(
        Date.UTC(
            1970,
            0,
            1,
            hour,
            minute,
            0,
            0,
        ),
    );
}


function serializeTime(
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


function validateHorarios(
    horarios: TvHorarioInput[],
) {
    const unique =
        new Set<string>();

    for (
        const horario
        of horarios
    ) {
        if (
            !Number.isInteger(
                horario.diaSemana,
            ) ||
            horario.diaSemana < 0 ||
            horario.diaSemana > 6
        ) {
            throw new Error(
                "Existe um dia da semana inválido.",
            );
        }

        const inicio =
            parseTime(
                horario.horaInicio,
            );

        const fim =
            parseTime(
                horario.horaFim,
            );

        if (
            inicio.getTime() ===
            fim.getTime()
        ) {
            throw new Error(
                "O horário inicial e final não podem ser iguais.",
            );
        }

        const key =
            `${horario.diaSemana}:${horario.horaInicio}:${horario.horaFim}`;

        if (
            unique.has(key)
        ) {
            throw new Error(
                "Existe um horário repetido na programação.",
            );
        }

        unique.add(key);
    }
}


function saoPauloNow() {
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

    const weekdays:
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
            weekdays[
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
        value.getUTCFullYear(),

        String(
            value.getUTCMonth() +
            1,
        ).padStart(
            2,
            "0",
        ),

        String(
            value.getUTCDate(),
        ).padStart(
            2,
            "0",
        ),
    ].join("-");
}


function timeMinutes(
    value: Date,
) {
    return (
        value.getUTCHours() *
        60
    ) +
        value.getUTCMinutes();
}


function horarioAtivo(
    horario: {
        dia_semana: number;
        hora_inicio: Date;
        hora_fim: Date;
    },
    now:
        ReturnType<
            typeof saoPauloNow
        >,
) {
    const inicio =
        timeMinutes(
            horario.hora_inicio,
        );

    const fim =
        timeMinutes(
            horario.hora_fim,
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

    const nextDay =
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
            nextDay &&
            now.minuteOfDay <
            fim
        )
    );
}


function promoSourceActive(
    promocao: any,
    now:
        ReturnType<
            typeof saoPauloNow
        >,
) {
    if (
        !promocao ||
        promocao.deleted_at ||
        !promocao.ativo
    ) {
        return false;
    }

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

    const horarios =
        promocao
            .crd_promocao_horarios ??
        [];

    if (
        horarios.length ===
        0
    ) {
        return true;
    }

    return horarios.some(
        (
            horario:
                any,
        ) =>
            horarioAtivo(
                horario,
                now,
            ),
    );
}


function eventSourceActive(
    evento: any,
    now: Date,
) {
    if (
        !evento ||
        evento.deleted_at ||
        !evento.ativo ||
        !evento.visivel_publico
    ) {
        return false;
    }

    if (
        evento.inicio_exibicao &&
        evento.inicio_exibicao >
        now
    ) {
        return false;
    }

    if (
        evento.fim_exibicao &&
        evento.fim_exibicao <
        now
    ) {
        return false;
    }

    return true;
}


function mediaType(
    mime?: string | null,
): "imagem" | "video" {
    return mime
        ?.startsWith(
            "video/",
        )
        ? "video"
        : "imagem";
}


function money(
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
    ).format(value);
}


function eventDate(
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
    ).format(value);
}


const promocaoItemOrderBy = [
    {
        ordem:
            "asc" as const,
    },
    {
        id:
            "asc" as const,
    },
];


const tvExibicaoHorarioOrderBy = [
    {
        dia_semana:
            "asc" as const,
    },
    {
        hora_inicio:
            "asc" as const,
    },
    {
        id:
            "asc" as const,
    },
];


const exibicaoSelect =
    {
        id:
            true,

        par_parceiro_id:
            true,

        cad_evento_id:
            true,

        crd_promocao_id:
            true,

        titulo:
            true,

        descricao:
            true,

        link:
            true,

        kicker:
            true,

        cor_destaque:
            true,

        duracao_segundos:
            true,

        ordem:
            true,

        ativo:
            true,

        inicio_exibicao:
            true,

        fim_exibicao:
            true,

        deleted_at:
            true,

        tv_exibicao_tipo: {
            select: {
                codigo:
                    true,
            },
        },

        par_parceiro: {
            select: {
                id:
                    true,

                slug:
                    true,

                nome:
                    true,

                ativo:
                    true,

                visivel_publico:
                    true,

                deleted_at:
                    true,

                par_parceiro_tema: {
                    select: {
                        ativo:
                            true,

                        cor_primaria:
                            true,

                        logo_sys_arquivo: {
                            select: {
                                public_url:
                                    true,

                                deleted_at:
                                    true,
                            },
                        },
                    },
                },
            },
        },

        midia_sys_arquivo: {
            select: {
                id:
                    true,

                public_url:
                    true,

                original_name:
                    true,

                mime_type:
                    true,

                deleted_at:
                    true,
            },
        },

        cad_evento: {
            select: {
                id:
                    true,

                titulo:
                    true,

                descricao:
                    true,

                url:
                    true,

                evento_at:
                    true,

                inicio_exibicao:
                    true,

                fim_exibicao:
                    true,

                ativo:
                    true,

                visivel_publico:
                    true,

                deleted_at:
                    true,

                banner_sys_arquivo: {
                    select: {
                        public_url:
                            true,

                        mime_type:
                            true,

                        deleted_at:
                            true,
                    },
                },
            },
        },

        crd_promocao: {
            select: {
                id:
                    true,

                titulo:
                    true,

                descricao:
                    true,

                preco_promocional:
                    true,

                validade_inicio:
                    true,

                validade_fim:
                    true,

                ativo:
                    true,

                deleted_at:
                    true,

                imagem_sys_arquivo: {
                    select: {
                        public_url:
                            true,

                        mime_type:
                            true,

                        deleted_at:
                            true,
                    },
                },

                crd_promocao_horarios: {
                    select: {
                        dia_semana:
                            true,

                        hora_inicio:
                            true,

                        hora_fim:
                            true,
                    },
                },

                crd_promocao_itens: {
                    select: {
                        ordem:
                            true,

                        crd_item: {
                            select: {
                                ativo:
                                    true,

                                deleted_at:
                                    true,

                                crd_categoria: {
                                    select: {
                                        ativo:
                                            true,

                                        deleted_at:
                                            true,
                                    },
                                },

                                imagem_sys_arquivo: {
                                    select: {
                                        public_url:
                                            true,

                                        mime_type:
                                            true,

                                        deleted_at:
                                            true,
                                    },
                                },
                            },
                        },
                    },

                    orderBy:
                        promocaoItemOrderBy,
                },
            },
        },

        tv_exibicao_horarios: {
            select: {
                id:
                    true,

                dia_semana:
                    true,

                hora_inicio:
                    true,

                hora_fim:
                    true,
            },

            orderBy:
                tvExibicaoHorarioOrderBy,
        },
    } as const;


function source(
    exibicao: any,
) {
    const type =
        exibicao
            .tv_exibicao_tipo
            .codigo as TvOrigem;

    if (
        type ===
        "evento"
    ) {
        return exibicao
            .cad_evento;
    }

    if (
        type ===
        "promocao"
    ) {
        return exibicao
            .crd_promocao;
    }

    return null;
}


function title(
    exibicao: any,
) {
    return optionalText(
        exibicao.titulo,
    ) ??
        source(
            exibicao,
        )
            ?.titulo ??
        "Divulgação";
}


function description(
    exibicao: any,
) {
    return optionalText(
        exibicao.descricao,
    ) ??
        source(
            exibicao,
        )
            ?.descricao ??
        null;
}


function link(
    exibicao: any,
) {
    const explicit =
        optionalText(
            exibicao.link,
        );

    if (explicit) {
        return explicit;
    }

    if (
        exibicao
            .cad_evento
            ?.url
    ) {
        return exibicao
            .cad_evento
            .url;
    }

    if (
        exibicao
            .crd_promocao &&
        exibicao
            .par_parceiro
            ?.slug
    ) {
        return `/cardapio/${exibicao.par_parceiro.slug}`;
    }

    return null;
}


function media(
    exibicao: any,
) {
    const own =
        exibicao
            .midia_sys_arquivo;

    if (
        own &&
        !own.deleted_at &&
        own.public_url
    ) {
        return {
            url:
                own.public_url,

            tipo:
                mediaType(
                    own.mime_type,
                ),
        };
    }

    const eventMedia =
        exibicao
            .cad_evento
            ?.banner_sys_arquivo;

    if (
        eventMedia &&
        !eventMedia.deleted_at &&
        eventMedia.public_url
    ) {
        return {
            url:
                eventMedia.public_url,

            tipo:
                mediaType(
                    eventMedia.mime_type,
                ),
        };
    }

    const promo =
        exibicao
            .crd_promocao;

    const promoMedia =
        promo
            ?.imagem_sys_arquivo;

    if (
        promoMedia &&
        !promoMedia.deleted_at &&
        promoMedia.public_url
    ) {
        return {
            url:
                promoMedia.public_url,

            tipo:
                mediaType(
                    promoMedia.mime_type,
                ),
        };
    }

    for (
        const vinculo
        of promo
            ?.crd_promocao_itens ??
        []
    ) {
        const item =
            vinculo.crd_item;

        if (
            !item ||
            !item.ativo ||
            item.deleted_at ||
            !item
                .crd_categoria
                ?.ativo ||
            item
                .crd_categoria
                ?.deleted_at
        ) {
            continue;
        }

        const itemMedia =
            item
                .imagem_sys_arquivo;

        if (
            itemMedia &&
            !itemMedia.deleted_at &&
            itemMedia.public_url
        ) {
            return {
                url:
                    itemMedia.public_url,

                tipo:
                    mediaType(
                        itemMedia.mime_type,
                    ),
            };
        }
    }

    return {
        url:
            null,

        tipo:
            "imagem" as const,
    };
}


function ownWindowActive(
    exibicao: any,
    now: Date,
) {
    return !(
        (
            exibicao
                .inicio_exibicao &&
            exibicao
                .inicio_exibicao >
            now
        ) ||
        (
            exibicao
                .fim_exibicao &&
            exibicao
                .fim_exibicao <
            now
        )
    );
}


function ownScheduleActive(
    exibicao: any,
    now:
        ReturnType<
            typeof saoPauloNow
        >,
) {
    const horarios =
        exibicao
            .tv_exibicao_horarios ??
        [];

    if (
        horarios.length ===
        0
    ) {
        return true;
    }

    return horarios.some(
        (
            horario:
                any,
        ) =>
            horarioAtivo(
                horario,
                now,
            ),
    );
}


function sourceActive(
    exibicao: any,
    nowDate: Date,
    now:
        ReturnType<
            typeof saoPauloNow
        >,
) {
    const type =
        exibicao
            .tv_exibicao_tipo
            .codigo as TvOrigem;

    if (
        type ===
        "evento"
    ) {
        return eventSourceActive(
            exibicao
                .cad_evento,
            nowDate,
        );
    }

    if (
        type ===
        "promocao"
    ) {
        return promoSourceActive(
            exibicao
                .crd_promocao,
            now,
        );
    }

    return true;
}


function status(
    exibicao: any,
): TvProgramacaoStatus {
    if (
        !exibicao.ativo
    ) {
        return "inativo";
    }

    const nowDate =
        new Date();

    if (
        exibicao.inicio_exibicao &&
        exibicao.inicio_exibicao >
        nowDate
    ) {
        return "programado";
    }

    if (
        exibicao.fim_exibicao &&
        exibicao.fim_exibicao <
        nowDate
    ) {
        return "encerrado";
    }

    const now =
        saoPauloNow();

    if (
        !ownScheduleActive(
            exibicao,
            now,
        ) ||
        !sourceActive(
            exibicao,
            nowDate,
            now,
        )
    ) {
        return "fora_horario";
    }

    return "exibindo";
}


function serialize(
    exibicao: any,
): TvProgramacaoItem {
    const type =
        exibicao
            .tv_exibicao_tipo
            .codigo as TvOrigem;

    const sourceData =
        source(
            exibicao,
        );

    const mediaData =
        media(
            exibicao,
        );

    return {
        id:
            exibicao.id,

        tipo:
            type,

        parceiro_id:
            exibicao
                .par_parceiro_id,

        parceiro:
            exibicao
                .par_parceiro
                ? {
                    id:
                        exibicao
                            .par_parceiro
                            .id,

                    slug:
                        exibicao
                            .par_parceiro
                            .slug,

                    nome:
                        exibicao
                            .par_parceiro
                            .nome,
                }
                : null,

        fonte_id:
            type ===
            "evento"
                ? exibicao
                    .cad_evento_id
                : type ===
                "promocao"
                    ? exibicao
                        .crd_promocao_id
                    : null,

        fonte_titulo:
            sourceData
                ?.titulo ??
            null,

        titulo:
            title(
                exibicao,
            ),

        titulo_override:
            exibicao.titulo,

        descricao:
            description(
                exibicao,
            ),

        descricao_override:
            exibicao.descricao,

        link:
            link(
                exibicao,
            ),

        link_override:
            exibicao.link,

        kicker:
            exibicao.kicker,

        cor_destaque:
            exibicao
                .cor_destaque,

        media_url:
            mediaData.url,

        media_tipo:
            mediaData.tipo,

        midia_propria:
            exibicao
                .midia_sys_arquivo &&
            !exibicao
                .midia_sys_arquivo
                .deleted_at
                ? {
                    sys_arquivo_id:
                        exibicao
                            .midia_sys_arquivo
                            .id,

                    public_url:
                        exibicao
                            .midia_sys_arquivo
                            .public_url,

                    original_name:
                        exibicao
                            .midia_sys_arquivo
                            .original_name,
                }
                : null,

        duracao_segundos:
            exibicao
                .duracao_segundos,

        ordem:
            exibicao.ordem,

        ativo:
            exibicao.ativo,

        inicio_exibicao:
            exibicao
                .inicio_exibicao
                ?.toISOString() ??
            null,

        fim_exibicao:
            exibicao
                .fim_exibicao
                ?.toISOString() ??
            null,

        horarios:
            exibicao
                .tv_exibicao_horarios
                .map(
                    (
                        horario:
                            any,
                    ) => ({
                        id:
                            horario.id,

                        dia_semana:
                            horario
                                .dia_semana,

                        hora_inicio:
                            serializeTime(
                                horario
                                    .hora_inicio,
                            ),

                        hora_fim:
                            serializeTime(
                                horario
                                    .hora_fim,
                            ),
                    }),
                ),

        status:
            status(
                exibicao,
            ),
    };
}


function playlistItem(
    exibicao: any,
): TvPlaylistItem {
    const type =
        exibicao
            .tv_exibicao_tipo
            .codigo as TvOrigem;

    const mediaData =
        media(
            exibicao,
        );

    const partner =
        exibicao
            .par_parceiro;

    const theme =
        partner
            ?.par_parceiro_tema;

    const logo =
        theme
            ?.logo_sys_arquivo;

    const itemLink =
        link(
            exibicao,
        );

    let kicker =
        optionalText(
            exibicao.kicker,
        );

    let price:
        string |
        null =
        null;

    const meta:
        Array<
            string |
            null
        > =
        [];

    if (
        type ===
        "evento"
    ) {
        kicker =
            kicker ??
            (
                partner
                    ? "Evento do parceiro"
                    : "Evento AAACCU"
            );

        meta.push(
            eventDate(
                exibicao
                    .cad_evento
                    ?.evento_at ??
                null,
            ),

            partner
                ?.nome ??
            "AAACCU",
        );
    } else if (
        type ===
        "promocao"
    ) {
        kicker =
            kicker ??
            "Promoção";

        const promoPrice =
            exibicao
                .crd_promocao
                ?.preco_promocional;

        price =
            promoPrice ===
            null ||
            promoPrice ===
            undefined
                ? null
                : money(
                    Number(
                        promoPrice,
                    ),
                );

        meta.push(
            partner
                ?.nome ??
            null,
        );
    } else {
        kicker =
            kicker ??
            "Divulgação";

        meta.push(
            partner
                ?.nome ??
            "AAACCU",
        );
    }

    if (
        itemLink
    ) {
        meta.push(
            "Escaneie o QR Code",
        );
    }

    return {
        id:
            `tv:${exibicao.id}`,

        origem:
            type,

        origem_id:
            type ===
            "evento"
                ? exibicao
                    .cad_evento_id
                : type ===
                "promocao"
                    ? exibicao
                        .crd_promocao_id
                    : exibicao.id,

        titulo:
            title(
                exibicao,
            ),

        descricao:
            description(
                exibicao,
            ),

        kicker:
            kicker,

        preco_label:
            price,

        media_url:
            mediaData.url,

        media_tipo:
            mediaData.tipo,

        link:
            itemLink,

        meta:
            meta.filter(
                (
                    value,
                ): value is string =>
                    Boolean(value),
            ),

        cor_destaque:
            readColor(
                exibicao
                    .cor_destaque,
            ) ??
            (
                theme
                    ?.ativo
                    ? readColor(
                        theme
                            .cor_primaria,
                    )
                    : null
            ) ??
            DEFAULT_ACCENT,

        duracao_segundos:
            exibicao
                .duracao_segundos,

        parceiro:
            partner
                ? {
                    id:
                        partner.id,

                    slug:
                        partner.slug,

                    nome:
                        partner.nome,

                    logo_url:
                        logo &&
                        !logo.deleted_at
                            ? logo
                                .public_url
                            : null,
                }
                : null,
    };
}


function interleave(
    groups:
        TvPlaylistItem[][],
) {
    const queues =
        groups
            .map(
                (
                    group,
                ) => [
                    ...group,
                ],
            )
            .filter(
                (
                    group,
                ) =>
                    group.length >
                    0,
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
                result.push(item);
            }
        }
    }

    return result;
}


class TvProgramacaoService {
    private async tipoId(
        codigo: TvOrigem,
    ) {
        const tipo =
            await prisma
                .tvExibicaoTipo
                .findUnique({
                    where: {
                        codigo,
                    },

                    select: {
                        id:
                            true,
                    },
                });

        if (
            !tipo
        ) {
            throw new Error(
                `Tipo de exibição não encontrado: ${codigo}`,
            );
        }

        return tipo.id;
    }


    private async ensure(
        id: number,
        scopeParceiroId?:
            number,
    ) {
        const exibicao =
            await prisma
                .tvExibicao
                .findFirst({
                    where: {
                        id,

                        deleted_at:
                            null,

                        ...(
                            scopeParceiroId !==
                            undefined
                                ? {
                                    par_parceiro_id:
                                        scopeParceiroId,
                                }
                                : {}
                        ),
                    },

                    select: {
                        id:
                            true,

                        par_parceiro_id:
                            true,

                        crd_promocao_id:
                            true,

                        midia_sys_arquivo_id:
                            true,

                        tv_exibicao_tipo: {
                            select: {
                                codigo:
                                    true,
                            },
                        },
                    },
                });

        if (
            !exibicao
        ) {
            throw new Error(
                "Exibição não encontrada.",
            );
        }

        return exibicao;
    }


    private async find(
        id: number,
    ) {
        const exibicao =
            await prisma
                .tvExibicao
                .findFirst({
                    where: {
                        id,

                        deleted_at:
                            null,
                    },

                    select:
                        exibicaoSelect,
                });

        return exibicao
            ? serialize(
                exibicao,
            )
            : null;
    }


    private async replaceSchedules(
        tx: any,
        id: number,
        horarios:
            TvHorarioInput[],
    ) {
        validateHorarios(
            horarios,
        );

        await tx
            .tvExibicaoHorario
            .deleteMany({
                where: {
                    tv_exibicao_id:
                        id,
                },
            });

        if (
            horarios.length ===
            0
        ) {
            return;
        }

        await tx
            .tvExibicaoHorario
            .createMany({
                data:
                    horarios.map(
                        (
                            horario,
                        ) => ({
                            tv_exibicao_id:
                                id,

                            dia_semana:
                                horario
                                    .diaSemana,

                            hora_inicio:
                                parseTime(
                                    horario
                                        .horaInicio,
                                ),

                            hora_fim:
                                parseTime(
                                    horario
                                        .horaFim,
                                ),

                            created_at:
                                new Date(),

                            updated_at:
                                new Date(),
                        }),
                    ),
            });
    }


    private listItems(
        parceiroId?:
            number |
            null,
    ) {
        return prisma
            .tvExibicao
            .findMany({
                where: {
                    deleted_at:
                        null,

                    ...(
                        parceiroId !==
                        undefined
                            ? {
                                par_parceiro_id:
                                    parceiroId,
                            }
                            : {}
                    ),
                },

                select:
                    exibicaoSelect,

                orderBy: [
                    {
                        ativo:
                            "desc",
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
            });
    }


    private async available(
        parceiroId?:
            number,
    ): Promise<
        TvDisponivelItem[]
    > {
        const links =
            await prisma
                .tvExibicao
                .findMany({
                    where: {
                        deleted_at:
                            null,

                        ...(
                            parceiroId !==
                            undefined
                                ? {
                                    par_parceiro_id:
                                        parceiroId,
                                }
                                : {}
                        ),
                    },

                    select: {
                        cad_evento_id:
                            true,

                        crd_promocao_id:
                            true,
                    },
                });

        const eventIds =
            new Set(
                links
                    .map(
                        (
                            item,
                        ) =>
                            item
                                .cad_evento_id,
                    )
                    .filter(
                        (
                            id,
                        ): id is number =>
                            id !==
                            null,
                    ),
            );

        const promoIds =
            new Set(
                links
                    .map(
                        (
                            item,
                        ) =>
                            item
                                .crd_promocao_id,
                    )
                    .filter(
                        (
                            id,
                        ): id is number =>
                            id !==
                            null,
                    ),
            );

        const [
            eventos,
            promocoes,
        ] =
            await Promise.all([
                prisma
                    .cadEvento
                    .findMany({
                        where: {
                            deleted_at:
                                null,

                            ...(
                                parceiroId !==
                                undefined
                                    ? {
                                        par_parceiro_id:
                                            parceiroId,
                                    }
                                    : {}
                            ),
                        },

                        select: {
                            id:
                                true,

                            par_parceiro_id:
                                true,

                            titulo:
                                true,

                            descricao:
                                true,

                            ativo:
                                true,

                            par_parceiro: {
                                select: {
                                    nome:
                                        true,
                                },
                            },
                        },

                        orderBy: [
                            {
                                ativo:
                                    "desc",
                            },
                            {
                                evento_at:
                                    "desc",
                            },
                            {
                                id:
                                    "desc",
                            },
                        ],
                    }),

                prisma
                    .crdPromocao
                    .findMany({
                        where: {
                            deleted_at:
                                null,

                            ...(
                                parceiroId !==
                                undefined
                                    ? {
                                        par_parceiro_id:
                                            parceiroId,
                                    }
                                    : {}
                            ),
                        },

                        select: {
                            id:
                                true,

                            par_parceiro_id:
                                true,

                            titulo:
                                true,

                            descricao:
                                true,

                            ativo:
                                true,

                            par_parceiro: {
                                select: {
                                    nome:
                                        true,
                                },
                            },
                        },

                        orderBy: [
                            {
                                ativo:
                                    "desc",
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
                    }),
            ]);

        return [
            ...eventos
                .filter(
                    (
                        item,
                    ) =>
                        !eventIds.has(
                            item.id,
                        ),
                )
                .map(
                    (
                        item,
                    ): TvDisponivelItem => ({
                        tipo:
                            "evento",

                        id:
                            item.id,

                        parceiro_id:
                            item
                                .par_parceiro_id,

                        parceiro_nome:
                            item
                                .par_parceiro
                                ?.nome ??
                            null,

                        titulo:
                            item.titulo,

                        descricao:
                            item.descricao,

                        ativo:
                            item.ativo,
                    }),
                ),

            ...promocoes
                .filter(
                    (
                        item,
                    ) =>
                        !promoIds.has(
                            item.id,
                        ),
                )
                .map(
                    (
                        item,
                    ): TvDisponivelItem => ({
                        tipo:
                            "promocao",

                        id:
                            item.id,

                        parceiro_id:
                            item
                                .par_parceiro_id,

                        parceiro_nome:
                            item
                                .par_parceiro
                                .nome,

                        titulo:
                            item.titulo,

                        descricao:
                            item.descricao,

                        ativo:
                            item.ativo,
                    }),
                ),
        ];
    }


    async listAdminData():
        Promise<
            TvProgramacaoData
        > {
        const [
            parceiros,
            items,
            disponiveis,
        ] =
            await Promise.all([
                prisma
                    .parParceiro
                    .findMany({
                        where: {
                            ativo:
                                1,

                            deleted_at:
                                null,
                        },

                        select: {
                            id:
                                true,

                            slug:
                                true,

                            nome:
                                true,
                        },

                        orderBy: {
                            nome:
                                "asc",
                        },
                    }),

                this
                    .listItems(),

                this
                    .available(),
            ]);

        return {
            canais: [
                {
                    key:
                        "all",

                    tipo:
                        "geral",

                    parceiro_id:
                        null,

                    label:
                        "TV Geral",

                    slug:
                        null,

                    tv_url:
                        "/tv",
                },

                {
                    key:
                        "aaaccu",

                    tipo:
                        "aaaccu",

                    parceiro_id:
                        null,

                    label:
                        "AAACCU",

                    slug:
                        "aaaccu",

                    tv_url:
                        "/tv/aaaccu",
                },

                ...parceiros.map(
                    (
                        parceiro,
                    ): TvCanal => ({
                        key:
                            `parceiro:${parceiro.id}`,

                        tipo:
                            "parceiro",

                        parceiro_id:
                            parceiro.id,

                        label:
                            parceiro.nome,

                        slug:
                            parceiro.slug,

                        tv_url:
                            `/tv/${parceiro.slug}`,
                    }),
                ),
            ],

            itens:
                items.map(
                    serialize,
                ),

            disponiveis,
        };
    }


    async listParceiroData(
        parceiroId: number,
    ): Promise<
        TvProgramacaoData
    > {
        const parceiro =
            await prisma
                .parParceiro
                .findFirst({
                    where: {
                        id:
                            parceiroId,

                        ativo:
                            1,

                        deleted_at:
                            null,
                    },

                    select: {
                        id:
                            true,

                        slug:
                            true,

                        nome:
                            true,
                    },
                });

        if (
            !parceiro
        ) {
            throw new Error(
                "Parceiro não encontrado.",
            );
        }

        const [
            items,
            disponiveis,
        ] =
            await Promise.all([
                this
                    .listItems(
                        parceiro.id,
                    ),

                this
                    .available(
                        parceiro.id,
                    ),
            ]);

        return {
            canais: [
                {
                    key:
                        `parceiro:${parceiro.id}`,

                    tipo:
                        "parceiro",

                    parceiro_id:
                        parceiro.id,

                    label:
                        parceiro.nome,

                    slug:
                        parceiro.slug,

                    tv_url:
                        `/tv/${parceiro.slug}`,
                },
            ],

            itens:
                items.map(
                    serialize,
                ),

            disponiveis,
        };
    }


    async addSource(
        input: {
            tipo:
                "evento" |
                "promocao";

            sourceId:
                number;

            scopeParceiroId?:
                number;
        },
    ) {
        if (
            !Number.isInteger(
                input.sourceId,
            ) ||
            input.sourceId <=
            0
        ) {
            throw new Error(
                "Conteúdo inválido.",
            );
        }

        const typeId =
            await this
                .tipoId(
                    input.tipo,
                );

        let partnerId:
            number |
            null;

        let order:
            number;

        let existing:
            {
                id:
                    number;
            } |
            null;

        if (
            input.tipo ===
            "evento"
        ) {
            const evento =
                await prisma
                    .cadEvento
                    .findFirst({
                        where: {
                            id:
                                input
                                    .sourceId,

                            deleted_at:
                                null,
                        },

                        select: {
                            id:
                                true,

                            par_parceiro_id:
                                true,

                            ordem:
                                true,
                        },
                    });

            if (
                !evento
            ) {
                throw new Error(
                    "Evento não encontrado.",
                );
            }

            partnerId =
                evento
                    .par_parceiro_id;

            order =
                evento.ordem;

            existing =
                await prisma
                    .tvExibicao
                    .findUnique({
                        where: {
                            cad_evento_id:
                                evento.id,
                        },

                        select: {
                            id:
                                true,
                        },
                    });
        } else {
            const promocao =
                await prisma
                    .crdPromocao
                    .findFirst({
                        where: {
                            id:
                                input
                                    .sourceId,

                            deleted_at:
                                null,
                        },

                        select: {
                            id:
                                true,

                            par_parceiro_id:
                                true,

                            ordem:
                                true,
                        },
                    });

            if (
                !promocao
            ) {
                throw new Error(
                    "Promoção não encontrada.",
                );
            }

            partnerId =
                promocao
                    .par_parceiro_id;

            order =
                promocao.ordem;

            existing =
                await prisma
                    .tvExibicao
                    .findUnique({
                        where: {
                            crd_promocao_id:
                                promocao.id,
                        },

                        select: {
                            id:
                                true,
                        },
                    });
        }

        if (
            input.scopeParceiroId !==
            undefined &&
            partnerId !==
            input.scopeParceiroId
        ) {
            throw new Error(
                "Este conteúdo não pertence ao parceiro.",
            );
        }

        const now =
            new Date();

        const record =
            existing
                ? await prisma
                    .tvExibicao
                    .update({
                        where: {
                            id:
                                existing.id,
                        },

                        data: {
                            tv_exibicao_tipo_id:
                                typeId,

                            par_parceiro_id:
                                partnerId,

                            ordem:
                                order,

                            ativo:
                                1,

                            deleted_at:
                                null,

                            updated_at:
                                now,
                        },

                        select: {
                            id:
                                true,
                        },
                    })
                : await prisma
                    .tvExibicao
                    .create({
                        data: {
                            tv_exibicao_tipo_id:
                                typeId,

                            par_parceiro_id:
                                partnerId,

                            cad_evento_id:
                                input.tipo ===
                                "evento"
                                    ? input
                                        .sourceId
                                    : null,

                            crd_promocao_id:
                                input.tipo ===
                                "promocao"
                                    ? input
                                        .sourceId
                                    : null,

                            ordem:
                                order,

                            ativo:
                                1,

                            created_at:
                                now,

                            updated_at:
                                now,
                        },

                        select: {
                            id:
                                true,
                        },
                    });

        if (
            input.tipo ===
            "promocao"
        ) {
            await prisma
                .crdPromocao
                .update({
                    where: {
                        id:
                            input.sourceId,
                    },

                    data: {
                        exibir_tv:
                            1,

                        updated_at:
                            now,
                    },
                });
        }

        return this.find(
            record.id,
        );
    }


    async createDivulgacao(
        input:
            CreateDivulgacaoInput,
    ) {
        const titulo =
            input
                .titulo
                .trim();

        if (
            titulo.length < 2 ||
            titulo.length > 150
        ) {
            throw new Error(
                "Informe um título válido para a divulgação.",
            );
        }

        validatePeriod(
            input.inicioExibicao,
            input.fimExibicao,
        );

        validateHorarios(
            input.horarios,
        );

        const typeId =
            await this
                .tipoId(
                    "divulgacao",
                );

        const record =
            await prisma
                .$transaction(
                    async (
                        tx,
                    ) => {
                        const created =
                            await tx
                                .tvExibicao
                                .create({
                                    data: {
                                        tv_exibicao_tipo_id:
                                            typeId,

                                        par_parceiro_id:
                                            input
                                                .parceiroId,

                                        titulo,

                                        descricao:
                                            optionalText(
                                                input
                                                    .descricao,
                                            ),

                                        link:
                                            externalUrl(
                                                input
                                                    .link,
                                            ),

                                        kicker:
                                            optionalText(
                                                input
                                                    .kicker,
                                            ),

                                        cor_destaque:
                                            writeColor(
                                                input
                                                    .corDestaque,
                                            ),

                                        duracao_segundos:
                                            validDuration(
                                                input
                                                    .duracaoSegundos,
                                            ),

                                        ordem:
                                            validOrder(
                                                input
                                                    .ordem,
                                            ),

                                        ativo:
                                            input.ativo
                                                ? 1
                                                : 0,

                                        inicio_exibicao:
                                            input
                                                .inicioExibicao ??
                                            null,

                                        fim_exibicao:
                                            input
                                                .fimExibicao ??
                                            null,

                                        created_at:
                                            new Date(),

                                        updated_at:
                                            new Date(),
                                    },

                                    select: {
                                        id:
                                            true,
                                    },
                                });

                        await this
                            .replaceSchedules(
                                tx,
                                created.id,
                                input
                                    .horarios,
                            );

                        return created;
                    },
                );

        return this.find(
            record.id,
        );
    }


    async update(
        input:
            UpdateInput,
    ) {
        const existing =
            await this
                .ensure(
                    input.id,
                    input
                        .scopeParceiroId,
                );

        validatePeriod(
            input.inicioExibicao,
            input.fimExibicao,
        );

        if (
            input.horarios !==
            undefined
        ) {
            validateHorarios(
                input.horarios,
            );
        }

        if (
            existing
                .tv_exibicao_tipo
                .codigo ===
            "divulgacao" &&
            input.titulo !==
            undefined &&
            (
                !input.titulo ||
                input
                    .titulo
                    .trim()
                    .length <
                2
            )
        ) {
            throw new Error(
                "Informe o título da divulgação.",
            );
        }

        await prisma
            .$transaction(
                async (
                    tx,
                ) => {
                    await tx
                        .tvExibicao
                        .update({
                            where: {
                                id:
                                    input.id,
                            },

                            data: {
                                ...(
                                    input.titulo !==
                                    undefined
                                        ? {
                                            titulo:
                                                optionalText(
                                                    input.titulo,
                                                ),
                                        }
                                        : {}
                                ),

                                ...(
                                    input.descricao !==
                                    undefined
                                        ? {
                                            descricao:
                                                optionalText(
                                                    input
                                                        .descricao,
                                                ),
                                        }
                                        : {}
                                ),

                                ...(
                                    input.link !==
                                    undefined
                                        ? {
                                            link:
                                                externalUrl(
                                                    input.link,
                                                ),
                                        }
                                        : {}
                                ),

                                ...(
                                    input.kicker !==
                                    undefined
                                        ? {
                                            kicker:
                                                optionalText(
                                                    input.kicker,
                                                ),
                                        }
                                        : {}
                                ),

                                ...(
                                    input.corDestaque !==
                                    undefined
                                        ? {
                                            cor_destaque:
                                                writeColor(
                                                    input
                                                        .corDestaque,
                                                ),
                                        }
                                        : {}
                                ),

                                ...(
                                    input.duracaoSegundos !==
                                    undefined
                                        ? {
                                            duracao_segundos:
                                                validDuration(
                                                    input
                                                        .duracaoSegundos,
                                                ),
                                        }
                                        : {}
                                ),

                                ...(
                                    input.ordem !==
                                    undefined
                                        ? {
                                            ordem:
                                                validOrder(
                                                    input.ordem,
                                                ),
                                        }
                                        : {}
                                ),

                                ...(
                                    input.ativo !==
                                    undefined
                                        ? {
                                            ativo:
                                                input.ativo
                                                    ? 1
                                                    : 0,
                                        }
                                        : {}
                                ),

                                ...(
                                    input.inicioExibicao !==
                                    undefined
                                        ? {
                                            inicio_exibicao:
                                                input
                                                    .inicioExibicao,
                                        }
                                        : {}
                                ),

                                ...(
                                    input.fimExibicao !==
                                    undefined
                                        ? {
                                            fim_exibicao:
                                                input
                                                    .fimExibicao,
                                        }
                                        : {}
                                ),

                                updated_at:
                                    new Date(),
                            },
                        });

                    if (
                        input.horarios !==
                        undefined
                    ) {
                        await this
                            .replaceSchedules(
                                tx,
                                input.id,
                                input.horarios,
                            );
                    }

                    if (
                        existing
                            .crd_promocao_id &&
                        input.ativo !==
                        undefined
                    ) {
                        await tx
                            .crdPromocao
                            .update({
                                where: {
                                    id:
                                        existing
                                            .crd_promocao_id,
                                },

                                data: {
                                    exibir_tv:
                                        input.ativo
                                            ? 1
                                            : 0,

                                    updated_at:
                                        new Date(),
                                },
                            });
                    }
                },
            );

        return this.find(
            input.id,
        );
    }


    async setAtivo(
        input: {
            id: number;
            ativo: boolean;
            scopeParceiroId?:
                number;
        },
    ) {
        return this.update({
            id:
                input.id,

            ativo:
                input.ativo,

            scopeParceiroId:
                input
                    .scopeParceiroId,
        });
    }


    async setMidia(
        input: {
            id:
                number;

            file:
                File;

            sysUsuarioId:
                number;

            scopeParceiroId?:
                number;
        },
    ) {
        const existing =
            await this
                .ensure(
                    input.id,
                    input
                        .scopeParceiroId,
                );


        const upload =
            await arquivoService
                .uploadPublicTvMedia({
                    file:
                        input.file,

                    folder:
                        existing
                            .par_parceiro_id
                            ? `parceiros/${existing.par_parceiro_id}/tv/exibicoes/${input.id}`
                            : `tv/aaaccu/exibicoes/${input.id}`,

                    filenamePrefix:
                        `tv-exibicao-${input.id}`,

                    tipoCodigo:
                        "tv_exibicao_midia",

                    createdBySysUsuarioId:
                        input
                            .sysUsuarioId,
                });


        const newFileId =
            upload
                .arquivo
                .id;


        try {
            await prisma
                .tvExibicao
                .update({
                    where: {
                        id:
                            input.id,
                    },

                    data: {
                        midia_sys_arquivo_id:
                            newFileId,

                        updated_at:
                            new Date(),
                    },
                });


            if (
                existing
                    .midia_sys_arquivo_id &&
                existing
                    .midia_sys_arquivo_id !==
                newFileId
            ) {
                try {
                    await arquivoService
                        .marcarComoRemovido({
                            arquivoId:
                                existing
                                    .midia_sys_arquivo_id,
                        });
                } catch (
                    cleanupError
                ) {
                    console.error(
                        "[tv.exibicao.midia.old-file.cleanup]",
                        cleanupError,
                    );
                }
            }


            return this.find(
                input.id,
            );
        } catch (
            error
        ) {
            try {
                await arquivoService
                    .marcarComoRemovido({
                        arquivoId:
                            newFileId,
                    });
            } catch (
                cleanupError
            ) {
                console.error(
                    "[tv.exibicao.midia.new-file.cleanup]",
                    cleanupError,
                );
            }


            throw error;
        }
    }


    async removeMidia(
        input: {
            id:
                number;

            scopeParceiroId?:
                number;
        },
    ) {
        const existing =
            await this
                .ensure(
                    input.id,
                    input
                        .scopeParceiroId,
                );


        if (
            !existing
                .midia_sys_arquivo_id
        ) {
            return this.find(
                input.id,
            );
        }


        await prisma
            .tvExibicao
            .update({
                where: {
                    id:
                        input.id,
                },

                data: {
                    midia_sys_arquivo_id:
                        null,

                    updated_at:
                        new Date(),
                },
            });


        try {
            await arquivoService
                .marcarComoRemovido({
                    arquivoId:
                        existing
                            .midia_sys_arquivo_id,
                });
        } catch (
            cleanupError
        ) {
            console.error(
                "[tv.exibicao.midia.remove.cleanup]",
                cleanupError,
            );
        }


        return this.find(
            input.id,
        );
    }


    async remove(
        input: {
            id: number;
            scopeParceiroId?:
                number;
        },
    ) {
        const existing =
            await this
                .ensure(
                    input.id,
                    input
                        .scopeParceiroId,
                );

        const now =
            new Date();

        await prisma
            .$transaction(
                async (
                    tx,
                ) => {
                    await tx
                        .tvExibicao
                        .update({
                            where: {
                                id:
                                    input.id,
                            },

                            data: {
                                ativo:
                                    0,

                                midia_sys_arquivo_id:
                                    null,

                                deleted_at:
                                    now,

                                updated_at:
                                    now,
                            },
                        });

                    if (
                        existing
                            .crd_promocao_id
                    ) {
                        await tx
                            .crdPromocao
                            .update({
                                where: {
                                    id:
                                        existing
                                            .crd_promocao_id,
                                },

                                data: {
                                    exibir_tv:
                                        0,

                                    updated_at:
                                        now,
                                },
                            });
                    }
                },
            );


        if (
            existing
                .midia_sys_arquivo_id
        ) {
            try {
                await arquivoService
                    .marcarComoRemovido({
                        arquivoId:
                            existing
                                .midia_sys_arquivo_id,
                    });
            } catch (
                cleanupError
            ) {
                console.error(
                    "[tv.exibicao.delete.midia.cleanup]",
                    cleanupError,
                );
            }
        }


        return {
            id:
                input.id,
        };
    }


    async syncEvento(
        input: {
            eventoId: number;
            exibirTv: boolean;
        },
    ) {
        const evento =
            await prisma
                .cadEvento
                .findFirst({
                    where: {
                        id:
                            input
                                .eventoId,

                        deleted_at:
                            null,
                    },

                    select: {
                        id:
                            true,

                        par_parceiro_id:
                            true,

                        ordem:
                            true,
                    },
                });


        if (
            !evento
        ) {
            throw new Error(
                "Evento não encontrado.",
            );
        }


        const typeId =
            await this
                .tipoId(
                    "evento",
                );


        const existing =
            await prisma
                .tvExibicao
                .findUnique({
                    where: {
                        cad_evento_id:
                            evento.id,
                    },

                    select: {
                        id:
                            true,
                    },
                });


        if (
            existing
        ) {
            await prisma
                .tvExibicao
                .update({
                    where: {
                        id:
                            existing.id,
                    },

                    data: {
                        tv_exibicao_tipo_id:
                            typeId,

                        par_parceiro_id:
                            evento
                                .par_parceiro_id,

                        ordem:
                            evento.ordem,

                        ativo:
                            input
                                .exibirTv
                                ? 1
                                : 0,

                        ...(
                            input
                                .exibirTv
                                ? {
                                    deleted_at:
                                        null,
                                }
                                : {}
                        ),

                        updated_at:
                            new Date(),
                    },
                });


            return;
        }


        if (
            !input
                .exibirTv
        ) {
            return;
        }


        await prisma
            .tvExibicao
            .create({
                data: {
                    tv_exibicao_tipo_id:
                        typeId,

                    par_parceiro_id:
                        evento
                            .par_parceiro_id,

                    cad_evento_id:
                        evento.id,

                    ordem:
                        evento.ordem,

                    ativo:
                        1,

                    created_at:
                        new Date(),

                    updated_at:
                        new Date(),
                },
            });
    }


    async removeEventoSource(
        eventoId:
            number,
    ) {
        const exibicao =
            await prisma
                .tvExibicao
                .findFirst({
                    where: {
                        cad_evento_id:
                            eventoId,

                        deleted_at:
                            null,
                    },

                    select: {
                        id:
                            true,
                    },
                });


        if (
            !exibicao
        ) {
            return;
        }


        await prisma
            .tvExibicao
            .update({
                where: {
                    id:
                        exibicao.id,
                },

                data: {
                    ativo:
                        0,

                    deleted_at:
                        new Date(),

                    updated_at:
                        new Date(),
                },
            });
    }


    async syncPromocao(
        input: {
            promocaoId: number;
            parceiroId: number;
            exibirTv: boolean;
            ordem: number;
        },
    ) {
        const typeId =
            await this
                .tipoId(
                    "promocao",
                );

        const existing =
            await prisma
                .tvExibicao
                .findUnique({
                    where: {
                        crd_promocao_id:
                            input
                                .promocaoId,
                    },

                    select: {
                        id:
                            true,
                    },
                });

        if (
            existing
        ) {
            await prisma
                .tvExibicao
                .update({
                    where: {
                        id:
                            existing.id,
                    },

                    data: {
                        tv_exibicao_tipo_id:
                            typeId,

                        par_parceiro_id:
                            input.parceiroId,

                        ordem:
                            input.ordem,

                        ativo:
                            input.exibirTv
                                ? 1
                                : 0,

                        ...(
                            input.exibirTv
                                ? {
                                    deleted_at:
                                        null,
                                }
                                : {}
                        ),

                        updated_at:
                            new Date(),
                    },
                });

            return;
        }

        if (
            !input.exibirTv
        ) {
            return;
        }

        await prisma
            .tvExibicao
            .create({
                data: {
                    tv_exibicao_tipo_id:
                        typeId,

                    par_parceiro_id:
                        input.parceiroId,

                    crd_promocao_id:
                        input.promocaoId,

                    ordem:
                        input.ordem,

                    ativo:
                        1,

                    created_at:
                        new Date(),

                    updated_at:
                        new Date(),
                },
            });
    }


    async removePromocaoSource(
        promocaoId:
            number,

        parceiroId:
            number,
    ) {
        const exibicao =
            await prisma
                .tvExibicao
                .findFirst({
                    where: {
                        crd_promocao_id:
                            promocaoId,

                        par_parceiro_id:
                            parceiroId,

                        deleted_at:
                            null,
                    },

                    select: {
                        id:
                            true,
                    },
                });


        if (
            !exibicao
        ) {
            return;
        }


        await prisma
            .tvExibicao
            .update({
                where: {
                    id:
                        exibicao.id,
                },

                data: {
                    ativo:
                        0,

                    deleted_at:
                        new Date(),

                    updated_at:
                        new Date(),
                },
            });
    }


    async getPlaylist(
        slugValue?:
            string |
            null,
    ): Promise<
        TvPlaylistData |
        null
    > {
        const slug =
            slugValue
                ?.trim()
                .toLowerCase() ||
            null;

        const isAaaccu =
            slug ===
            "aaaccu";

        let partner:
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
            partner =
                await prisma
                    .parParceiro
                    .findFirst({
                        where: {
                            slug,

                            ativo:
                                1,

                            visivel_publico:
                                1,

                            deleted_at:
                                null,
                        },

                        select: {
                            id:
                                true,

                            slug:
                                true,

                            nome:
                                true,
                        },
                    });

            if (
                !partner
            ) {
                return null;
            }
        }

        const records =
            await prisma
                .tvExibicao
                .findMany({
                    where: {
                        deleted_at:
                            null,

                        ativo:
                            1,

                        ...(
                            isAaaccu
                                ? {
                                    par_parceiro_id:
                                        null,
                                }
                                : partner
                                    ? {
                                        par_parceiro_id:
                                            partner.id,
                                    }
                                    : {}
                        ),

                        OR: [
                            {
                                par_parceiro_id:
                                    null,
                            },
                            {
                                par_parceiro: {
                                    ativo:
                                        1,

                                    visivel_publico:
                                        1,

                                    deleted_at:
                                        null,
                                },
                            },
                        ],
                    },

                    select:
                        exibicaoSelect,

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
                });

        const nowDate =
            new Date();

        const now =
            saoPauloNow();

        const mapped =
            records
                .filter(
                    (
                        item,
                    ) =>
                        ownWindowActive(
                            item,
                            nowDate,
                        ) &&
                        ownScheduleActive(
                            item,
                            now,
                        ) &&
                        sourceActive(
                            item,
                            nowDate,
                            now,
                        ),
                )
                .map(
                    playlistItem,
                );

        let itens:
            TvPlaylistItem[];

        if (
            slug
        ) {
            itens =
                mapped;
        } else {
            const own =
                mapped.filter(
                    (
                        item,
                    ) =>
                        !item.parceiro,
                );

            const byPartner =
                new Map<
                    number,
                    TvPlaylistItem[]
                >();

            for (
                const item
                of mapped
            ) {
                const id =
                    item
                        .parceiro
                        ?.id;

                if (
                    !id
                ) {
                    continue;
                }

                const group =
                    byPartner
                        .get(id) ??
                    [];

                group.push(item);

                byPartner
                    .set(
                        id,
                        group,
                    );
            }

            itens =
                interleave([
                    own,
                    ...byPartner
                        .values(),
                ]);
        }

        return {
            contexto:
                partner
                    ? {
                        tipo:
                            "parceiro",

                        slug:
                            partner.slug,

                        titulo:
                            partner.nome,

                        subtitulo:
                            "Programação do parceiro",
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
                                "Programação AAACCU",
                        }
                        : {
                            tipo:
                                "geral",

                            slug:
                                null,

                            titulo:
                                "Brava Pass",

                            subtitulo:
                                "Programação geral",
                        },

            itens,

            generated_at:
                new Date()
                    .toISOString(),
        };
    }
}


export const tvProgramacaoService =
    new TvProgramacaoService();
