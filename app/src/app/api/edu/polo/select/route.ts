import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        const q = searchParams.get("q")?.trim() ?? "";
        const instituicaoId = Number(searchParams.get("eduInstituicaoId") ?? 0);

        const limitParam = Number(searchParams.get("limit") ?? 15);
        const limit = Number.isInteger(limitParam)
            ? Math.min(Math.max(limitParam, 1), 50)
            : 15;

        const polos = await prisma.eduPolo.findMany({
            where: {
                ativo: 1,
                deleted_at: null,
                ...(instituicaoId > 0
                    ? {
                        edu_instituicao_id: instituicaoId,
                    }
                    : {}),
                ...(q
                    ? {
                        OR: [
                            {
                                nome: {
                                    contains: q,
                                },
                            },
                            {
                                codigo: {
                                    contains: q,
                                },
                            },
                            {
                                cidade: {
                                    contains: q,
                                },
                            },
                        ],
                    }
                    : {}),
            },
            orderBy: [
                {
                    nome: "asc",
                },
            ],
            take: limit,
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
        });

        return NextResponse.json({
            items: polos.map((polo) => ({
                id: polo.id,
                label: polo.nome,
                description: [
                    polo.edu_instituicao.abreviacao,
                    polo.cidade,
                    polo.estado,
                ]
                    .filter(Boolean)
                    .join(" • "),
                codigo: polo.codigo,
                eduInstituicaoId: polo.edu_instituicao_id,
            })),
        });
    } catch (error) {
        console.error("Erro ao buscar polos:", error);

        return NextResponse.json(
            {
                items: [],
                message: "Não foi possível buscar os polos.",
            },
            {
                status: 500,
            }
        );
    }
}