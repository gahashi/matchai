import {
    prisma,
} from "@/lib/prisma";

import {
    arquivoService,
} from "@/lib/storage/arquivo-service";


type ParceiroWriteInput = {
    codigo: string;
    slug: string;
    nome: string;
    descricao?: string | null;

    ativo: boolean;
    visivelPublico: boolean;

    usuarioIds: number[];

    corPrimaria?: string | null;
    corSecundaria?: string | null;
    corFundo?: string | null;
    corTexto?: string | null;
};


type CreateParceiroInput =
    ParceiroWriteInput & {
    logo?: File | null;
    banner?: File | null;

    createdBySysUsuarioId:
        number;
};


type UpdateParceiroInput =
    ParceiroWriteInput & {
    id: number;

    logo?: File | null;
    banner?: File | null;

    removerLogo: boolean;
    removerBanner: boolean;

    updatedBySysUsuarioId:
        number;
};


function normalizeOptional(
    value?: string | null,
) {
    const normalized =
        value?.trim();

    return normalized
        ? normalized
        : null;
}


function normalizeCodigo(
    value: string,
) {
    return value
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            "",
        )
        .replace(
            /[^a-z0-9_-]+/g,
            "-",
        )
        .replace(
            /-+/g,
            "-",
        )
        .replace(
            /^-+|-+$/g,
            "",
        );
}


function normalizeSlug(
    value: string,
) {
    return value
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            "",
        )
        .replace(
            /[^a-z0-9]+/g,
            "-",
        )
        .replace(
            /-+/g,
            "-",
        )
        .replace(
            /^-+|-+$/g,
            "",
        );
}


function normalizeColor(
    value?: string | null,
) {
    const color =
        normalizeOptional(
            value,
        );

    if (!color) {
        return null;
    }

    if (
        !/^#[0-9a-fA-F]{6}$/.test(
            color,
        )
    ) {
        throw new Error(
            "As cores devem estar no formato hexadecimal, por exemplo #9CD91A.",
        );
    }

    return color.toUpperCase();
}


function normalizeUsuarioIds(
    usuarioIds: number[],
) {
    return [
        ...new Set(
            usuarioIds.filter(
                (id) =>
                    Number.isInteger(
                        id,
                    ) &&
                    id > 0,
            ),
        ),
    ];
}


function validateParceiroInput(
    input: ParceiroWriteInput,
) {
    if (
        input.nome
            .trim()
            .length < 2
    ) {
        throw new Error(
            "Informe o nome do parceiro.",
        );
    }

    const codigo =
        normalizeCodigo(
            input.codigo,
        );

    if (
        codigo.length < 2 ||
        codigo.length > 60
    ) {
        throw new Error(
            "Informe um código válido para o parceiro.",
        );
    }

    const slug =
        normalizeSlug(
            input.slug,
        );

    if (
        slug.length < 2 ||
        slug.length > 150
    ) {
        throw new Error(
            "Informe um endereço público válido.",
        );
    }

    normalizeColor(
        input.corPrimaria,
    );

    normalizeColor(
        input.corSecundaria,
    );

    normalizeColor(
        input.corFundo,
    );

    normalizeColor(
        input.corTexto,
    );
}


const parceiroSelect = {
    id: true,

    codigo: true,
    slug: true,

    nome: true,
    descricao: true,

    ativo: true,
    visivel_publico: true,

    created_at: true,
    updated_at: true,

    par_parceiro_tema: {
        select: {
            id: true,

            logo_sys_arquivo_id:
                true,

            banner_sys_arquivo_id:
                true,

            cor_primaria:
                true,

            cor_secundaria:
                true,

            cor_fundo:
                true,

            cor_texto:
                true,

            ativo: true,

            logo_sys_arquivo: {
                select: {
                    id: true,
                    public_url:
                        true,
                    original_name:
                        true,
                },
            },

            banner_sys_arquivo: {
                select: {
                    id: true,
                    public_url:
                        true,
                    original_name:
                        true,
                },
            },
        },
    },

    par_parceiro_usuarios: {
        where: {
            ativo: 1,
        },

        select: {
            id: true,

            sys_usuario_id:
                true,

            sys_usuario: {
                select: {
                    id: true,
                    nome: true,
                    nickname:
                        true,
                    email: true,
                },
            },
        },

        orderBy: {
            id: "asc" as const,
        },
    },
} as const;


function serializeParceiro(
    parceiro: any,
) {
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

        ativo:
        parceiro.ativo,

        visivel_publico:
        parceiro.visivel_publico,

        created_at:
        parceiro.created_at,

        updated_at:
        parceiro.updated_at,

        tema: tema
            ? {
                id:
                tema.id,

                cor_primaria:
                tema.cor_primaria,

                cor_secundaria:
                tema.cor_secundaria,

                cor_fundo:
                tema.cor_fundo,

                cor_texto:
                tema.cor_texto,

                ativo:
                tema.ativo,

                logo:
                    tema
                        .logo_sys_arquivo
                        ? {
                            sys_arquivo_id:
                            tema
                                .logo_sys_arquivo
                                .id,

                            public_url:
                            tema
                                .logo_sys_arquivo
                                .public_url,

                            original_name:
                            tema
                                .logo_sys_arquivo
                                .original_name,
                        }
                        : null,

                banner:
                    tema
                        .banner_sys_arquivo
                        ? {
                            sys_arquivo_id:
                            tema
                                .banner_sys_arquivo
                                .id,

                            public_url:
                            tema
                                .banner_sys_arquivo
                                .public_url,

                            original_name:
                            tema
                                .banner_sys_arquivo
                                .original_name,
                        }
                        : null,
            }
            : null,

        usuarios:
            parceiro
                .par_parceiro_usuarios
                .map(
                    (
                        vinculo: any,
                    ) => ({
                        id:
                        vinculo
                            .sys_usuario
                            .id,

                        nome:
                        vinculo
                            .sys_usuario
                            .nome,

                        nickname:
                        vinculo
                            .sys_usuario
                            .nickname,

                        email:
                        vinculo
                            .sys_usuario
                            .email,
                    }),
                ),
    };
}


class ParceiroService {
    async listAdminData() {
        const parceiros =
            await prisma
                .parParceiro
                .findMany({
                    where: {
                        deleted_at:
                            null,
                    },

                    select:
                    parceiroSelect,

                    orderBy: [
                        {
                            ativo:
                                "desc",
                        },
                        {
                            nome:
                                "asc",
                        },
                        {
                            id:
                                "desc",
                        },
                    ],
                });

        return {
            parceiros:
                parceiros.map(
                    serializeParceiro,
                ),
        };
    }


    private async ensureCodigoDisponivel(
        codigo: string,
        ignorarId?: number,
    ) {
        const existente =
            await prisma
                .parParceiro
                .findFirst({
                    where: {
                        codigo,

                        deleted_at:
                            null,

                        ...(ignorarId
                            ? {
                                id: {
                                    not:
                                    ignorarId,
                                },
                            }
                            : {}),
                    },

                    select: {
                        id: true,
                    },
                });

        if (existente) {
            throw new Error(
                "Já existe um parceiro com este código.",
            );
        }
    }


    private async ensureSlugDisponivel(
        slug: string,
        ignorarId?: number,
    ) {
        const existente =
            await prisma
                .parParceiro
                .findFirst({
                    where: {
                        slug,

                        deleted_at:
                            null,

                        ...(ignorarId
                            ? {
                                id: {
                                    not:
                                    ignorarId,
                                },
                            }
                            : {}),
                    },

                    select: {
                        id: true,
                    },
                });

        if (existente) {
            throw new Error(
                "Este endereço público já está sendo utilizado.",
            );
        }
    }


    private async validarUsuarios(
        usuarioIds: number[],
    ) {
        const ids =
            normalizeUsuarioIds(
                usuarioIds,
            );

        if (
            ids.length === 0
        ) {
            return [];
        }

        const usuarios =
            await prisma
                .sysUsuario
                .findMany({
                    where: {
                        id: {
                            in:
                            ids,
                        },

                        ativo: 1,

                        deleted_at:
                            null,
                    },

                    select: {
                        id: true,
                    },
                });

        if (
            usuarios.length !==
            ids.length
        ) {
            throw new Error(
                "Um ou mais usuários vinculados são inválidos.",
            );
        }

        return ids;
    }


    async create(
        input: CreateParceiroInput,
    ) {
        validateParceiroInput(
            input,
        );

        const codigo =
            normalizeCodigo(
                input.codigo,
            );

        const slug =
            normalizeSlug(
                input.slug,
            );

        const usuarioIds =
            await this
                .validarUsuarios(
                    input.usuarioIds,
                );

        await Promise.all([
            this.ensureCodigoDisponivel(
                codigo,
            ),

            this.ensureSlugDisponivel(
                slug,
            ),
        ]);

        const parceiro =
            await prisma
                .parParceiro
                .create({
                    data: {
                        codigo,
                        slug,

                        nome:
                            input.nome.trim(),

                        descricao:
                            normalizeOptional(
                                input.descricao,
                            ),

                        ativo:
                            input.ativo
                                ? 1
                                : 0,

                        visivel_publico:
                            input
                                .visivelPublico
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

        let logoArquivoId:
            number | null =
            null;

        let bannerArquivoId:
            number | null =
            null;

        try {
            if (input.logo) {
                const upload =
                    await arquivoService
                        .uploadPublicImage({
                            file:
                            input.logo,

                            folder:
                                `parceiros/${parceiro.id}/tema`,

                            filenamePrefix:
                                "parceiro-logo",

                            tipoCodigo:
                                "parceiro_logo",

                            createdBySysUsuarioId:
                            input
                                .createdBySysUsuarioId,
                        });

                logoArquivoId =
                    upload.arquivo.id;
            }

            if (input.banner) {
                const upload =
                    await arquivoService
                        .uploadPublicImage({
                            file:
                            input.banner,

                            folder:
                                `parceiros/${parceiro.id}/tema`,

                            filenamePrefix:
                                "parceiro-banner",

                            tipoCodigo:
                                "parceiro_banner",

                            createdBySysUsuarioId:
                            input
                                .createdBySysUsuarioId,
                        });

                bannerArquivoId =
                    upload.arquivo.id;
            }

            await prisma
                .$transaction(
                    async (tx) => {
                        await tx
                            .parParceiroTema
                            .create({
                                data: {
                                    par_parceiro_id:
                                    parceiro.id,

                                    logo_sys_arquivo_id:
                                    logoArquivoId,

                                    banner_sys_arquivo_id:
                                    bannerArquivoId,

                                    cor_primaria:
                                        normalizeColor(
                                            input.corPrimaria,
                                        ),

                                    cor_secundaria:
                                        normalizeColor(
                                            input.corSecundaria,
                                        ),

                                    cor_fundo:
                                        normalizeColor(
                                            input.corFundo,
                                        ),

                                    cor_texto:
                                        normalizeColor(
                                            input.corTexto,
                                        ),

                                    ativo: 1,

                                    created_at:
                                        new Date(),

                                    updated_at:
                                        new Date(),
                                },
                            });

                        if (
                            usuarioIds.length >
                            0
                        ) {
                            await tx
                                .parParceiroUsuario
                                .createMany({
                                    data:
                                        usuarioIds.map(
                                            (
                                                sysUsuarioId,
                                            ) => ({
                                                par_parceiro_id:
                                                parceiro.id,

                                                sys_usuario_id:
                                                sysUsuarioId,

                                                ativo: 1,

                                                created_at:
                                                    new Date(),

                                                updated_at:
                                                    new Date(),
                                            }),
                                        ),
                                });
                        }
                    },
                );

            return this.findById(
                parceiro.id,
            );
        } catch (error) {
            if (logoArquivoId) {
                try {
                    await arquivoService
                        .marcarComoRemovido({
                            arquivoId:
                            logoArquivoId,
                        });
                } catch (
                    cleanupError
                    ) {
                    console.error(
                        "[parceiro.create.logo.cleanup]",
                        cleanupError,
                    );
                }
            }

            if (
                bannerArquivoId
            ) {
                try {
                    await arquivoService
                        .marcarComoRemovido({
                            arquivoId:
                            bannerArquivoId,
                        });
                } catch (
                    cleanupError
                    ) {
                    console.error(
                        "[parceiro.create.banner.cleanup]",
                        cleanupError,
                    );
                }
            }

            await prisma
                .parParceiroUsuario
                .deleteMany({
                    where: {
                        par_parceiro_id:
                        parceiro.id,
                    },
                });

            await prisma
                .parParceiroTema
                .deleteMany({
                    where: {
                        par_parceiro_id:
                        parceiro.id,
                    },
                });

            await prisma
                .parParceiro
                .delete({
                    where: {
                        id:
                        parceiro.id,
                    },
                });

            throw error;
        }
    }


    async update(
        input: UpdateParceiroInput,
    ) {
        validateParceiroInput(
            input,
        );

        const existente =
            await prisma
                .parParceiro
                .findFirst({
                    where: {
                        id:
                        input.id,

                        deleted_at:
                            null,
                    },

                    select: {
                        id: true,

                        par_parceiro_tema:
                            {
                                select: {
                                    id:
                                        true,

                                    logo_sys_arquivo_id:
                                        true,

                                    banner_sys_arquivo_id:
                                        true,
                                },
                            },
                    },
                });

        if (!existente) {
            throw new Error(
                "Parceiro não encontrado.",
            );
        }

        const codigo =
            normalizeCodigo(
                input.codigo,
            );

        const slug =
            normalizeSlug(
                input.slug,
            );

        const usuarioIds =
            await this
                .validarUsuarios(
                    input.usuarioIds,
                );

        await Promise.all([
            this.ensureCodigoDisponivel(
                codigo,
                input.id,
            ),

            this.ensureSlugDisponivel(
                slug,
                input.id,
            ),
        ]);

        let novoLogoId:
            number | null =
            null;

        let novoBannerId:
            number | null =
            null;

        if (input.logo) {
            const upload =
                await arquivoService
                    .uploadPublicImage({
                        file:
                        input.logo,

                        folder:
                            `parceiros/${input.id}/tema`,

                        filenamePrefix:
                            "parceiro-logo",

                        tipoCodigo:
                            "parceiro_logo",

                        createdBySysUsuarioId:
                        input
                            .updatedBySysUsuarioId,
                    });

            novoLogoId =
                upload.arquivo.id;
        }

        try {
            if (input.banner) {
                const upload =
                    await arquivoService
                        .uploadPublicImage({
                            file:
                            input.banner,

                            folder:
                                `parceiros/${input.id}/tema`,

                            filenamePrefix:
                                "parceiro-banner",

                            tipoCodigo:
                                "parceiro_banner",

                            createdBySysUsuarioId:
                            input
                                .updatedBySysUsuarioId,
                        });

                novoBannerId =
                    upload.arquivo.id;
            }

            const logoFinalId =
                novoLogoId ??
                (input.removerLogo
                    ? null
                    : existente
                        .par_parceiro_tema
                        ?.logo_sys_arquivo_id ??
                    null);

            const bannerFinalId =
                novoBannerId ??
                (input.removerBanner
                    ? null
                    : existente
                        .par_parceiro_tema
                        ?.banner_sys_arquivo_id ??
                    null);

            await prisma
                .$transaction(
                    async (tx) => {
                        await tx
                            .parParceiro
                            .update({
                                where: {
                                    id:
                                    input.id,
                                },

                                data: {
                                    codigo,
                                    slug,

                                    nome:
                                        input.nome.trim(),

                                    descricao:
                                        normalizeOptional(
                                            input.descricao,
                                        ),

                                    ativo:
                                        input.ativo
                                            ? 1
                                            : 0,

                                    visivel_publico:
                                        input
                                            .visivelPublico
                                            ? 1
                                            : 0,

                                    updated_at:
                                        new Date(),
                                },
                            });

                        await tx
                            .parParceiroTema
                            .upsert({
                                where: {
                                    par_parceiro_id:
                                    input.id,
                                },

                                create: {
                                    par_parceiro_id:
                                    input.id,

                                    logo_sys_arquivo_id:
                                    logoFinalId,

                                    banner_sys_arquivo_id:
                                    bannerFinalId,

                                    cor_primaria:
                                        normalizeColor(
                                            input.corPrimaria,
                                        ),

                                    cor_secundaria:
                                        normalizeColor(
                                            input.corSecundaria,
                                        ),

                                    cor_fundo:
                                        normalizeColor(
                                            input.corFundo,
                                        ),

                                    cor_texto:
                                        normalizeColor(
                                            input.corTexto,
                                        ),

                                    ativo: 1,

                                    created_at:
                                        new Date(),

                                    updated_at:
                                        new Date(),
                                },

                                update: {
                                    logo_sys_arquivo_id:
                                    logoFinalId,

                                    banner_sys_arquivo_id:
                                    bannerFinalId,

                                    cor_primaria:
                                        normalizeColor(
                                            input.corPrimaria,
                                        ),

                                    cor_secundaria:
                                        normalizeColor(
                                            input.corSecundaria,
                                        ),

                                    cor_fundo:
                                        normalizeColor(
                                            input.corFundo,
                                        ),

                                    cor_texto:
                                        normalizeColor(
                                            input.corTexto,
                                        ),

                                    ativo: 1,

                                    updated_at:
                                        new Date(),
                                },
                            });

                        await tx
                            .parParceiroUsuario
                            .updateMany({
                                where: {
                                    par_parceiro_id:
                                    input.id,

                                    ativo: 1,
                                },

                                data: {
                                    ativo: 0,

                                    updated_at:
                                        new Date(),
                                },
                            });

                        for (
                            const usuarioId of
                            usuarioIds
                            ) {
                            await tx
                                .parParceiroUsuario
                                .upsert({
                                    where: {
                                        par_parceiro_id_sys_usuario_id:
                                            {
                                                par_parceiro_id:
                                                input.id,

                                                sys_usuario_id:
                                                usuarioId,
                                            },
                                    },

                                    create: {
                                        par_parceiro_id:
                                        input.id,

                                        sys_usuario_id:
                                        usuarioId,

                                        ativo: 1,

                                        created_at:
                                            new Date(),

                                        updated_at:
                                            new Date(),
                                    },

                                    update: {
                                        ativo: 1,

                                        updated_at:
                                            new Date(),
                                    },
                                });
                        }
                    },
                );

            const antigoLogoId =
                existente
                    .par_parceiro_tema
                    ?.logo_sys_arquivo_id ??
                null;

            const antigoBannerId =
                existente
                    .par_parceiro_tema
                    ?.banner_sys_arquivo_id ??
                null;

            if (
                antigoLogoId &&
                antigoLogoId !==
                logoFinalId
            ) {
                try {
                    await arquivoService
                        .marcarComoRemovido({
                            arquivoId:
                            antigoLogoId,
                        });
                } catch (
                    cleanupError
                    ) {
                    console.error(
                        "[parceiro.update.logo.cleanup]",
                        cleanupError,
                    );
                }
            }

            if (
                antigoBannerId &&
                antigoBannerId !==
                bannerFinalId
            ) {
                try {
                    await arquivoService
                        .marcarComoRemovido({
                            arquivoId:
                            antigoBannerId,
                        });
                } catch (
                    cleanupError
                    ) {
                    console.error(
                        "[parceiro.update.banner.cleanup]",
                        cleanupError,
                    );
                }
            }

            return this.findById(
                input.id,
            );
        } catch (error) {
            if (novoLogoId) {
                try {
                    await arquivoService
                        .marcarComoRemovido({
                            arquivoId:
                            novoLogoId,
                        });
                } catch (
                    cleanupError
                    ) {
                    console.error(
                        "[parceiro.update.new-logo.cleanup]",
                        cleanupError,
                    );
                }
            }

            if (novoBannerId) {
                try {
                    await arquivoService
                        .marcarComoRemovido({
                            arquivoId:
                            novoBannerId,
                        });
                } catch (
                    cleanupError
                    ) {
                    console.error(
                        "[parceiro.update.new-banner.cleanup]",
                        cleanupError,
                    );
                }
            }

            throw error;
        }
    }


    async setAtivo(
        id: number,
        ativo: boolean,
    ) {
        const existente =
            await prisma
                .parParceiro
                .findFirst({
                    where: {
                        id,
                        deleted_at:
                            null,
                    },

                    select: {
                        id: true,
                    },
                });

        if (!existente) {
            throw new Error(
                "Parceiro não encontrado.",
            );
        }

        await prisma
            .parParceiro
            .update({
                where: {
                    id,
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

        return this.findById(
            id,
        );
    }


    async softDelete(
        id: number,
    ) {
        const parceiro =
            await prisma
                .parParceiro
                .findFirst({
                    where: {
                        id,

                        deleted_at:
                            null,
                    },

                    select: {
                        id: true,

                        par_parceiro_tema:
                            {
                                select: {
                                    logo_sys_arquivo_id:
                                        true,

                                    banner_sys_arquivo_id:
                                        true,
                                },
                            },
                    },
                });

        if (!parceiro) {
            throw new Error(
                "Parceiro não encontrado.",
            );
        }

        const now =
            new Date();

        await prisma
            .$transaction(
                async (tx) => {
                    await tx
                        .parParceiroUsuario
                        .updateMany({
                            where: {
                                par_parceiro_id:
                                id,
                            },

                            data: {
                                ativo: 0,

                                updated_at:
                                now,
                            },
                        });

                    await tx
                        .parParceiroTema
                        .updateMany({
                            where: {
                                par_parceiro_id:
                                id,
                            },

                            data: {
                                ativo: 0,

                                updated_at:
                                now,
                            },
                        });

                    await tx
                        .parParceiro
                        .update({
                            where: {
                                id,
                            },

                            data: {
                                ativo: 0,

                                visivel_publico:
                                    0,

                                deleted_at:
                                now,

                                updated_at:
                                now,
                            },
                        });
                },
            );

        const arquivos = [
            parceiro
                .par_parceiro_tema
                ?.logo_sys_arquivo_id,

            parceiro
                .par_parceiro_tema
                ?.banner_sys_arquivo_id,
        ].filter(
            (
                arquivoId,
            ): arquivoId is number =>
                Boolean(
                    arquivoId,
                ),
        );

        for (
            const arquivoId of
            arquivos
            ) {
            try {
                await arquivoService
                    .marcarComoRemovido({
                        arquivoId,
                    });
            } catch (
                cleanupError
                ) {
                console.error(
                    "[parceiro.delete.file.cleanup]",
                    {
                        parceiroId:
                        id,

                        arquivoId,

                        cleanupError,
                    },
                );
            }
        }

        return {
            id,
        };
    }


    async findById(
        id: number,
    ) {
        const parceiro =
            await prisma
                .parParceiro
                .findFirst({
                    where: {
                        id,

                        deleted_at:
                            null,
                    },

                    select:
                    parceiroSelect,
                });

        return parceiro
            ? serializeParceiro(
                parceiro,
            )
            : null;
    }
}


export const parceiroService =
    new ParceiroService();