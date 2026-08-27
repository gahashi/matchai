import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmailVerificationCode } from "@/lib/email/verification-code";

const schema = z.object({
    email: z.string().trim().email("Email inválido."),
    nome: z.string().trim().optional(),
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

        const result = await sendEmailVerificationCode({
            email: parsed.data.email,
            nome: parsed.data.nome,
        });

        return NextResponse.json({
            ok: true,
            expiresAt: result.expiresAt,
        });
    } catch (error) {
        console.error("Erro ao enviar código de verificação:", error);

        return NextResponse.json(
            {
                ok: false,
                message: "Não foi possível enviar o código.",
            },
            {
                status: 500,
            }
        );
    }
}