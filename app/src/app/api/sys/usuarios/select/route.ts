import { NextRequest } from "next/server";

import { requireApiAccess } from "@/lib/auth/require-api-access";
import {
    normalizarIdFiltro,
    normalizarSelectLimit,
    selectError,
    selectSuccess,
} from "@/lib/api/select-utils";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const access = await requireApiAccess(request);

    if (!access.ok) {
        return access.response;
    }

    try {
        const searchParams = request.nextUrl.searchParams;
        const q = searchParams.get("q")?.trim() ?? "";
        const limit = normalizarSelectLimit(searchParams.get("limit"));
        const entidadeId = normalizarIdFiltro(searchParams.get("entidadeId"));
        const poloId = normalizarIdFiltro(searchParams.get("poloId"));

        const usuarios = await prisma.sysUsuario.findMany({
            where: {
                ativo: 1,
                deleted_at: null,
                ...(q
                    ? {
                        OR: [
                            { nome: { contains: q } },
                            { email: { contains: q } },
                            { nickname: { contains: q } },
                        ],
                    }
                    : {}),
                ...(entidadeId
                    ? {
                        ent_entidade_membro: {
                            some: {
                                ent_entidade_id: entidadeId,
                                ativo: 1,
                                deleted_at: null,
                            },
                        },
                    }
                    : {}),
                ...(poloId
                    ? {
                        sys_usuario_polo: {
                            some: {
                                edu_polo_id: poloId,
                                ativo: 1,
                                deleted_at: null,
                            },
                        },
                    }
                    : {}),
            },
            select: {
                id: true,
                nome: true,
                email: true,
                nickname: true,
            },
            orderBy: {
                nome: "asc",
            },
            take: limit,
        });

        return selectSuccess(
            usuarios.map((usuario) => ({
                id: usuario.id,
                label: usuario.nome,
                description: [usuario.nickname, usuario.email]
                    .filter(Boolean)
                    .join(" · "),
            })),
        );
    } catch (error) {
        console.error("[SYS_USUARIO_SELECT] Erro ao buscar usuários:", error);
        return selectError("Não foi possível buscar os usuários.");
    }
}