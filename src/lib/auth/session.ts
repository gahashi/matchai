import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AuthSession } from "@/lib/auth/auth-types";

const DEV_USER_EMAIL = "admin@bravapass.dev";

export async function getAuthSession(): Promise<AuthSession | null> {
    /**
     * Temporário:
     * Enquanto o login real não existe, usamos o usuário dev do seed.
     *
     * Depois vamos trocar isso por leitura de cookie/session token.
     */
    const authDevCookie = (await cookies()).get("bp_auth_dev")?.value;

    if (authDevCookie !== "1") {
        return null;
    }

    const usuario = await prisma.sysUsuario.findUnique({
        where: {
            email: DEV_USER_EMAIL,
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