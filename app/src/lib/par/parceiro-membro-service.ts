import {
    prisma,
} from "@/lib/prisma";


export type ParceiroMembroTipoCodigo =
    | "proprietario"
    | "administrador"
    | "membro";


const membroSelect = {
    id: true,

    par_parceiro_id:
        true,

    sys_usuario_id:
        true,

    ativo:
        true,

    par_parceiro_usuario_tipo: {
        select: {
            id: true,
            codigo: true,
            nome: true,
            descricao: true,
        },
    },

    sys_usuario: {
        select: {
            id: true,
            nome: true,
            nickname: true,
            email: true,

            avatar_sys_arquivo: {
                select: {
                    public_url: true,
                },
            },
        },
    },
} as const;


function isTipoCodigo(
    value: string,
): value is ParceiroMembroTipoCodigo {
    return [
        "proprietario",
        "administrador",
        "membro",
    ].includes(
        value,
    );
}


export function podeGerenciarMembros(
    tipoCodigo: string,
) {
    return (
        tipoCodigo ===
        "proprietario" ||
        tipoCodigo ===
        "administrador"
    );
}


function serializeMembro(
    vinculo: any,
) {
    return {
        id:
            vinculo.id,

        ativo:
            Boolean(
                vinculo.ativo,
            ),

        tipo: {
            id:
                vinculo
                    .par_parceiro_usuario_tipo
                    .id,

            codigo:
                vinculo
                    .par_parceiro_usuario_tipo
                    .codigo,

            nome:
                vinculo
                    .par_parceiro_usuario_tipo
                    .nome,
        },

        usuario: {
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

            avatar_url:
                vinculo
                    .sys_usuario
                    .avatar_sys_arquivo
                    ?.public_url ??
                null,
        },
    };
}


class ParceiroMembroService {
    private async getActor(
        parceiroId: number,
        actorSysUsuarioId: number,
    ) {
        const actor =
            await prisma
                .parParceiroUsuario
                .findFirst({
                    where: {
                        par_parceiro_id:
                            parceiroId,

                        sys_usuario_id:
                            actorSysUsuarioId,

                        ativo: 1,

                        par_parceiro: {
                            ativo: 1,
                            deleted_at:
                                null,
                        },
                    },

                    select: {
                        id: true,

                        par_parceiro_usuario_tipo: {
                            select: {
                                id: true,
                                codigo: true,
                                nome: true,
                            },
                        },
                    },
                });

        if (!actor) {
            throw new Error(
                "Você não possui acesso a este parceiro.",
            );
        }

        return actor;
    }


    private async getTipo(
        codigoValue: string,
    ) {
        const codigo =
            codigoValue
                .trim()
                .toLowerCase();

        if (
            !isTipoCodigo(
                codigo,
            )
        ) {
            throw new Error(
                "Tipo de acesso inválido.",
            );
        }

        const tipo =
            await prisma
                .parParceiroUsuarioTipo
                .findFirst({
                    where: {
                        codigo,
                        ativo: 1,
                    },

                    select: {
                        id: true,
                        codigo: true,
                        nome: true,
                    },
                });

        if (!tipo) {
            throw new Error(
                "Tipo de acesso não encontrado.",
            );
        }

        return tipo;
    }


    async listParceiroMembrosData(
        parceiroId: number,
    ) {
        const [
            tipos,
            membros,
        ] =
            await Promise.all([
                prisma
                    .parParceiroUsuarioTipo
                    .findMany({
                        where: {
                            ativo: 1,
                        },

                        select: {
                            id: true,
                            codigo: true,
                            nome: true,
                            descricao: true,
                        },

                        orderBy: {
                            id:
                                "asc",
                        },
                    }),

                prisma
                    .parParceiroUsuario
                    .findMany({
                        where: {
                            par_parceiro_id:
                                parceiroId,

                            ativo: 1,
                        },

                        select:
                            membroSelect,

                        orderBy: [
                            {
                                par_parceiro_usuario_tipo: {
                                    id:
                                        "asc",
                                },
                            },
                            {
                                sys_usuario: {
                                    nome:
                                        "asc",
                                },
                            },
                        ],
                    }),
            ]);

        return {
            tipos:
                tipos.filter(
                    (
                        tipo,
                    ) =>
                        isTipoCodigo(
                            tipo.codigo,
                        ),
                ),

            membros:
                membros.map(
                    serializeMembro,
                ),
        };
    }


    async add(
        input: {
            parceiroId: number;
            actorSysUsuarioId: number;
            sysUsuarioId: number;
            tipoCodigo: string;
        },
    ) {
        const actor =
            await this.getActor(
                input.parceiroId,
                input.actorSysUsuarioId,
            );

        const actorTipo =
            actor
                .par_parceiro_usuario_tipo
                .codigo;

        if (
            !podeGerenciarMembros(
                actorTipo,
            )
        ) {
            throw new Error(
                "Você não possui permissão para adicionar membros.",
            );
        }

        const tipo =
            await this.getTipo(
                input.tipoCodigo,
            );

        if (
            actorTipo ===
                "administrador" &&
            tipo.codigo !==
                "membro"
        ) {
            throw new Error(
                "Administradores podem adicionar apenas membros comuns.",
            );
        }

        const usuario =
            await prisma
                .sysUsuario
                .findFirst({
                    where: {
                        id:
                            input.sysUsuarioId,

                        ativo: 1,
                        deleted_at:
                            null,
                    },

                    select: {
                        id: true,
                    },
                });

        if (!usuario) {
            throw new Error(
                "Usuário não encontrado.",
            );
        }

        const existente =
            await prisma
                .parParceiroUsuario
                .findUnique({
                    where: {
                        par_parceiro_id_sys_usuario_id:
                            {
                                par_parceiro_id:
                                    input.parceiroId,

                                sys_usuario_id:
                                    input.sysUsuarioId,
                            },
                    },

                    select: {
                        id: true,
                        ativo: true,
                    },
                });

        if (
            existente &&
            Boolean(
                existente.ativo,
            )
        ) {
            throw new Error(
                "Este usuário já possui acesso ao parceiro.",
            );
        }

        const vinculo =
            existente
                ? await prisma
                    .parParceiroUsuario
                    .update({
                        where: {
                            id:
                                existente.id,
                        },

                        data: {
                            par_parceiro_usuario_tipo_id:
                                tipo.id,

                            ativo: 1,

                            updated_at:
                                new Date(),
                        },

                        select:
                            membroSelect,
                    })
                : await prisma
                    .parParceiroUsuario
                    .create({
                        data: {
                            par_parceiro_id:
                                input.parceiroId,

                            sys_usuario_id:
                                input.sysUsuarioId,

                            par_parceiro_usuario_tipo_id:
                                tipo.id,

                            ativo: 1,

                            created_at:
                                new Date(),

                            updated_at:
                                new Date(),
                        },

                        select:
                            membroSelect,
                    });

        return serializeMembro(
            vinculo,
        );
    }


    async updateTipo(
        input: {
            parceiroId: number;
            actorSysUsuarioId: number;
            vinculoId: number;
            tipoCodigo: string;
        },
    ) {
        const actor =
            await this.getActor(
                input.parceiroId,
                input.actorSysUsuarioId,
            );

        if (
            actor
                .par_parceiro_usuario_tipo
                .codigo !==
            "proprietario"
        ) {
            throw new Error(
                "Somente proprietários podem alterar o nível de acesso dos membros.",
            );
        }

        const tipo =
            await this.getTipo(
                input.tipoCodigo,
            );

        const atualizado =
            await prisma
                .$transaction(
                    async (
                        tx,
                    ) => {
                        const alvo =
                            await tx
                                .parParceiroUsuario
                                .findFirst({
                                    where: {
                                        id:
                                            input.vinculoId,

                                        par_parceiro_id:
                                            input.parceiroId,

                                        ativo: 1,
                                    },

                                    select: {
                                        id: true,

                                        par_parceiro_usuario_tipo: {
                                            select: {
                                                codigo: true,
                                            },
                                        },
                                    },
                                });

                        if (!alvo) {
                            throw new Error(
                                "Membro não encontrado.",
                            );
                        }

                        const eraProprietario =
                            alvo
                                .par_parceiro_usuario_tipo
                                .codigo ===
                            "proprietario";

                        const deixaraDeSerProprietario =
                            eraProprietario &&
                            tipo.codigo !==
                                "proprietario";

                        if (
                            deixaraDeSerProprietario
                        ) {
                            const proprietarios =
                                await tx
                                    .parParceiroUsuario
                                    .count({
                                        where: {
                                            par_parceiro_id:
                                                input.parceiroId,

                                            ativo: 1,

                                            par_parceiro_usuario_tipo: {
                                                codigo:
                                                    "proprietario",
                                            },
                                        },
                                    });

                            if (
                                proprietarios <=
                                1
                            ) {
                                throw new Error(
                                    "O parceiro precisa manter pelo menos um proprietário.",
                                );
                            }
                        }

                        return tx
                            .parParceiroUsuario
                            .update({
                                where: {
                                    id:
                                        alvo.id,
                                },

                                data: {
                                    par_parceiro_usuario_tipo_id:
                                        tipo.id,

                                    updated_at:
                                        new Date(),
                                },

                                select:
                                    membroSelect,
                            });
                    },
                );

        return serializeMembro(
            atualizado,
        );
    }


    async remove(
        input: {
            parceiroId: number;
            actorSysUsuarioId: number;
            vinculoId: number;
        },
    ) {
        const actor =
            await this.getActor(
                input.parceiroId,
                input.actorSysUsuarioId,
            );

        const actorTipo =
            actor
                .par_parceiro_usuario_tipo
                .codigo;

        if (
            !podeGerenciarMembros(
                actorTipo,
            )
        ) {
            throw new Error(
                "Você não possui permissão para remover membros.",
            );
        }

        await prisma
            .$transaction(
                async (
                    tx,
                ) => {
                    const alvo =
                        await tx
                            .parParceiroUsuario
                            .findFirst({
                                where: {
                                    id:
                                        input.vinculoId,

                                    par_parceiro_id:
                                        input.parceiroId,

                                    ativo: 1,
                                },

                                select: {
                                    id: true,

                                    par_parceiro_usuario_tipo: {
                                        select: {
                                            codigo: true,
                                        },
                                    },
                                },
                            });

                    if (!alvo) {
                        throw new Error(
                            "Membro não encontrado.",
                        );
                    }

                    const alvoTipo =
                        alvo
                            .par_parceiro_usuario_tipo
                            .codigo;

                    if (
                        actorTipo ===
                            "administrador" &&
                        alvoTipo !==
                            "membro"
                    ) {
                        throw new Error(
                            "Administradores podem remover apenas membros comuns.",
                        );
                    }

                    if (
                        alvoTipo ===
                        "proprietario"
                    ) {
                        const proprietarios =
                            await tx
                                .parParceiroUsuario
                                .count({
                                    where: {
                                        par_parceiro_id:
                                            input.parceiroId,

                                        ativo: 1,

                                        par_parceiro_usuario_tipo: {
                                            codigo:
                                                "proprietario",
                                        },
                                    },
                                });

                        if (
                            proprietarios <=
                            1
                        ) {
                            throw new Error(
                                "Não é possível remover o último proprietário do parceiro.",
                            );
                        }
                    }

                    await tx
                        .parParceiroUsuario
                        .update({
                            where: {
                                id:
                                    alvo.id,
                            },

                            data: {
                                ativo: 0,

                                updated_at:
                                    new Date(),
                            },
                        });
                },
            );

        return {
            vinculo_id:
                input.vinculoId,
        };
    }
}


export const parceiroMembroService =
    new ParceiroMembroService();
