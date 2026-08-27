import { prisma } from "@/lib/prisma";
import { AuthSession } from "@/lib/auth/auth-types";

export function userIsAdmin(
    session: AuthSession,
): boolean {
    return (
        session.user.sys_usuario_tipo.codigo ===
        "admin"
    );
}

export async function userHasPermission(
    session: AuthSession,
    _permissionCode: string,
): Promise<boolean> {
    return userIsAdmin(session);
}

export async function userHasAnyPermission(
    session: AuthSession,
    _permissionCodes: string[],
): Promise<boolean> {
    return userIsAdmin(session);
}

export async function userHasGlobalPermission(
    session: AuthSession,
    _permissionCode: string,
): Promise<boolean> {
    return userIsAdmin(session);
}

export async function userHasPermissionByUserId(
    sysUsuarioId: number,
    _permissionCode: string,
): Promise<boolean> {
    const usuario =
        await prisma.sysUsuario.findUnique({
            where: {
                id: sysUsuarioId,
            },
            select: {
                ativo: true,
                deleted_at: true,

                sys_usuario_tipo: {
                    select: {
                        codigo: true,
                        ativo: true,
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
        return false;
    }

    return (
        usuario.sys_usuario_tipo.codigo ===
        "admin"
    );
}

export async function userHasGlobalPermissionByUserId(
    sysUsuarioId: number,
    permissionCode: string,
): Promise<boolean> {
    return userHasPermissionByUserId(
        sysUsuarioId,
        permissionCode,
    );
}