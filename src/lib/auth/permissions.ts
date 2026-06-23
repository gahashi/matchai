import { prisma } from "@/lib/prisma";
import { AuthSession } from "@/lib/auth/auth-types";

export async function userHasPermission(
    session: AuthSession,
    permissionCode: string
): Promise<boolean> {
    const sysUsuarioId = session.user.id;
    const atlAtleticaId = session.atl_atletica_id ?? null;

    /**
     * 1. Verifica DENY direto.
     * Se tiver deny direto, bloqueia mesmo que a role permita.
     */
    const directDeny = await prisma.sysUsuarioPermission.findFirst({
        where: {
            sys_usuario_id: sysUsuarioId,
            ativo: 1,
            deleted_at: null,
            sys_permission: {
                codigo: permissionCode,
                ativo: 1,
            },
            sys_usuario_permission_tipo: {
                codigo: "deny",
                ativo: 1,
            },
            OR: [
                { atl_atletica_id: null },
                ...(atlAtleticaId ? [{ atl_atletica_id: atlAtleticaId }] : []),
            ],
        },
        select: {
            id: true,
        },
    });

    if (directDeny) {
        return false;
    }

    /**
     * 2. Verifica ALLOW direto.
     */
    const directAllow = await prisma.sysUsuarioPermission.findFirst({
        where: {
            sys_usuario_id: sysUsuarioId,
            ativo: 1,
            deleted_at: null,
            sys_permission: {
                codigo: permissionCode,
                ativo: 1,
            },
            sys_usuario_permission_tipo: {
                codigo: "allow",
                ativo: 1,
            },
            OR: [
                { atl_atletica_id: null },
                ...(atlAtleticaId ? [{ atl_atletica_id: atlAtleticaId }] : []),
            ],
        },
        select: {
            id: true,
        },
    });

    if (directAllow) {
        return true;
    }

    /**
     * 3. Verifica permissões vindas das roles.
     */
    const rolePermission = await prisma.sysUsuarioRole.findFirst({
        where: {
            sys_usuario_id: sysUsuarioId,
            ativo: 1,
            deleted_at: null,
            OR: [
                { atl_atletica_id: null },
                ...(atlAtleticaId ? [{ atl_atletica_id: atlAtleticaId }] : []),
            ],
            sys_role: {
                ativo: 1,
                deleted_at: null,
                sys_role_permission: {
                    some: {
                        ativo: 1,
                        sys_permission: {
                            codigo: permissionCode,
                            ativo: 1,
                        },
                    },
                },
            },
        },
        select: {
            id: true,
        },
    });

    return Boolean(rolePermission);
}

export async function userHasAnyPermission(
    session: AuthSession,
    permissionCodes: string[]
): Promise<boolean> {
    for (const permissionCode of permissionCodes) {
        const allowed = await userHasPermission(session, permissionCode);

        if (allowed) {
            return true;
        }
    }

    return false;
}