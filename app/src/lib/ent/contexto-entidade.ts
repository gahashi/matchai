import { prisma } from "@/lib/prisma";

export type EntidadeAcessivel = {
    id: number;
    nome: string;
    apelido: string | null;
    sigla: string;
    slug: string;
    logoUrl: string | null;

    tipo: {
        codigo: string;
        nome: string;
    };

    status: {
        codigo: string;
        nome: string;
        color: string | null;
        icon: string | null;
    };

    instituicao: {
        id: number;
        nome: string;
        abreviacao: string | null;
    };

    vinculo: {
        tipoCodigo: string | null;
        tipoNome: string | null;
        statusCodigo: string | null;
        statusNome: string | null;
    } | null;
};

type ListarEntidadesAcessiveisInput = {
    sysUsuarioId: number;
    podeVisualizarTodas?: boolean;
};

type ResolverEntidadeAcessivelInput = {
    sysUsuarioId: number;
    slug: string;
    podeVisualizarTodas?: boolean;
};

const entidadeSelect = {
    id: true,
    nome: true,
    apelido: true,
    sigla: true,
    slug: true,
    logo_url: true,

    ent_entidade_tipo: {
        select: {
            codigo: true,
            nome: true,
        },
    },

    ent_entidade_status: {
        select: {
            codigo: true,
            nome: true,
            color: true,
            icon: true,
        },
    },

    edu_instituicao: {
        select: {
            id: true,
            nome: true,
            abreviacao: true,
        },
    },
} as const;

function mapEntidade(
    entidade: {
        id: number;
        nome: string;
        apelido: string | null;
        sigla: string;
        slug: string;
        logo_url: string | null;

        ent_entidade_tipo: {
            codigo: string;
            nome: string;
        };

        ent_entidade_status: {
            codigo: string;
            nome: string;
            color: string | null;
            icon: string | null;
        };

        edu_instituicao: {
            id: number;
            nome: string;
            abreviacao: string | null;
        };
    },
    vinculo: EntidadeAcessivel["vinculo"]
): EntidadeAcessivel {
    return {
        id: entidade.id,
        nome: entidade.nome,
        apelido: entidade.apelido,
        sigla: entidade.sigla,
        slug: entidade.slug,
        logoUrl: entidade.logo_url,

        tipo: {
            codigo:
            entidade.ent_entidade_tipo.codigo,
            nome:
            entidade.ent_entidade_tipo.nome,
        },

        status: {
            codigo:
            entidade.ent_entidade_status.codigo,
            nome:
            entidade.ent_entidade_status.nome,
            color:
            entidade.ent_entidade_status.color,
            icon:
            entidade.ent_entidade_status.icon,
        },

        instituicao: {
            id: entidade.edu_instituicao.id,
            nome: entidade.edu_instituicao.nome,
            abreviacao:
            entidade.edu_instituicao.abreviacao,
        },

        vinculo,
    };
}

export const contextoEntidadeService = {
    async listarEntidadesAcessiveis({
                                        sysUsuarioId,
                                        podeVisualizarTodas = false,
                                    }: ListarEntidadesAcessiveisInput): Promise<
        EntidadeAcessivel[]
    > {
        if (podeVisualizarTodas) {
            const entidades =
                await prisma.entEntidade.findMany({
                    where: {
                        ativo: 1,
                        deleted_at: null,
                    },
                    select: entidadeSelect,
                    orderBy: [
                        {
                            apelido: "asc",
                        },
                        {
                            nome: "asc",
                        },
                    ],
                });

            return entidades.map((entidade) =>
                mapEntidade(entidade, null)
            );
        }

        const vinculos =
            await prisma.entEntidadeMembro.findMany({
                where: {
                    sys_usuario_id: sysUsuarioId,
                    ativo: 1,
                    deleted_at: null,

                    ent_entidade_membro_status: {
                        codigo: "ativo",
                        ativo: 1,
                    },

                    ent_entidade: {
                        ativo: 1,
                        deleted_at: null,
                    },
                },

                select: {
                    ent_entidade_membro_tipo: {
                        select: {
                            codigo: true,
                            nome: true,
                        },
                    },

                    ent_entidade_membro_status: {
                        select: {
                            codigo: true,
                            nome: true,
                        },
                    },

                    ent_entidade: {
                        select: entidadeSelect,
                    },
                },

                orderBy: [
                    {
                        ent_entidade: {
                            apelido: "asc",
                        },
                    },
                    {
                        ent_entidade: {
                            nome: "asc",
                        },
                    },
                ],
            });

        return vinculos.map((vinculo) =>
            mapEntidade(
                vinculo.ent_entidade,
                {
                    tipoCodigo:
                    vinculo
                        .ent_entidade_membro_tipo
                        .codigo,
                    tipoNome:
                    vinculo
                        .ent_entidade_membro_tipo
                        .nome,
                    statusCodigo:
                    vinculo
                        .ent_entidade_membro_status
                        .codigo,
                    statusNome:
                    vinculo
                        .ent_entidade_membro_status
                        .nome,
                }
            )
        );
    },

    async resolverEntidadeAcessivel({
                                        sysUsuarioId,
                                        slug,
                                        podeVisualizarTodas = false,
                                    }: ResolverEntidadeAcessivelInput): Promise<
        EntidadeAcessivel | null
    > {
        const slugNormalizado =
            slug.trim().toLowerCase();

        if (!slugNormalizado) {
            return null;
        }

        if (podeVisualizarTodas) {
            const entidade =
                await prisma.entEntidade.findFirst({
                    where: {
                        slug: slugNormalizado,
                        ativo: 1,
                        deleted_at: null,
                    },
                    select: entidadeSelect,
                });

            return entidade
                ? mapEntidade(entidade, null)
                : null;
        }

        const vinculo =
            await prisma.entEntidadeMembro.findFirst({
                where: {
                    sys_usuario_id: sysUsuarioId,
                    ativo: 1,
                    deleted_at: null,

                    ent_entidade_membro_status: {
                        codigo: "ativo",
                        ativo: 1,
                    },

                    ent_entidade: {
                        slug: slugNormalizado,
                        ativo: 1,
                        deleted_at: null,
                    },
                },

                select: {
                    ent_entidade_membro_tipo: {
                        select: {
                            codigo: true,
                            nome: true,
                        },
                    },

                    ent_entidade_membro_status: {
                        select: {
                            codigo: true,
                            nome: true,
                        },
                    },

                    ent_entidade: {
                        select: entidadeSelect,
                    },
                },
            });

        if (!vinculo) {
            return null;
        }

        return mapEntidade(
            vinculo.ent_entidade,
            {
                tipoCodigo:
                vinculo
                    .ent_entidade_membro_tipo
                    .codigo,
                tipoNome:
                vinculo
                    .ent_entidade_membro_tipo
                    .nome,
                statusCodigo:
                vinculo
                    .ent_entidade_membro_status
                    .codigo,
                statusNome:
                vinculo
                    .ent_entidade_membro_status
                    .nome,
            }
        );
    },
};