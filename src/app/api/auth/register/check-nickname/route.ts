import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
    nickname: z
        .string()
        .trim()
        .min(3, "O nickname precisa ter pelo menos 3 caracteres.")
        .max(50, "O nickname pode ter no máximo 50 caracteres.")
        .regex(
            /^[a-zA-Z0-9._-]+$/,
            "Use apenas letras, números, ponto, traço ou underline."
        ),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = schema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    ok: false,
                    message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
                },
                {
                    status: 400,
                }
            );
        }

        const nickname = parsed.data.nickname.toLowerCase();

        const usuario = await prisma.sysUsuario.findUnique({
            where: {
                nickname,
            },
            select: {
                id: true,
            },
        });

        if (usuario) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "Este nickname já está em uso.",
                },
                {
                    status: 409,
                }
            );
        }

        return NextResponse.json({
            ok: true,
        });
    } catch (error) {
        console.error("Erro ao validar nickname:", error);

        return NextResponse.json(
            {
                ok: false,
                message: "Não foi possível validar o nickname.",
            },
            {
                status: 500,
            }
        );
    }
}