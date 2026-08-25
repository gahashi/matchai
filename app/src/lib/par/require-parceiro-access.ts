import {
    redirect,
} from "next/navigation";

import {
    getAuthSession,
} from "@/lib/auth/session";

import {
    prisma,
} from "@/lib/prisma";


const parceiroSelect = {
    id: true,

    codigo: true,
    slug: true,

    nome: true,
    descricao: true,

    ativo: true,
    visivel_publico: true,

    par_parceiro_tema: {
        select: {
            cor_primaria: true,
            cor_secundaria: true,
            cor_fundo: true,
            cor_texto: true,

            logo_sys_arquivo: {
                select: {
                    id: true,
                    public_url: true,
                    original_name: true,
                },
            },

            banner_sys_arquivo: {
                select: {
                    id: true,
                    public_url: true,
                    original_name: true,
                },
            },
        },
    },
} as const;


async function requireSession(
    pathname: string,
) {
    const session =
        await getAuthSession();

    if (!session) {
        redirect(
            `/login?callbackUrl=${encodeURIComponent(
                pathname,
            )}`,
        );
    }

    return session;
}


export async function requireParceiroListPageAccess(
    pathname: string,
) {
    const session =
        await requireSession(
            pathname,
        );

    const vinculos =
        await prisma
            .parParceiroUsuario
            .findMany({
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
                        select:
                        parceiroSelect,
                    },
                },

                orderBy: {
                    par_parceiro: {
                        nome:
                            "asc",
                    },
                },
            });

    if (
        vinculos.length ===
        0
    ) {
        redirect(
            "/sem-permissao",
        );
    }

    return {
        session,

        parceiros:
            vinculos.map(
                (
                    vinculo,
                ) =>
                    vinculo
                        .par_parceiro,
            ),
    };
}


export async function requireParceiroPageAccess(
    pathname: string,
    slug: string,
) {
    const session =
        await requireSession(
            pathname,
        );

    const vinculo =
        await prisma
            .parParceiroUsuario
            .findFirst({
                where: {
                    sys_usuario_id:
                    session.user.id,

                    ativo: 1,

                    par_parceiro: {
                        slug,

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
                        select:
                        parceiroSelect,
                    },
                },
            });

    if (!vinculo) {
        redirect(
            "/sem-permissao",
        );
    }

    return {
        session,

        vinculo: {
            id:
                vinculo.id,

            tipo:
                vinculo
                    .par_parceiro_usuario_tipo,
        },

        parceiro:
        vinculo
            .par_parceiro,
    };
}
