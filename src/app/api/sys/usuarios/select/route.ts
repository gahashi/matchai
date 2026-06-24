import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {requireApiAccess} from "@/lib/auth/require-api-access";

export async function GET(request: NextRequest) {
    // essa api nao sei s eovu levar para frente é so teste
    const access = await requireApiAccess(request);

    if (!access.ok) {
        return access.response;
    }

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