import { NextRequest, NextResponse } from "next/server";

import { requireApiAccess } from "@/lib/auth/require-api-access";
import { prisma } from "@/lib/prisma";

function normalizarLimit(value: string | null) {
    const limit = Number(value);

    if (!Number.isInteger(limit)) {
        return 15;
    }

    if (limit < 5) {
        return 5;
    }

    if (limit > 30) {
        return 30;
    }

    return limit;
}

export async function GET(request: NextRequest) {
    const access = await requireApiAccess(request);

    if (!access.ok) {
        return access.response;
    }

    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get("q")?.trim() ?? "";
    const limit = normalizarLimit(searchParams.get("limit"));
    const instituicaoId = Number(searchParams.get("instituicaoId"));

    const cursos = await prisma.eduCurso.findMany({
        where: {
            ativo: 1,
            deleted_at: null,
            ...(q
                ? {
                    OR: [
                        {
                            nome: {
                                contains: q,
                            },
                        },
                        {
                            abreviacao: {
                                contains: q,
                            },
                        },
                    ],
                }
                : {}),
            ...(Number.isInteger(instituicaoId) && instituicaoId > 0
                ? {
                    edu_instituicao_curso: {
                        some: {
                            edu_instituicao_id: instituicaoId,
                            ativo: 1,
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

    return NextResponse.json({
        ok: true,
        items: cursos.map((curso) => ({
            id: curso.id,
            label: curso.abreviacao
                ? `${curso.abreviacao} — ${curso.nome}`
                : curso.nome,
            description: curso.periodos
                ? `${curso.periodos} período(s)`
                : "Curso cadastrado",
        })),
    });
}