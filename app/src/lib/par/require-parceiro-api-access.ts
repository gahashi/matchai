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

    vinculo: {
        id: number;

        tipo: {
            id: number;
            codigo: string;
            nome: string;
        };
    };

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


function parseParceiroId(
    value: string | number,
) {
    const id =
        Number(value);

    return (
        Number.isInteger(id) &&
        id > 0
    )
        ? id
        : null;
}


export async function requireParceiroApiAccess(
    request: NextRequest,
    parceiroIdValue: string | number,
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


    const parceiroId =
        parseParceiroId(
            parceiroIdValue,
        );

    if (!parceiroId) {
        return {
            ok: false,

            response:
                NextResponse.json(
                    {
                        ok: false,
                        message:
                            "Parceiro inválido.",
                    },
                    {
                        status: 400,
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

                    par_parceiro_id:
                    parceiroId,

                    ativo: 1,

                    par_parceiro: {
                        id:
                            parceiroId,

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

                    par_parceiro: {
                        select: {
                            id: true,
                            codigo: true,
                            slug: true,
                            nome: true,
                        },
                    },
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
                            "Você não possui acesso a este parceiro.",
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

        vinculo: {
            id:
                vinculo.id,

            tipo:
                vinculo
                    .par_parceiro_usuario_tipo,
        },

        parceiro:
        vinculo.par_parceiro,
    };
}
