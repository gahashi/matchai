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

    const instituicoes = await prisma.eduInstituicao.findMany({
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
                        {
                            cidade: {
                                contains: q,
                            },
                        },
                        {
                            estado: {
                                contains: q,
                            },
                        },
                    ],
                }
                : {}),
        },
        select: {
            id: true,
            nome: true,
            abreviacao: true,
            cidade: true,
            estado: true,
        },
        orderBy: {
            nome: "asc",
        },
        take: limit,
    });

    return NextResponse.json({
        ok: true,
        items: instituicoes.map((instituicao) => ({
            id: instituicao.id,
            label: instituicao.abreviacao
                ? `${instituicao.abreviacao} — ${instituicao.nome}`
                : instituicao.nome,
            description: [instituicao.cidade, instituicao.estado]
                .filter(Boolean)
                .join(" / "),
        })),
    });
}