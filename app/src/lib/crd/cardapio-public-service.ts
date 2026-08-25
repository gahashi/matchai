import {
    prisma,
} from "@/lib/prisma";


class CardapioPublicService {
    async getByParceiroSlug(
        slug: string,
    ) {
        const parceiro =
            await prisma
                .parParceiro
                .findFirst({
                    where: {
                        slug,

                        ativo: 1,
                        visivel_publico:
                            1,

                        deleted_at:
                            null,
                    },

                    select: {
                        id: true,

                        codigo: true,
                        slug: true,

                        nome: true,
                        descricao: true,

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
                                    ativo: 1,

                                    deleted_at:
                                        null,
                                },

                                select: {
                                    id: true,

                                    nome: true,
                                    descricao:
                                        true,

                                    ordem: true,

                                    crd_itens: {
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

        if (!parceiro) {
            return null;
        }

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

            tema: {
                cor_primaria:
                    tema?.ativo
                        ? tema.cor_primaria
                        : null,

                cor_secundaria:
                    tema?.ativo
                        ? tema.cor_secundaria
                        : null,

                cor_fundo:
                    tema?.ativo
                        ? tema.cor_fundo
                        : null,

                cor_texto:
                    tema?.ativo
                        ? tema.cor_texto
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

            categorias:
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
                    ),
        };
    }
}


export const cardapioPublicService =
    new CardapioPublicService();