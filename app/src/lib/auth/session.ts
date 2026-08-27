import { headers } from "next/headers";

import { auth } from "@/lib/auth/auth";
import { AuthSession } from "@/lib/auth/auth-types";
import { prisma } from "@/lib/prisma";

type GetAuthSessionOptions = {
    headers?: Headers;
};

async function getBetterAuthSession(
    headersInput?: Headers,
) {
    return auth.api.getSession({
        headers:
            headersInput ??
            (await headers()),
    });
}

export async function getAuthSession(
    options?: GetAuthSessionOptions,
): Promise<AuthSession | null> {
    const betterSession =
        await getBetterAuthSession(
            options?.headers,
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
                ativo: true,
                deleted_at: true,

                sys_usuario_tipo: {
                    select: {
                        codigo: true,
                        nome: true,
                        ativo: true,
                    },
                },

                avatar_sys_arquivo: {
                    select: {
                        public_url: true,
                    },
                },
            },
        });

    if (
        !usuario ||
        usuario.ativo !== 1 ||
        usuario.deleted_at ||
        usuario.sys_usuario_tipo.ativo !== 1
    ) {
        return null;
    }

    return {
        user: {
            id: usuario.id,
            nome: usuario.nome,
            nickname: usuario.nickname,
            email: usuario.email,
            avatar_url:
                usuario.avatar_sys_arquivo?.public_url ??
                null,

            sys_usuario_tipo: {
                codigo:
                usuario.sys_usuario_tipo.codigo,
                nome:
                usuario.sys_usuario_tipo.nome,
            },
        },
    };
}