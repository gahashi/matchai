import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    getAuthSession,
} from "@/lib/auth/session";

import {
    prisma,
} from "@/lib/prisma";


type ParceiroApiAccessSuccess = {
    ok: true;

    session: NonNullable<
        Awaited<
            ReturnType<
                typeof getAuthSession
            >
        >
    >;

    parceiro: {
        id: number;
        codigo: string;
        slug: string;
        nome: string;
    };
};


type ParceiroApiAccessError = {
    ok: false;
    response: NextResponse;
};


export type ParceiroApiAccessResult =
    | ParceiroApiAccessSuccess
    | ParceiroApiAccessError;


export async function requireParceiroApiAccess(
    request: NextRequest,
): Promise<ParceiroApiAccessResult> {
    const session =
        await getAuthSession({
            headers:
            request.headers,
        });

    if (!session) {
        return {
            ok: false,

            response:
                NextResponse.json(
                    {
                        ok: false,
                        message:
                            "Não autenticado.",
                    },
                    {
                        status: 401,
                    },
                ),
        };
    }

    const vinculo =
        await prisma
            .parParceiroUsuario
            .findFirst({
                where: {
                    sys_usuario_id:
                    session.user.id,

                    ativo: 1,

                    par_parceiro: {
                        ativo: 1,
                        deleted_at:
                            null,
                    },
                },

                select: {
                    par_parceiro: {
                        select: {
                            id: true,
                            codigo: true,
                            slug: true,
                            nome: true,
                        },
                    },
                },

                orderBy: {
                    id: "asc",
                },
            });

    if (!vinculo) {
        return {
            ok: false,

            response:
                NextResponse.json(
                    {
                        ok: false,

                        message:
                            "Você não possui acesso a um parceiro ativo.",
                    },
                    {
                        status: 403,
                    },
                ),
        };
    }

    return {
        ok: true,
        session,
        parceiro:
        vinculo.par_parceiro,
    };
}