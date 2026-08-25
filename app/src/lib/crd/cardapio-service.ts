import {
    prisma,
} from "@/lib/prisma";

import {
    arquivoService,
} from "@/lib/storage/arquivo-service";


type CategoriaInput = {
    parceiroId: number;

    nome: string;
    descricao?: string | null;

    ordem: number;
    ativo: boolean;
};


type ItemInput = {
    parceiroId: number;

    categoriaId: number;

    nome: string;
    descricao?: string | null;

    preco: number;

    ordem: number;
    ativo: boolean;
};


type CreateItemInput =
    ItemInput & {
    imagem?: File | null;

    sysUsuarioId:
        number;
};


type UpdateItemInput =
    ItemInput & {
    id: number;

    imagem?: File | null;

    removerImagem:
        boolean;

    sysUsuarioId:
        number;
};


function optionalText(
    value?: string | null,
) {
    const normalized =
        value?.trim();

    return normalized ||
        null;
}


function validateOrdem(
    ordem: number,
) {
    if (
        !Number.isInteger(
            ordem,
        ) ||
        ordem < 0
    ) {
        throw new Error(
            "A ordem deve ser um número inteiro igual ou maior que zero.",
        );
    }
}


function validateCategoria(
    input: CategoriaInput,
) {
    const nome =
        input.nome.trim();

    if (
        nome.length < 2 ||
        nome.length > 120
    ) {
        throw new Error(
            "Informe um nome válido para a categoria.",
        );
    }

    if (
        input.descricao &&
        input.descricao.length >
        500
    ) {
        throw new Error(
            "A descrição da categoria deve possuir no máximo 500 caracteres.",
        );
    }

    validateOrdem(
        input.ordem,
    );
}


function validateItem(
    input: ItemInput,
) {
    const nome =
        input.nome.trim();

    if (
        nome.length < 2 ||
        nome.length > 150
    ) {
        throw new Error(
            "Informe um nome válido para o item.",
        );
    }

    if (
        !Number.isFinite(
            input.preco,
        ) ||
        input.preco < 0
    ) {
        throw new Error(
            "Informe um preço válido.",
        );
    }

    validateOrdem(
        input.ordem,
    );
}


const categoriaSelect = {
    id: true,

    par_parceiro_id:
        true,

    nome: true,
    descricao: true,

    ordem: true,
    ativo: true,

    created_at: true,
    updated_at: true,

    _count: {
        select: {
            crd_itens: {
                where: {
                    deleted_at:
                        null,
                },
            },
        },
    },
} as const;


const itemSelect = {
    id: true,

    par_parceiro_id:
        true,

    crd_categoria_id:
        true,

    nome: true,
    descricao: true,

    preco: true,

    ordem: true,
    ativo: true,

    created_at: true,
    updated_at: true,

    crd_categoria: {
        select: {
            id: true,
            nome: true,
            ativo: true,
        },
    },

    imagem_sys_arquivo: {
        select: {
            id: true,

            public_url:
                true,

            original_name:
                true,
        },
    },
} as const;


function serializeCategoria(
    categoria: any,
) {
    return {
        id:
        categoria.id,

        nome:
        categoria.nome,

        descricao:
        categoria.descricao,

        ordem:
        categoria.ordem,

        ativo:
        categoria.ativo,

        quantidade_itens:
        categoria
            ._count
            .crd_itens,

        created_at:
        categoria.created_at,

        updated_at:
        categoria.updated_at,
    };
}


function serializeItem(
    item: any,
) {
    return {
        id:
        item.id,

        crd_categoria_id:
        item.crd_categoria_id,

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

        ativo:
        item.ativo,

        categoria: {
            id:
            item
                .crd_categoria
                .id,

            nome:
            item
                .crd_categoria
                .nome,

            ativo:
            item
                .crd_categoria
                .ativo,
        },

        imagem:
            item
                .imagem_sys_arquivo
                ? {
                    sys_arquivo_id:
                    item
                        .imagem_sys_arquivo
                        .id,

                    public_url:
                    item
                        .imagem_sys_arquivo
                        .public_url,

                    original_name:
                    item
                        .imagem_sys_arquivo
                        .original_name,
                }
                : null,

        created_at:
        item.created_at,

        updated_at:
        item.updated_at,
    };
}


class CardapioService {
    async listParceiroData(
        parceiroId: number,
    ) {
        const [
            categorias,
            itens,
        ] =
            await Promise.all([
                prisma
                    .crdCategoria
                    .findMany({
                        where: {
                            par_parceiro_id:
                            parceiroId,

                            deleted_at:
                                null,
                        },

                        select:
                        categoriaSelect,

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
                    }),

                prisma
                    .crdItem
                    .findMany({
                        where: {
                            par_parceiro_id:
                            parceiroId,

                            deleted_at:
                                null,
                        },

                        select:
                        itemSelect,

                        orderBy: [
                            {
                                crd_categoria:
                                    {
                                        ordem:
                                            "asc",
                                    },
                            },
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
                    }),
            ]);

        return {
            categorias:
                categorias.map(
                    serializeCategoria,
                ),

            itens:
                itens.map(
                    serializeItem,
                ),
        };
    }


    async createCategoria(
        input: CategoriaInput,
    ) {
        validateCategoria(
            input,
        );

        const categoria =
            await prisma
                .crdCategoria
                .create({
                    data: {
                        par_parceiro_id:
                        input.parceiroId,

                        nome:
                            input.nome.trim(),

                        descricao:
                            optionalText(
                                input.descricao,
                            ),

                        ordem:
                        input.ordem,

                        ativo:
                            input.ativo
                                ? 1
                                : 0,

                        created_at:
                            new Date(),

                        updated_at:
                            new Date(),
                    },

                    select:
                    categoriaSelect,
                });

        return serializeCategoria(
            categoria,
        );
    }


    async updateCategoria(
        input:
            CategoriaInput & {
            id: number;
        },
    ) {
        validateCategoria(
            input,
        );

        await this
            .ensureCategoria(
                input.id,
                input.parceiroId,
            );

        const categoria =
            await prisma
                .crdCategoria
                .update({
                    where: {
                        id:
                        input.id,
                    },

                    data: {
                        nome:
                            input.nome.trim(),

                        descricao:
                            optionalText(
                                input.descricao,
                            ),

                        ordem:
                        input.ordem,

                        ativo:
                            input.ativo
                                ? 1
                                : 0,

                        updated_at:
                            new Date(),
                    },

                    select:
                    categoriaSelect,
                });

        return serializeCategoria(
            categoria,
        );
    }


    async setCategoriaAtiva(
        parceiroId: number,
        categoriaId: number,
        ativo: boolean,
    ) {
        await this
            .ensureCategoria(
                categoriaId,
                parceiroId,
            );

        const categoria =
            await prisma
                .crdCategoria
                .update({
                    where: {
                        id:
                        categoriaId,
                    },

                    data: {
                        ativo:
                            ativo
                                ? 1
                                : 0,

                        updated_at:
                            new Date(),
                    },

                    select:
                    categoriaSelect,
                });

        return serializeCategoria(
            categoria,
        );
    }


    async deleteCategoria(
        parceiroId: number,
        categoriaId: number,
    ) {
        await this
            .ensureCategoria(
                categoriaId,
                parceiroId,
            );

        const itens =
            await prisma
                .crdItem
                .count({
                    where: {
                        par_parceiro_id:
                        parceiroId,

                        crd_categoria_id:
                        categoriaId,

                        deleted_at:
                            null,
                    },
                });

        if (itens > 0) {
            throw new Error(
                "A categoria possui itens. Exclua ou mova os itens antes de remover a categoria.",
            );
        }

        await prisma
            .crdCategoria
            .update({
                where: {
                    id:
                    categoriaId,
                },

                data: {
                    ativo: 0,

                    deleted_at:
                        new Date(),

                    updated_at:
                        new Date(),
                },
            });

        return {
            id:
            categoriaId,
        };
    }


    async createItem(
        input: CreateItemInput,
    ) {
        validateItem(
            input,
        );

        await this
            .ensureCategoria(
                input.categoriaId,
                input.parceiroId,
            );

        const item =
            await prisma
                .crdItem
                .create({
                    data: {
                        par_parceiro_id:
                        input.parceiroId,

                        crd_categoria_id:
                        input.categoriaId,

                        nome:
                            input.nome.trim(),

                        descricao:
                            optionalText(
                                input.descricao,
                            ),

                        preco:
                        input.preco,

                        ordem:
                        input.ordem,

                        ativo:
                            input.ativo
                                ? 1
                                : 0,

                        created_at:
                            new Date(),

                        updated_at:
                            new Date(),
                    },

                    select: {
                        id: true,
                    },
                });

        let arquivoId:
            number | null =
            null;

        try {
            if (input.imagem) {
                const upload =
                    await arquivoService
                        .uploadPublicImage({
                            file:
                            input.imagem,

                            folder:
                                `parceiros/${input.parceiroId}/cardapio`,

                            filenamePrefix:
                                `item-${item.id}`,

                            tipoCodigo:
                                "cardapio_item_imagem",

                            createdBySysUsuarioId:
                            input
                                .sysUsuarioId,
                        });

                arquivoId =
                    upload
                        .arquivo
                        .id;

                await prisma
                    .crdItem
                    .update({
                        where: {
                            id:
                            item.id,
                        },

                        data: {
                            imagem_sys_arquivo_id:
                            arquivoId,

                            updated_at:
                                new Date(),
                        },
                    });
            }

            return this
                .findItemById(
                    input.parceiroId,
                    item.id,
                );
        } catch (error) {
            if (arquivoId) {
                try {
                    await arquivoService
                        .marcarComoRemovido({
                            arquivoId,
                        });
                } catch (
                    cleanupError
                    ) {
                    console.error(
                        "[cardapio.item.create.file.cleanup]",
                        cleanupError,
                    );
                }
            }

            await prisma
                .crdItem
                .delete({
                    where: {
                        id:
                        item.id,
                    },
                });

            throw error;
        }
    }


    async updateItem(
        input: UpdateItemInput,
    ) {
        validateItem(
            input,
        );

        const existente =
            await this
                .ensureItem(
                    input.id,
                    input.parceiroId,
                );

        await this
            .ensureCategoria(
                input.categoriaId,
                input.parceiroId,
            );

        let novaImagemId:
            number | null =
            null;

        if (input.imagem) {
            const upload =
                await arquivoService
                    .uploadPublicImage({
                        file:
                        input.imagem,

                        folder:
                            `parceiros/${input.parceiroId}/cardapio`,

                        filenamePrefix:
                            `item-${input.id}`,

                        tipoCodigo:
                            "cardapio_item_imagem",

                        createdBySysUsuarioId:
                        input
                            .sysUsuarioId,
                    });

            novaImagemId =
                upload
                    .arquivo
                    .id;
        }

        try {
            const imagemFinalId =
                novaImagemId ??
                (
                    input.removerImagem
                        ? null
                        : existente
                            .imagem_sys_arquivo_id
                );

            await prisma
                .crdItem
                .update({
                    where: {
                        id:
                        input.id,
                    },

                    data: {
                        crd_categoria_id:
                        input.categoriaId,

                        nome:
                            input.nome.trim(),

                        descricao:
                            optionalText(
                                input.descricao,
                            ),

                        preco:
                        input.preco,

                        ordem:
                        input.ordem,

                        ativo:
                            input.ativo
                                ? 1
                                : 0,

                        imagem_sys_arquivo_id:
                        imagemFinalId,

                        updated_at:
                            new Date(),
                    },
                });

            if (
                existente
                    .imagem_sys_arquivo_id &&
                existente
                    .imagem_sys_arquivo_id !==
                imagemFinalId
            ) {
                try {
                    await arquivoService
                        .marcarComoRemovido({
                            arquivoId:
                            existente
                                .imagem_sys_arquivo_id,
                        });
                } catch (
                    cleanupError
                    ) {
                    console.error(
                        "[cardapio.item.update.old-file.cleanup]",
                        cleanupError,
                    );
                }
            }

            return this
                .findItemById(
                    input.parceiroId,
                    input.id,
                );
        } catch (error) {
            if (novaImagemId) {
                try {
                    await arquivoService
                        .marcarComoRemovido({
                            arquivoId:
                            novaImagemId,
                        });
                } catch (
                    cleanupError
                    ) {
                    console.error(
                        "[cardapio.item.update.new-file.cleanup]",
                        cleanupError,
                    );
                }
            }

            throw error;
        }
    }


    async setItemAtivo(
        parceiroId: number,
        itemId: number,
        ativo: boolean,
    ) {
        await this.ensureItem(
            itemId,
            parceiroId,
        );

        await prisma
            .crdItem
            .update({
                where: {
                    id:
                    itemId,
                },

                data: {
                    ativo:
                        ativo
                            ? 1
                            : 0,

                    updated_at:
                        new Date(),
                },
            });

        return this
            .findItemById(
                parceiroId,
                itemId,
            );
    }


    async deleteItem(
        parceiroId: number,
        itemId: number,
    ) {
        const item =
            await this
                .ensureItem(
                    itemId,
                    parceiroId,
                );

        await prisma
            .crdItem
            .update({
                where: {
                    id:
                    itemId,
                },

                data: {
                    ativo: 0,

                    deleted_at:
                        new Date(),

                    updated_at:
                        new Date(),
                },
            });

        if (
            item
                .imagem_sys_arquivo_id
        ) {
            try {
                await arquivoService
                    .marcarComoRemovido({
                        arquivoId:
                        item
                            .imagem_sys_arquivo_id,
                    });
            } catch (
                cleanupError
                ) {
                console.error(
                    "[cardapio.item.delete.file.cleanup]",
                    cleanupError,
                );
            }
        }

        return {
            id:
            itemId,
        };
    }


    private async ensureCategoria(
        categoriaId: number,
        parceiroId: number,
    ) {
        const categoria =
            await prisma
                .crdCategoria
                .findFirst({
                    where: {
                        id:
                        categoriaId,

                        par_parceiro_id:
                        parceiroId,

                        deleted_at:
                            null,
                    },

                    select: {
                        id: true,
                    },
                });

        if (!categoria) {
            throw new Error(
                "Categoria não encontrada.",
            );
        }

        return categoria;
    }


    private async ensureItem(
        itemId: number,
        parceiroId: number,
    ) {
        const item =
            await prisma
                .crdItem
                .findFirst({
                    where: {
                        id:
                        itemId,

                        par_parceiro_id:
                        parceiroId,

                        deleted_at:
                            null,
                    },

                    select: {
                        id: true,

                        imagem_sys_arquivo_id:
                            true,
                    },
                });

        if (!item) {
            throw new Error(
                "Item do cardápio não encontrado.",
            );
        }

        return item;
    }


    async findItemById(
        parceiroId: number,
        itemId: number,
    ) {
        const item =
            await prisma
                .crdItem
                .findFirst({
                    where: {
                        id:
                        itemId,

                        par_parceiro_id:
                        parceiroId,

                        deleted_at:
                            null,
                    },

                    select:
                    itemSelect,
                });

        if (!item) {
            return null;
        }

        return serializeItem(
            item,
        );
    }
}


export const cardapioService =
    new CardapioService();