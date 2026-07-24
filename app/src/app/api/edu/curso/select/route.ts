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
        const instituicaoId = normalizarIdFiltro(
            searchParams.get("instituicaoId"),
        );

        const cursos = await prisma.eduCurso.findMany({
            where: {
                ativo: 1,
                deleted_at: null,
                ...(q
                    ? {
                        OR: [
                            { nome: { contains: q } },
                            { abreviacao: { contains: q } },
                        ],
                    }
                    : {}),
                ...(instituicaoId
                    ? {
                        edu_instituicao_curso: {
                            some: {
                                edu_instituicao_id: instituicaoId,
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
                abreviacao: true,
                periodos: true,
            },
            orderBy: {
                nome: "asc",
            },
            take: limit,
        });

        return selectSuccess(
            cursos.map((curso) => ({
                id: curso.id,
                label: curso.abreviacao
                    ? `${curso.abreviacao} — ${curso.nome}`
                    : curso.nome,
                description: curso.periodos
                    ? `${curso.periodos} período(s)`
                    : "Curso cadastrado",
            })),
        );
    } catch (error) {
        console.error("[EDU_CURSO_SELECT] Erro ao buscar cursos:", error);
        return selectError("Não foi possível buscar os cursos.");
    }
}