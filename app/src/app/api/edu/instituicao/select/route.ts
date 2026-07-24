import { NextRequest } from "next/server";

import { requireApiAccess } from "@/lib/auth/require-api-access";
import {
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

        const instituicoes = await prisma.eduInstituicao.findMany({
            where: {
                ativo: 1,
                deleted_at: null,
                ...(q
                    ? {
                        OR: [
                            { nome: { contains: q } },
                            { abreviacao: { contains: q } },
                            { cidade: { contains: q } },
                            { estado: { contains: q } },
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

        return selectSuccess(
            instituicoes.map((instituicao) => ({
                id: instituicao.id,
                label: instituicao.abreviacao
                    ? `${instituicao.abreviacao} — ${instituicao.nome}`
                    : instituicao.nome,
                description: [instituicao.cidade, instituicao.estado]
                    .filter(Boolean)
                    .join(" / "),
            })),
        );
    } catch (error) {
        console.error(
            "[EDU_INSTITUICAO_SELECT] Erro ao buscar instituições:",
            error,
        );
        return selectError("Não foi possível buscar as instituições.");
    }
}