import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    requireAdminApiAccess,
} from "@/lib/auth/require-api-access";

import {
    prisma,
} from "@/lib/prisma";


function normalizeLimit(
    value: string | null,
) {
    const parsed =
        Number(value);

    if (
        !Number.isInteger(
            parsed,
        )
    ) {
        return 15;
    }

    return Math.min(
        Math.max(
            parsed,
            1,
        ),
        30,
    );
}


export async function GET(
    request: NextRequest,
) {
    const access =
        await requireAdminApiAccess(
            request,
        );

    if (!access.ok) {
        return access.response;
    }

    try {
        const searchParams =
            request.nextUrl
                .searchParams;

        const q =
            searchParams
                .get("q")
                ?.trim() ??
            "";

        const limit =
            normalizeLimit(
                searchParams.get(
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
                                        nickname:
                                            {
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
                                ],
                            }
                            : {}),
                    },

                    select: {
                        id: true,
                        nome: true,
                        nickname:
                            true,
                        email: true,
                    },

                    orderBy: {
                        nome: "asc",
                    },

                    take:
                    limit,
                });

        return NextResponse.json({
            ok: true,

            items:
                usuarios.map(
                    (
                        usuario,
                    ) => ({
                        id:
                        usuario.id,

                        label:
                        usuario.nome,

                        description:
                            [
                                usuario.nickname,
                                usuario.email,
                            ]
                                .filter(
                                    Boolean,
                                )
                                .join(
                                    " · ",
                                ),
                    }),
                ),
        });
    } catch (error) {
        console.error(
            "[admin.usuarios.select]",
            error,
        );

        return NextResponse.json(
            {
                ok: false,

                items: [],

                message:
                    "Não foi possível buscar os usuários.",
            },
            {
                status: 500,
            },
        );
    }
}