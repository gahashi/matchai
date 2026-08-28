import {
    prisma,
} from "@/lib/prisma";


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
    value:
        Date |
        null,
) {
    if (
        !value
    ) {
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


function timeMinutes(
    value: Date,
) {
    return (
            value
                .getUTCHours() *
            60
        ) +
        value
            .getUTCMinutes();
}


function serializeTime(
    value: Date,
) {
    return `${String(
        value
            .getUTCHours(),
    ).padStart(
        2,
        "0",
    )}:${String(
        value
            .getUTCMinutes(),
    ).padStart(
        2,
        "0",
    )}`;
}


function horarioAtivo(
    horario: {
        dia_semana:
            number;

        hora_inicio:
            Date;

        hora_fim:
            Date;
    },

    now:
    ReturnType<
        typeof saoPauloNow
    >,
) {
    const inicio =
        timeMinutes(
            horario
                .hora_inicio,
        );

    const fim =
        timeMinutes(
            horario
                .hora_fim,
        );


    /*
     * Horário normal:
     *
     * 18:00 → 23:00
     */
    if (
        inicio <
        fim
    ) {
        return (
            now.weekday ===
            horario
                .dia_semana &&
            now.minuteOfDay >=
            inicio &&
            now.minuteOfDay <
            fim
        );
    }


    /*
     * Horário atravessando meia-noite:
     *
     * sexta 22:00 → 02:00
     *
     * sexta:
     * 22:00 → 23:59
     *
     * sábado:
     * 00:00 → 01:59
     */
    const nextDay =
        (
            horario
                .dia_semana +
            1
        ) %
        7;


    return (
        (
            now.weekday ===
            horario
                .dia_semana &&
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


function promocaoAtivaAgora(
    promocao: {
        ativo:
            number;

        deleted_at:
            Date |
            null;

        validade_inicio:
            Date |
            null;

        validade_fim:
            Date |
            null;

        crd_promocao_horarios:
            Array<{
                dia_semana:
                    number;

                hora_inicio:
                    Date;

                hora_fim:
                    Date;
            }>;
    },

    now:
    ReturnType<
        typeof saoPauloNow
    >,
) {
    if (
        promocao
            .deleted_at ||
        !promocao
            .ativo
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
            .crd_promocao_horarios;


    if (
        horarios.length ===
        0
    ) {
        return true;
    }


    return horarios.some(
        (
            horario,
        ) =>
            horarioAtivo(
                horario,
                now,
            ),
    );
}


class CardapioPublicService {
    async listPublicPartners() {
        const parceiros =
            await prisma.parParceiro.findMany({
                where: {
                    ativo: 1,
                    visivel_publico: 1,
                    deleted_at: null,
                },

                select: {
                    id: true,
                    slug: true,
                    nome: true,
                    descricao: true,

                    par_parceiro_tema: {
                        select: {
                            ativo: true,

                            logo_sys_arquivo: {
                                select: {
                                    public_url: true,
                                },
                            },
                        },
                    },
                },

                orderBy: [
                    {
                        nome: "asc",
                    },
                    {
                        id: "asc",
                    },
                ],
            });

        return parceiros.map(
            (parceiro) => ({
                id: parceiro.id,
                slug: parceiro.slug,
                nome: parceiro.nome,
                descricao:
                parceiro.descricao,

                logo_url:
                    parceiro
                        .par_parceiro_tema
                        ?.ativo
                        ? parceiro
                            .par_parceiro_tema
                            .logo_sys_arquivo
                            ?.public_url ??
                        null
                        : null,
            }),
        );
    }

    async getByParceiroSlug(
        slug: string,
    ) {
        const parceiro =
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

                        codigo:
                            true,

                        slug:
                            true,

                        nome:
                            true,

                        descricao:
                            true,

                        email_contato:
                            true,

                        telefone:
                            true,

                        whatsapp:
                            true,

                        endereco:
                            true,

                        google_maps_url:
                            true,

                        instagram_url:
                            true,

                        site_url:
                            true,

                        horario_funcionamento:
                            true,

                        par_parceiro_tema:
                            {
                                select: {
                                    ativo:
                                        true,

                                    cor_primaria:
                                        true,

                                    cor_secundaria:
                                        true,

                                    cor_fundo:
                                        true,

                                    cor_texto:
                                        true,

                                    logo_sys_arquivo:
                                        {
                                            select: {
                                                public_url:
                                                    true,
                                            },
                                        },

                                    banner_sys_arquivo:
                                        {
                                            select: {
                                                public_url:
                                                    true,
                                            },
                                        },
                                },
                            },

                        crd_categorias:
                            {
                                where: {
                                    ativo:
                                        1,

                                    deleted_at:
                                        null,
                                },

                                select: {
                                    id:
                                        true,

                                    nome:
                                        true,

                                    descricao:
                                        true,

                                    ordem:
                                        true,

                                    crd_itens:
                                        {
                                            where: {
                                                ativo:
                                                    1,

                                                deleted_at:
                                                    null,
                                            },

                                            select: {
                                                id:
                                                    true,

                                                nome:
                                                    true,

                                                descricao:
                                                    true,

                                                preco:
                                                    true,

                                                ordem:
                                                    true,

                                                imagem_sys_arquivo:
                                                    {
                                                        select: {
                                                            public_url:
                                                                true,
                                                        },
                                                    },
                                            },

                                            orderBy: [
                                                {
                                                    ordem:
                                                        "asc",
                                                },
                                                {
                                                    nome:
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
                                        ordem:
                                            "asc",
                                    },
                                    {
                                        nome:
                                            "asc",
                                    },
                                    {
                                        id:
                                            "asc",
                                    },
                                ],
                            },
                    },
                });


        if (
            !parceiro
        ) {
            return null;
        }


        /*
         * Primeiro montamos o cardápio público.
         *
         * Isso também define quais itens realmente
         * podem participar das promoções públicas.
         */
        const categorias =
            parceiro
                .crd_categorias
                .filter(
                    (
                        categoria,
                    ) =>
                        categoria
                            .crd_itens
                            .length >
                        0,
                )
                .map(
                    (
                        categoria,
                    ) => ({
                        id:
                        categoria.id,

                        nome:
                        categoria.nome,

                        descricao:
                        categoria.descricao,

                        ordem:
                        categoria.ordem,

                        itens:
                            categoria
                                .crd_itens
                                .map(
                                    (
                                        item,
                                    ) => ({
                                        id:
                                        item.id,

                                        nome:
                                        item.nome,

                                        descricao:
                                        item.descricao,

                                        preco:
                                            Number(
                                                item.preco,
                                            ),

                                        ordem:
                                        item.ordem,

                                        imagem_url:
                                            item
                                                .imagem_sys_arquivo
                                                ?.public_url ??
                                            null,
                                    }),
                                ),
                    }),
                );


        const publicItemIds =
            new Set(
                categorias.flatMap(
                    (
                        categoria,
                    ) =>
                        categoria
                            .itens
                            .map(
                                (
                                    item,
                                ) =>
                                    item.id,
                            ),
                ),
            );


        /*
         * Promoções do parceiro.
         *
         * Ainda buscamos todas as promoções ativas,
         * pois validade + agenda semanal são avaliadas
         * logo abaixo com a mesma regra usada pela TV.
         */
        const promocoesRaw =
            await prisma
                .crdPromocao
                .findMany({
                    where: {
                        par_parceiro_id:
                        parceiro.id,

                        ativo:
                            1,

                        deleted_at:
                            null,
                    },

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

                        ordem:
                            true,

                        ativo:
                            true,

                        deleted_at:
                            true,

                        imagem_sys_arquivo:
                            {
                                select: {
                                    public_url:
                                        true,
                                },
                            },

                        crd_promocao_itens:
                            {
                                select: {
                                    id:
                                        true,

                                    ordem:
                                        true,

                                    crd_item:
                                        {
                                            select: {
                                                id:
                                                    true,

                                                nome:
                                                    true,

                                                ativo:
                                                    true,

                                                deleted_at:
                                                    true,

                                                imagem_sys_arquivo:
                                                    {
                                                        select: {
                                                            public_url:
                                                                true,
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

                        crd_promocao_horarios:
                            {
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
                    },

                    orderBy: [
                        {
                            ordem:
                                "asc",
                        },
                        {
                            titulo:
                                "asc",
                        },
                        {
                            id:
                                "asc",
                        },
                    ],
                });


        const now =
            saoPauloNow();


        const promocoes =
            promocoesRaw
                .filter(
                    (
                        promocao,
                    ) =>
                        promocaoAtivaAgora(
                            promocao,
                            now,
                        ),
                )
                .flatMap(
                    (
                        promocao,
                    ) => {
                        /*
                         * Não expomos produto inativo,
                         * removido ou pertencente a uma
                         * categoria que não está pública.
                         */
                        const itens =
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
                                        publicItemIds
                                            .has(
                                                vinculo
                                                    .crd_item
                                                    .id,
                                            ),
                                )
                                .map(
                                    (
                                        vinculo,
                                    ) => ({
                                        id:
                                        vinculo
                                            .crd_item
                                            .id,

                                        nome:
                                        vinculo
                                            .crd_item
                                            .nome,
                                    }),
                                );


                        /*
                         * Uma promoção sem nenhum item
                         * público não deve aparecer na
                         * vitrine.
                         */
                        if (
                            itens.length ===
                            0
                        ) {
                            return [];
                        }


                        const fallbackImagem =
                            promocao
                                .crd_promocao_itens
                                .find(
                                    (
                                        vinculo,
                                    ) =>
                                        publicItemIds
                                            .has(
                                                vinculo
                                                    .crd_item
                                                    .id,
                                            ) &&
                                        vinculo
                                            .crd_item
                                            .imagem_sys_arquivo
                                            ?.public_url,
                                )
                                ?.crd_item
                                .imagem_sys_arquivo
                                ?.public_url ??
                            null;


                        return [
                            {
                                id:
                                promocao.id,

                                titulo:
                                promocao.titulo,

                                descricao:
                                promocao.descricao,

                                preco_promocional:
                                    promocao
                                        .preco_promocional ===
                                    null
                                        ? null
                                        : Number(
                                            promocao
                                                .preco_promocional,
                                        ),

                                validade_inicio:
                                    dateOnly(
                                        promocao
                                            .validade_inicio,
                                    ),

                                validade_fim:
                                    dateOnly(
                                        promocao
                                            .validade_fim,
                                    ),

                                imagem_url:
                                    promocao
                                        .imagem_sys_arquivo
                                        ?.public_url ??
                                    fallbackImagem,

                                itens,

                                item_ids:
                                    itens.map(
                                        (
                                            item,
                                        ) =>
                                            item.id,
                                    ),

                                horarios:
                                    promocao
                                        .crd_promocao_horarios
                                        .map(
                                            (
                                                horario,
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
                            },
                        ];
                    },
                );


        const tema =
            parceiro
                .par_parceiro_tema;


        return {
            id:
            parceiro.id,

            codigo:
            parceiro.codigo,

            slug:
            parceiro.slug,

            nome:
            parceiro.nome,

            descricao:
            parceiro.descricao,

            informacoes: {
                email_contato:
                parceiro.email_contato,

                telefone:
                parceiro.telefone,

                whatsapp:
                parceiro.whatsapp,

                endereco:
                parceiro.endereco,

                google_maps_url:
                parceiro.google_maps_url,

                instagram_url:
                parceiro.instagram_url,

                site_url:
                parceiro.site_url,

                horario_funcionamento:
                parceiro.horario_funcionamento,
            },

            tema: {
                cor_primaria:
                    tema?.ativo
                        ? tema
                            .cor_primaria
                        : null,

                cor_secundaria:
                    tema?.ativo
                        ? tema
                            .cor_secundaria
                        : null,

                cor_fundo:
                    tema?.ativo
                        ? tema
                            .cor_fundo
                        : null,

                cor_texto:
                    tema?.ativo
                        ? tema
                            .cor_texto
                        : null,

                logo_url:
                    tema?.ativo
                        ? tema
                            .logo_sys_arquivo
                            ?.public_url ??
                        null
                        : null,

                banner_url:
                    tema?.ativo
                        ? tema
                            .banner_sys_arquivo
                            ?.public_url ??
                        null
                        : null,
            },

            promocoes,

            categorias,
        };
    }
}


export const cardapioPublicService =
    new CardapioPublicService();