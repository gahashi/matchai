import {
    redirect,
} from "next/navigation";

import {
    getAuthSession,
} from "@/lib/auth/session";

import {
    prisma,
} from "@/lib/prisma";


export async function requireParceiroPageAccess(
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
                            descricao:
                                true,

                            ativo: true,
                            visivel_publico:
                                true,

                            par_parceiro_tema:
                                {
                                    select: {
                                        cor_primaria:
                                            true,

                                        cor_secundaria:
                                            true,

                                        cor_fundo:
                                            true,

                                        cor_texto:
                                            true,

                                        logo_sys_arquivo:
                                            {
                                                select: {
                                                    id:
                                                        true,

                                                    public_url:
                                                        true,

                                                    original_name:
                                                        true,
                                                },
                                            },

                                        banner_sys_arquivo:
                                            {
                                                select: {
                                                    id:
                                                        true,

                                                    public_url:
                                                        true,

                                                    original_name:
                                                        true,
                                                },
                                            },
                                    },
                                },
                        },
                    },
                },

                orderBy: {
                    id: "asc",
                },
            });

    if (!vinculo) {
        redirect(
            "/sem-permissao",
        );
    }

    return {
        session,
        parceiro:
        vinculo.par_parceiro,
    };
}