import { prisma } from "@/lib/prisma";

export type EntidadeAcessivel = {
    id: number;
    nome: string;
    apelido: string | null;
    sigla: string;
    slug: string;
    logoUrl: string | null;
    descricao: string | null;
    ativo: boolean;

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

export type ResolverEntidadeContextualResult =
    | {
    status: "allowed";
    entidade: EntidadeAcessivel;
}
    | {
    status: "forbidden";
}
    | {
    status: "not_found";
};

const entidadeSelect = {
    id: true,
    nome: true,
    apelido: true,
    sigla: true,
    slug: true,
    logo_url: true,
    descricao: true,
    ativo: true,

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

type EntidadeSelecionada = {
    id: number;
    nome: string;
    apelido: string | null;
    sigla: string;
    slug: string;
    logo_url: string | null;
    descricao: string | null;
    ativo: number;

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
};

function mapEntidade(
    entidade: EntidadeSelecionada,
    vinculo: EntidadeAcessivel["vinculo"]
): EntidadeAcessivel {
    return {
        id: entidade.id,
        nome: entidade.nome,
        apelido: entidade.apelido,
        sigla: entidade.sigla,
        slug: entidade.slug,
        logoUrl: entidade.logo_url,
        descricao: entidade.descricao,
        ativo: entidade.ativo === 1,

        tipo: {
            codigo:
            entidade
                .ent_entidade_tipo
                .codigo,
            nome:
            entidade
                .ent_entidade_tipo
                .nome,
        },

        status: {
            codigo:
            entidade
                .ent_entidade_status
                .codigo,
            nome:
            entidade
                .ent_entidade_status
                .nome,
            color:
            entidade
                .ent_entidade_status
                .color,
            icon:
            entidade
                .ent_entidade_status
                .icon,
        },

        instituicao: {
            id:
            entidade.edu_instituicao.id,
            nome:
            entidade
                .edu_instituicao
                .nome,
            abreviacao:
            entidade
                .edu_instituicao
                .abreviacao,
        },

        vinculo,
    };
}

function mapVinculo(vinculo: {
    ent_entidade_membro_tipo: {
        codigo: string;
        nome: string;
    };
    ent_entidade_membro_status: {
        codigo: string;
        nome: string;
    };
}): NonNullable<
    EntidadeAcessivel["vinculo"]
> {
    return {
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

                    select:
                    entidadeSelect,

                    orderBy: [
                        {
                            apelido: "asc",
                        },
                        {
                            nome: "asc",
                        },
                    ],
                });

            return entidades.map(
                (entidade) =>
                    mapEntidade(
                        entidade,
                        null
                    )
            );
        }

        const vinculos =
            await prisma
                .entEntidadeMembro
                .findMany({
                    where: {
                        sys_usuario_id:
                        sysUsuarioId,
                        ativo: 1,
                        deleted_at: null,

                        ent_entidade_membro_status:
                            {
                                codigo:
                                    "ativo",
                                ativo: 1,
                            },

                        ent_entidade: {
                            ativo: 1,
                            deleted_at:
                                null,
                        },
                    },

                    select: {
                        ent_entidade_membro_tipo:
                            {
                                select: {
                                    codigo:
                                        true,
                                    nome: true,
                                },
                            },

                        ent_entidade_membro_status:
                            {
                                select: {
                                    codigo:
                                        true,
                                    nome: true,
                                },
                            },

                        ent_entidade: {
                            select:
                            entidadeSelect,
                        },
                    },

                    orderBy: [
                        {
                            ent_entidade:
                                {
                                    apelido:
                                        "asc",
                                },
                        },
                        {
                            ent_entidade:
                                {
                                    nome:
                                        "asc",
                                },
                        },
                    ],
                });

        return vinculos.map(
            (vinculo) =>
                mapEntidade(
                    vinculo.ent_entidade,
                    mapVinculo(vinculo)
                )
        );
    },

    /**
     * Mantido para compatibilidade com
     * chamadas existentes.
     */
    async resolverEntidadeAcessivel({
                                        sysUsuarioId,
                                        slug,
                                        podeVisualizarTodas = false,
                                    }: ResolverEntidadeAcessivelInput): Promise<
        EntidadeAcessivel | null
    > {
        const resultado =
            await this
                .resolverEntidadeContextual({
                    sysUsuarioId,
                    slug,
                    podeVisualizarTodas,
                });

        return resultado.status ===
        "allowed"
            ? resultado.entidade
            : null;
    },

    async resolverEntidadeContextual({
                                         sysUsuarioId,
                                         slug,
                                         podeVisualizarTodas = false,
                                     }: ResolverEntidadeAcessivelInput): Promise<
        ResolverEntidadeContextualResult
    > {
        const slugNormalizado =
            slug.trim().toLowerCase();

        if (!slugNormalizado) {
            return {
                status: "not_found",
            };
        }

        /*
         * Primeiro verificamos a existência
         * real da entidade para diferenciar:
         *
         * - não encontrada;
         * - encontrada, mas sem acesso.
         *
         * deleted_at continua representando
         * remoção lógica e não deve ser exposto.
         */
        const entidade =
            await prisma.entEntidade
                .findFirst({
                    where: {
                        slug:
                        slugNormalizado,
                        deleted_at: null,
                    },

                    select:
                    entidadeSelect,
                });

        if (!entidade) {
            return {
                status: "not_found",
            };
        }

        if (podeVisualizarTodas) {
            return {
                status: "allowed",
                entidade:
                    mapEntidade(
                        entidade,
                        null
                    ),
            };
        }

        const vinculo =
            await prisma
                .entEntidadeMembro
                .findFirst({
                    where: {
                        ent_entidade_id:
                        entidade.id,
                        sys_usuario_id:
                        sysUsuarioId,
                        ativo: 1,
                        deleted_at: null,

                        ent_entidade_membro_status:
                            {
                                codigo:
                                    "ativo",
                                ativo: 1,
                            },
                    },

                    select: {
                        ent_entidade_membro_tipo:
                            {
                                select: {
                                    codigo:
                                        true,
                                    nome: true,
                                },
                            },

                        ent_entidade_membro_status:
                            {
                                select: {
                                    codigo:
                                        true,
                                    nome: true,
                                },
                            },
                    },
                });

        if (!vinculo) {
            return {
                status: "forbidden",
            };
        }

        return {
            status: "allowed",
            entidade:
                mapEntidade(
                    entidade,
                    mapVinculo(vinculo)
                ),
        };
    },
};