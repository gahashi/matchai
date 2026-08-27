import { prisma } from "@/lib/prisma";
import { arquivoService } from "@/lib/storage/arquivo-service";

type PlanoWriteInput = {
    prdProdutoId?: number | null;
    codigo: string;
    nome: string;
    descricao?: string | null;
    duracaoDias: number;
    ativo: boolean;
    visivelPublico: boolean;
    inicioExibicao?: Date | null;
    fimExibicao?: Date | null;
    exibirAposEncerramento: boolean;
};

type CreatePlanoInput = PlanoWriteInput & {
    banner?: File | null;
    createdBySysUsuarioId: number;
};

type UpdatePlanoInput = PlanoWriteInput & {
    id: number;
    banner?: File | null;
    removerBanner: boolean;
    updatedBySysUsuarioId: number;
};

type PlanoStatus =
    | "ativo"
    | "inativo"
    | "oculto"
    | "agendado"
    | "encerrado";

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
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/-{2,}/g, "-")
        .replace(/^-|-$/g, "");
}

function validatePlanoInput(
    input: PlanoWriteInput,
) {
    const codigo =
        normalizeCodigo(
            input.codigo,
        );

    if (codigo.length < 2) {
        throw new Error(
            "Informe um código válido para o plano.",
        );
    }

    if (
        input.nome.trim().length < 2
    ) {
        throw new Error(
            "Informe o nome do plano.",
        );
    }

    if (
        !Number.isInteger(
            input.duracaoDias,
        ) ||
        input.duracaoDias < 1
    ) {
        throw new Error(
            "A duração do plano precisa ser de pelo menos 1 dia.",
        );
    }

    if (
        input.inicioExibicao &&
        input.fimExibicao &&
        input.fimExibicao <
        input.inicioExibicao
    ) {
        throw new Error(
            "O fim da exibição não pode ser anterior ao início.",
        );
    }
}

function getPlanoStatus(
    plano: {
        ativo: number;
        visivel_publico: number;
        inicio_exibicao: Date | null;
        fim_exibicao: Date | null;
    },
): PlanoStatus {
    const now = new Date();

    if (!plano.ativo) {
        return "inativo";
    }

    if (!plano.visivel_publico) {
        return "oculto";
    }

    if (
        plano.inicio_exibicao &&
        plano.inicio_exibicao > now
    ) {
        return "agendado";
    }

    if (
        plano.fim_exibicao &&
        plano.fim_exibicao < now
    ) {
        return "encerrado";
    }

    return "ativo";
}

function getProdutoStatus(
    produto: {
        ativo: number;
        visivel_publico: number;
        inicio_exibicao: Date | null;
        fim_exibicao: Date | null;
    },
): PlanoStatus {
    const now = new Date();

    if (!produto.ativo) {
        return "inativo";
    }

    if (!produto.visivel_publico) {
        return "oculto";
    }

    if (
        produto.inicio_exibicao &&
        produto.inicio_exibicao > now
    ) {
        return "agendado";
    }

    if (
        produto.fim_exibicao &&
        produto.fim_exibicao < now
    ) {
        return "encerrado";
    }

    return "ativo";
}

const produtoAssociacaoSelect = {
    id: true,
    codigo: true,
    nome: true,
    preco_normal: true,
    ativo: true,
    visivel_publico: true,
    inicio_exibicao: true,
    fim_exibicao: true,

    prd_produto_tipo: {
        select: {
            codigo: true,
            nome: true,
        },
    },

    prd_produto_imagens: {
        where: {
            principal: 1,
        },
        orderBy: {
            ordem: "asc" as const,
        },
        take: 1,
        select: {
            id: true,
            sys_arquivo_id: true,
            sys_arquivo: {
                select: {
                    public_url: true,
                },
            },
        },
    },
};

const planoSelect = {
    id: true,
    prd_produto_id: true,
    banner_sys_arquivo_id: true,
    codigo: true,
    nome: true,
    descricao: true,
    duracao_dias: true,
    ativo: true,
    visivel_publico: true,
    inicio_exibicao: true,
    fim_exibicao: true,
    exibir_apos_encerramento: true,
    created_at: true,
    updated_at: true,

    banner_sys_arquivo: {
        select: {
            id: true,
            public_url: true,
            original_name: true,
            mime_type: true,
        },
    },

    prd_produto: {
        select:
        produtoAssociacaoSelect,
    },
};

function serializeProduto(
    produto: any,
) {
    const imagem =
        produto
            .prd_produto_imagens?.[0] ??
        null;

    return {
        id: produto.id,
        codigo: produto.codigo,
        nome: produto.nome,

        preco_normal:
            Number(
                produto.preco_normal,
            ),

        ativo:
        produto.ativo,

        visivel_publico:
        produto.visivel_publico,

        status:
            getProdutoStatus(
                produto,
            ),

        imagem_principal:
            imagem
                ? {
                    prd_produto_imagem_id:
                    imagem.id,

                    sys_arquivo_id:
                    imagem.sys_arquivo_id,

                    public_url:
                        imagem
                            .sys_arquivo
                            ?.public_url ??
                        null,
                }
                : null,
    };
}

function serializePlano(
    plano: any,
) {
    return {
        id: plano.id,
        prd_produto_id:
        plano.prd_produto_id,
        banner_sys_arquivo_id:
        plano.banner_sys_arquivo_id,
        codigo: plano.codigo,
        nome: plano.nome,
        descricao:
        plano.descricao,
        duracao_dias:
        plano.duracao_dias,
        ativo: plano.ativo,
        visivel_publico:
        plano.visivel_publico,
        inicio_exibicao:
        plano.inicio_exibicao,
        fim_exibicao:
        plano.fim_exibicao,
        exibir_apos_encerramento:
        plano
            .exibir_apos_encerramento,
        created_at:
        plano.created_at,
        updated_at:
        plano.updated_at,
        status:
            getPlanoStatus(
                plano,
            ),

        banner:
            plano.banner_sys_arquivo
                ? {
                    id:
                    plano
                        .banner_sys_arquivo
                        .id,
                    public_url:
                    plano
                        .banner_sys_arquivo
                        .public_url,
                    original_name:
                    plano
                        .banner_sys_arquivo
                        .original_name,
                    mime_type:
                    plano
                        .banner_sys_arquivo
                        .mime_type,
                }
                : null,

        prd_produto:
            plano.prd_produto
                ? serializeProduto(
                    plano.prd_produto,
                )
                : null,
    };
}

class PlanoService {
    async listAdminData() {
        const [
            planos,
            produtosAssociacao,
        ] =
            await Promise.all([
                prisma.socPlano.findMany({
                    where: {
                        deleted_at: null,
                    },
                    select:
                    planoSelect,
                    orderBy: [
                        {
                            ativo: "desc",
                        },
                        {
                            nome: "asc",
                        },
                        {
                            id: "desc",
                        },
                    ],
                }),

                prisma.prdProduto.findMany({
                    where: {
                        deleted_at: null,
                        prd_produto_tipo: {
                            codigo:
                                "associacao",
                        },
                    },
                    select:
                    produtoAssociacaoSelect,
                    orderBy: [
                        {
                            ativo: "desc",
                        },
                        {
                            nome: "asc",
                        },
                    ],
                }),
            ]);

        return {
            planos:
                planos.map(
                    serializePlano,
                ),

            produtosAssociacao:
                produtosAssociacao.map(
                    serializeProduto,
                ),
        };
    }

    async create(
        input: CreatePlanoInput,
    ) {
        validatePlanoInput(
            input,
        );

        const codigo =
            normalizeCodigo(
                input.codigo,
            );

        await this.ensureCodigoDisponivel(
            codigo,
        );

        await this.ensureProdutoAssociacaoDisponivel(
            input.prdProdutoId ??
            null,
        );

        const plano =
            await prisma.socPlano.create({
                data: {
                    prd_produto_id:
                        input.prdProdutoId ??
                        null,
                    codigo,
                    nome:
                        input.nome.trim(),
                    descricao:
                        normalizeOptional(
                            input.descricao,
                        ),
                    duracao_dias:
                    input.duracaoDias,
                    ativo:
                        input.ativo
                            ? 1
                            : 0,
                    visivel_publico:
                        input.visivelPublico
                            ? 1
                            : 0,
                    inicio_exibicao:
                        input.inicioExibicao ??
                        null,
                    fim_exibicao:
                        input.fimExibicao ??
                        null,
                    exibir_apos_encerramento:
                        input.exibirAposEncerramento
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

        let novoArquivoId:
            number | null =
            null;

        try {
            if (input.banner) {
                const upload =
                    await arquivoService
                        .uploadPublicImage({
                            file:
                            input.banner,
                            folder:
                                `planos-socio/${plano.id}`,
                            filenamePrefix:
                                "plano-banner",
                            tipoCodigo:
                                "plano_socio_banner",
                            createdBySysUsuarioId:
                            input
                                .createdBySysUsuarioId,
                        });

                novoArquivoId =
                    upload.arquivo.id;

                await prisma.socPlano.update({
                    where: {
                        id:
                        plano.id,
                    },
                    data: {
                        banner_sys_arquivo_id:
                        novoArquivoId,
                        updated_at:
                            new Date(),
                    },
                });
            }

            return this.findById(
                plano.id,
            );
        } catch (error) {
            if (novoArquivoId) {
                await arquivoService
                    .marcarComoRemovido({
                        arquivoId:
                        novoArquivoId,
                    });
            }

            await prisma.socPlano.delete({
                where: {
                    id:
                    plano.id,
                },
            });

            throw error;
        }
    }

    async update(
        input: UpdatePlanoInput,
    ) {
        validatePlanoInput(
            input,
        );

        const existente =
            await prisma.socPlano.findFirst({
                where: {
                    id:
                    input.id,
                    deleted_at:
                        null,
                },
                select: {
                    id: true,
                    banner_sys_arquivo_id:
                        true,
                },
            });

        if (!existente) {
            throw new Error(
                "Plano de sócio não encontrado.",
            );
        }

        const codigo =
            normalizeCodigo(
                input.codigo,
            );

        await this.ensureCodigoDisponivel(
            codigo,
            input.id,
        );

        await this.ensureProdutoAssociacaoDisponivel(
            input.prdProdutoId ??
            null,
            input.id,
        );

        let novoArquivoId:
            number | null =
            null;

        try {
            if (input.banner) {
                const upload =
                    await arquivoService
                        .uploadPublicImage({
                            file:
                            input.banner,
                            folder:
                                `planos-socio/${input.id}`,
                            filenamePrefix:
                                "plano-banner",
                            tipoCodigo:
                                "plano_socio_banner",
                            createdBySysUsuarioId:
                            input
                                .updatedBySysUsuarioId,
                        });

                novoArquivoId =
                    upload.arquivo.id;
            }

            const deveRemoverBanner =
                input.removerBanner ||
                Boolean(
                    novoArquivoId,
                );

            await prisma.socPlano.update({
                where: {
                    id:
                    input.id,
                },
                data: {
                    prd_produto_id:
                        input.prdProdutoId ??
                        null,
                    codigo,
                    nome:
                        input.nome.trim(),
                    descricao:
                        normalizeOptional(
                            input.descricao,
                        ),
                    duracao_dias:
                    input.duracaoDias,
                    ativo:
                        input.ativo
                            ? 1
                            : 0,
                    visivel_publico:
                        input.visivelPublico
                            ? 1
                            : 0,
                    inicio_exibicao:
                        input.inicioExibicao ??
                        null,
                    fim_exibicao:
                        input.fimExibicao ??
                        null,
                    exibir_apos_encerramento:
                        input.exibirAposEncerramento
                            ? 1
                            : 0,
                    banner_sys_arquivo_id:
                        novoArquivoId ??
                        (
                            input.removerBanner
                                ? null
                                : existente
                                    .banner_sys_arquivo_id
                        ),
                    updated_at:
                        new Date(),
                },
            });

            if (
                deveRemoverBanner &&
                existente
                    .banner_sys_arquivo_id &&
                existente
                    .banner_sys_arquivo_id !==
                novoArquivoId
            ) {
                await arquivoService
                    .marcarComoRemovido({
                        arquivoId:
                        existente
                            .banner_sys_arquivo_id,
                    });
            }

            return this.findById(
                input.id,
            );
        } catch (error) {
            if (novoArquivoId) {
                await arquivoService
                    .marcarComoRemovido({
                        arquivoId:
                        novoArquivoId,
                    });
            }

            throw error;
        }
    }

    async setAtivo(
        id: number,
        ativo: boolean,
    ) {
        const existente =
            await prisma.socPlano.findFirst({
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
                "Plano de sócio não encontrado.",
            );
        }

        await prisma.socPlano.update({
            where: {
                id,
            },
            data: {
                ativo:
                    ativo ? 1 : 0,
                updated_at:
                    new Date(),
            },
        });

        return this.findById(id);
    }

    async softDelete(
        id: number,
    ) {
        const existente =
            await prisma.socPlano.findFirst({
                where: {
                    id,
                    deleted_at:
                        null,
                },
                select: {
                    id: true,
                    banner_sys_arquivo_id:
                        true,
                },
            });

        if (!existente) {
            throw new Error(
                "Plano de sócio não encontrado.",
            );
        }

        const now =
            new Date();

        await prisma.socPlano.update({
            where: {
                id,
            },
            data: {
                ativo: 0,
                visivel_publico: 0,
                deleted_at:
                now,
                updated_at:
                now,
            },
        });

        if (
            existente
                .banner_sys_arquivo_id
        ) {
            await arquivoService
                .marcarComoRemovido({
                    arquivoId:
                    existente
                        .banner_sys_arquivo_id,
                });
        }

        return {
            id,
        };
    }

    async findById(
        id: number,
    ) {
        const plano =
            await prisma.socPlano.findFirst({
                where: {
                    id,
                    deleted_at:
                        null,
                },
                select:
                planoSelect,
            });

        return plano
            ? serializePlano(
                plano,
            )
            : null;
    }

    private async ensureCodigoDisponivel(
        codigo: string,
        ignoreId?: number,
    ) {
        const existente =
            await prisma.socPlano.findFirst({
                where: {
                    codigo,
                    ...(ignoreId
                        ? {
                            id: {
                                not:
                                ignoreId,
                            },
                        }
                        : {}),
                },
                select: {
                    id: true,
                    deleted_at:
                        true,
                },
            });

        if (existente) {
            throw new Error(
                "Já existe um plano com este código.",
            );
        }
    }

    private async ensureProdutoAssociacaoDisponivel(
        prdProdutoId:
            | number
            | null,
        ignorePlanoId?: number,
    ) {
        if (!prdProdutoId) {
            return;
        }

        const produto =
            await prisma.prdProduto.findFirst({
                where: {
                    id:
                    prdProdutoId,
                    deleted_at:
                        null,
                    prd_produto_tipo: {
                        codigo:
                            "associacao",
                    },
                },
                select: {
                    id: true,
                },
            });

        if (!produto) {
            throw new Error(
                "Selecione um produto válido do tipo Associação.",
            );
        }

        const usoExistente =
            await prisma.socPlano.findFirst({
                where: {
                    prd_produto_id:
                    prdProdutoId,
                    deleted_at:
                        null,
                    ...(ignorePlanoId
                        ? {
                            id: {
                                not:
                                ignorePlanoId,
                            },
                        }
                        : {}),
                },
                select: {
                    id: true,
                    nome: true,
                },
            });

        if (usoExistente) {
            throw new Error(
                `Este produto já está associado ao plano "${usoExistente.nome}".`,
            );
        }
    }
}

export const planoService =
    new PlanoService();
