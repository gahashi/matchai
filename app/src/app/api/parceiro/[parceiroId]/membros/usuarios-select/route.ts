import {
    NextRequest,
} from "next/server";

import {
    normalizarSelectLimit,
    selectError,
    selectSuccess,
} from "@/lib/api/select-utils";

import {
    podeGerenciarMembros,
} from "@/lib/par/parceiro-membro-service";

import {
    requireParceiroApiAccess,
} from "@/lib/par/require-parceiro-api-access";

import {
    prisma,
} from "@/lib/prisma";


type RouteParams = {
    params: Promise<{
        parceiroId: string;
    }>;
};


export async function GET(
    request: NextRequest,
    {
        params,
    }: RouteParams,
) {
    const {
        parceiroId,
    } =
        await params;

    const access =
        await requireParceiroApiAccess(
            request,
            parceiroId,
        );

    if (!access.ok) {
        return access.response;
    }

    if (
        !podeGerenciarMembros(
            access.vinculo.tipo.codigo,
        )
    ) {
        return selectError(
            "Você não possui permissão para adicionar membros.",
        );
    }

    try {
        const searchParams =
            request.nextUrl
                .searchParams;

        const q =
            searchParams
                .get(
                    "q",
                )
                ?.trim() ??
            "";

        const limit =
            normalizarSelectLimit(
                searchParams
                    .get(
                        "limit",
                    ),
            );

        const usuarios =
            await prisma
                .sysUsuario
                .findMany({
                    where: {
                        ativo: 1,
                        deleted_at:
                            null,

                        ...(q
                            ? {
                                OR: [
                                    {
                                        nome: {
                                            contains:
                                                q,
                                        },
                                    },
                                    {
                                        email: {
                                            contains:
                                                q,
                                        },
                                    },
                                    {
                                        nickname: {
                                            contains:
                                                q,
                                        },
                                    },
                                ],
                            }
                            : {}),

                        NOT: {
                            par_parceiro_usuarios: {
                                some: {
                                    par_parceiro_id:
                                        access
                                            .parceiro
                                            .id,

                                    ativo: 1,
                                },
                            },
                        },
                    },

                    select: {
                        id: true,
                        nome: true,
                        email: true,
                        nickname: true,

                        avatar_sys_arquivo: {
                            select: {
                                public_url:
                                    true,
                            },
                        },
                    },

                    orderBy: {
                        nome:
                            "asc",
                    },

                    take:
                        limit,
                });

        return selectSuccess(
            usuarios.map(
                (
                    usuario,
                ) => ({
                    id:
                        usuario.id,

                    label:
                        usuario.nome,

                    description: [
                        usuario.nickname,
                        usuario.email,
                    ]
                        .filter(
                            Boolean,
                        )
                        .join(
                            " · ",
                        ),

                    avatar_url:
                        usuario
                            .avatar_sys_arquivo
                            ?.public_url ??
                        null,
                }),
            ),
        );
    } catch (error) {
        console.error(
            "[PARCEIRO_MEMBROS_USUARIOS_SELECT]",
            error,
        );

        return selectError(
            "Não foi possível buscar os usuários.",
        );
    }
}
