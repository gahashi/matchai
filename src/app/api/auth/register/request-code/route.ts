import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendAccountRegistrationCode } from "@/lib/email/verification-code";

const schema = z.object({
    email: z.string().trim().email("Informe um email válido."),
    password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
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

        const email = parsed.data.email.toLowerCase();

        const [sysUsuarioExistente, authUserExistente] = await Promise.all([
            prisma.sysUsuario.findUnique({
                where: {
                    email,
                },
                select: {
                    id: true,
                    deleted_at: true,
                },
            }),
            prisma.user.findUnique({
                where: {
                    email,
                },
                select: {
                    id: true,
                },
            }),
        ]);

        if (authUserExistente || (sysUsuarioExistente && !sysUsuarioExistente.deleted_at)) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "Este email já está em uso.",
                },
                {
                    status: 409,
                }
            );
        }

        if (sysUsuarioExistente?.deleted_at) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Não foi possível iniciar o cadastro com este email. Entre em contato com o suporte.",
                },
                {
                    status: 409,
                }
            );
        }

        const result = await sendAccountRegistrationCode({
            email,
        });

        return NextResponse.json({
            ok: true,
            expiresAt: result.expiresAt,
        });
    } catch (error) {
        console.error("Erro ao solicitar código de cadastro:", error);

        return NextResponse.json(
            {
                ok: false,
                message: "Não foi possível enviar o código de verificação.",
            },
            {
                status: 500,
            }
        );
    }
}