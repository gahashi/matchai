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

        const polos = await prisma.eduPolo.findMany({
            where: {
                ativo: 1,
                deleted_at: null,
                ...(instituicaoId
                    ? { edu_instituicao_id: instituicaoId }
                    : {}),
                ...(q
                    ? {
                        OR: [
                            { nome: { contains: q } },
                            { codigo: { contains: q } },
                            { cidade: { contains: q } },
                            { estado: { contains: q } },
                            {
                                edu_instituicao: {
                                    nome: { contains: q },
                                },
                            },
                            {
                                edu_instituicao: {
                                    abreviacao: { contains: q },
                                },
                            },
                        ],
                    }
                    : {}),
            },
            select: {
                id: true,
                codigo: true,
                nome: true,
                cidade: true,
                estado: true,
                edu_instituicao_id: true,
                edu_instituicao: {
                    select: {
                        nome: true,
                        abreviacao: true,
                    },
                },
            },
            orderBy: [
                {
                    edu_instituicao: {
                        nome: "asc",
                    },
                },
                {
                    nome: "asc",
                },
            ],
            take: limit,
        });

        return selectSuccess(
            polos.map((polo) => ({
                id: polo.id,
                label: instituicaoId
                    ? polo.nome
                    : `${polo.edu_instituicao.abreviacao || polo.edu_instituicao.nome} — ${polo.nome}`,
                description: [polo.cidade, polo.estado]
                    .filter(Boolean)
                    .join(" / "),
                codigo: polo.codigo,
                instituicaoId: polo.edu_instituicao_id,
            })),
        );
    } catch (error) {
        console.error("[EDU_POLO_SELECT] Erro ao buscar polos:", error);
        return selectError("Não foi possível buscar os polos.");
    }
}