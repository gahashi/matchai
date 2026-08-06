import { headers } from "next/headers";

import { auth } from "@/lib/auth/auth";
import { AuthSession } from "@/lib/auth/auth-types";
import { prisma } from "@/lib/prisma";

type GetAuthSessionOptions = {
    headers?: Headers;
};

async function getBetterAuthSession(
    headersInput?: Headers
) {
    return auth.api.getSession({
        headers:
            headersInput ??
            (await headers()),
    });
}

export async function getAuthSession(
    options?: GetAuthSessionOptions
): Promise<AuthSession | null> {
    const betterSession =
        await getBetterAuthSession(
            options?.headers
        );

    if (!betterSession?.user?.id) {
        return null;
    }

    const authUser =
        await prisma.user.findUnique({
            where: {
                id: betterSession.user.id,
            },
            select: {
                id: true,
                sysUsuarioId: true,
            },
        });

    if (!authUser?.sysUsuarioId) {
        return null;
    }

    const usuario =
        await prisma.sysUsuario.findUnique({
            where: {
                id: authUser.sysUsuarioId,
            },

            select: {
                id: true,
                nome: true,
                nickname: true,
                email: true,
                avatar_url: true,
                ativo: true,
                deleted_at: true,

                ent_entidade_membro: {
                    where: {
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
                        ent_entidade_id: true,
                    },

                    orderBy: {
                        created_at: "asc",
                    },

                    take: 2,
                },
            },
        });

    if (
        !usuario ||
        usuario.ativo !== 1 ||
        usuario.deleted_at
    ) {
        return null;
    }

    const vinculosAtivos =
        usuario.ent_entidade_membro;

    /*
     * Compatibilidade temporária:
     *
     * - com uma única entidade, o contexto pode ser
     *   resolvido automaticamente;
     * - com múltiplas entidades, nenhuma deve ser
     *   escolhida arbitrariamente.
     */
    const entEntidadeId =
        vinculosAtivos.length === 1
            ? vinculosAtivos[0]
                .ent_entidade_id
            : null;

    return {
        user: {
            id: usuario.id,
            nome: usuario.nome,
            nickname: usuario.nickname,
            email: usuario.email,
            avatar_url:
            usuario.avatar_url,
        },

        ent_entidade_id:
        entEntidadeId,
    };
}