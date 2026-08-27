import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const resolveLoginSchema = z.object({
    identificador: z.string().trim().min(1, "Informe email ou nickname."),
});

function pareceEmail(valor: string) {
    return valor.includes("@");
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = resolveLoginSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    ok: false,
                    message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
                },
                { status: 400 },
            );
        }

        const identificador = parsed.data.identificador.toLowerCase();

        const usuario = await prisma.sysUsuario.findFirst({
            where: pareceEmail(identificador)
                ? {
                    email: identificador,
                    deleted_at: null,
                }
                : {
                    nickname: identificador,
                    deleted_at: null,
                },
            select: {
                id: true,
                nome: true,
                email: true,
                nickname: true,
                ativo: true,
            },
        });

        if (!usuario || usuario.ativo !== 1) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "Usuário ou senha inválidos.",
                },
                { status: 401 },
            );
        }

        return NextResponse.json({
            ok: true,
            email: usuario.email,
        });
    } catch (error) {
        console.error("Erro ao resolver login:", error);

        return NextResponse.json(
            {
                ok: false,
                message: "Não foi possível validar o login.",
            },
            { status: 500 },
        );
    }
}