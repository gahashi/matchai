import { prisma } from "@/lib/prisma";
import { AuthSession } from "@/lib/auth/auth-types";

type PermissionScope = {
    entEntidadeId?: number | null;
    globalOnly?: boolean;
};

function buildEntityScope({
                              entEntidadeId = null,
                              globalOnly = false,
                          }: PermissionScope) {
    if (globalOnly || !entEntidadeId) {
        return [{ ent_entidade_id: null }];
    }

    return [
        { ent_entidade_id: null },
        { ent_entidade_id: entEntidadeId },
    ];
}

export async function userHasPermissionByUserId(
    sysUsuarioId: number,
    permissionCode: string,
    scope: PermissionScope = {}
): Promise<boolean> {
    const entityScope = buildEntityScope(scope);

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
            OR: entityScope,
        },
        select: {
            id: true,
        },
    });

    if (directDeny) {
        return false;
    }

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
            OR: entityScope,
        },
        select: {
            id: true,
        },
    });

    if (directAllow) {
        return true;
    }

    const rolePermission = await prisma.sysUsuarioRole.findFirst({
        where: {
            sys_usuario_id: sysUsuarioId,
            ativo: 1,
            deleted_at: null,
            OR: entityScope,
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

export async function userHasGlobalPermissionByUserId(
    sysUsuarioId: number,
    permissionCode: string
): Promise<boolean> {
    return userHasPermissionByUserId(sysUsuarioId, permissionCode, {
        globalOnly: true,
    });
}

export async function userHasPermission(
    session: AuthSession,
    permissionCode: string
): Promise<boolean> {
    return userHasPermissionByUserId(
        session.user.id,
        permissionCode,
        {
            entEntidadeId: session.ent_entidade_id ?? null,
        }
    );
}

export async function userHasGlobalPermission(
    session: AuthSession,
    permissionCode: string
): Promise<boolean> {
    return userHasGlobalPermissionByUserId(
        session.user.id,
        permissionCode
    );
}

export async function userHasAnyPermission(
    session: AuthSession,
    permissionCodes: string[]
): Promise<boolean> {
    for (const permissionCode of permissionCodes) {
        const allowed = await userHasPermission(
            session,
            permissionCode
        );

        if (allowed) {
            return true;
        }
    }

    return false;
}
