import { NextRequest, NextResponse } from "next/server";

import { getAuthSession } from "@/lib/auth/session";
import { userHasAnyPermission } from "@/lib/auth/permissions";
import { AuthSession } from "@/lib/auth/auth-types";


type RequireApiAccessOptions = {
    permissions?: string[];
};


type RequireApiAccessSuccess = {
    ok: true;
    session: AuthSession;
};


type RequireApiAccessError = {
    ok: false;
    response: NextResponse;
};


export type RequireApiAccessResult =
    | RequireApiAccessSuccess
    | RequireApiAccessError;


export async function requireApiAccess(
    request: NextRequest,
    options: RequireApiAccessOptions = {},
): Promise<RequireApiAccessResult> {
    const session = await getAuthSession({
        headers: request.headers,
    });

    if (!session) {
        return {
            ok: false,
            response: NextResponse.json(
                {
                    ok: false,
                    message: "Não autenticado.",
                },
                {
                    status: 401,
                },
            ),
        };
    }

    const permissions =
        options.permissions ?? [];

    if (permissions.length > 0) {
        const allowed =
            await userHasAnyPermission(
                session,
                permissions,
            );

        if (!allowed) {
            return {
                ok: false,
                response: NextResponse.json(
                    {
                        ok: false,
                        message:
                            "Sem permissão para executar esta ação.",
                    },
                    {
                        status: 403,
                    },
                ),
            };
        }
    }

    return {
        ok: true,
        session,
    };
}


export async function requireAdminApiAccess(
    request: NextRequest,
): Promise<RequireApiAccessResult> {
    const access =
        await requireApiAccess(request);

    if (!access.ok) {
        return access;
    }

    if (
        access.session.user
            .sys_usuario_tipo
            .codigo !== "admin"
    ) {
        return {
            ok: false,
            response: NextResponse.json(
                {
                    ok: false,
                    message:
                        "Sem permissão para executar esta ação.",
                },
                {
                    status: 403,
                },
            ),
        };
    }

    return access;
}