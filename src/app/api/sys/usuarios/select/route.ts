import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

    const q = searchParams.get("q")?.trim() ?? "";
    const limitParam = Number(searchParams.get("limit") ?? 15);

    const limit = Number.isFinite(limitParam)
        ? Math.min(Math.max(limitParam, 1), 30)
        : 15;

    const usuarios = await prisma.sysUsuario.findMany({
        where: {
            ativo: 1,
            deleted_at: null,
            ...(q.length > 0
                ? {
                    OR: [
                        {
                            nome: {
                                contains: q,
                            },
                        },
                        {
                            email: {
                                contains: q,
                            },
                        },
                        {
                            nickname: {
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
            email: true,
            nickname: true,
        },
        orderBy: {
            nome: "asc",
        },
        take: limit,
    });

    return NextResponse.json({
        items: usuarios.map((usuario) => ({
            id: usuario.id,
            label: usuario.nome,
            description: `${usuario.nickname} · ${usuario.email}`,
        })),
    });
}