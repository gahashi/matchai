import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { AuthSession } from "@/lib/auth/auth-types";

type GetAuthSessionOptions = {
    headers?: Headers;
};

async function getBetterAuthSession(headersInput?: Headers) {
    return auth.api.getSession({
        headers: headersInput ?? (await headers()),
    });
}

export async function getAuthSession(
    options?: GetAuthSessionOptions
): Promise<AuthSession | null> {
    const betterSession = await getBetterAuthSession(options?.headers);

    if (!betterSession?.user?.id) {
        return null;
    }

    const authUser = await prisma.user.findUnique({
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

    const usuario = await prisma.sysUsuario.findUnique({
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
            atl_atletica_membro: {
                where: {
                    ativo: 1,
                    deleted_at: null,
                },
                select: {
                    atl_atletica_id: true,
                },
                take: 1,
            },
        },
    });

    if (!usuario || usuario.ativo !== 1 || usuario.deleted_at) {
        return null;
    }

    return {
        user: {
            id: usuario.id,
            nome: usuario.nome,
            nickname: usuario.nickname,
            email: usuario.email,
            avatar_url: usuario.avatar_url,
        },
        atl_atletica_id:
            usuario.atl_atletica_membro[0]?.atl_atletica_id ?? null,
    };
}