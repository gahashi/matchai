import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyEmailCode } from "@/lib/email/verification-code";

const schema = z.object({
    email: z.string().trim().email("Email inválido."),
    code: z.string().trim().length(6, "Informe o código de 6 dígitos."),
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

        const result = await verifyEmailCode({
            email: parsed.data.email,
            code: parsed.data.code,
        });

        if (!result.ok) {
            return NextResponse.json(
                {
                    ok: false,
                    message: result.message,
                },
                {
                    status: 400,
                }
            );
        }

        return NextResponse.json({
            ok: true,
            message: "Email verificado com sucesso.",
        });
    } catch (error) {
        console.error("Erro ao validar código de verificação:", error);

        return NextResponse.json(
            {
                ok: false,
                message: "Não foi possível validar o código.",
            },
            {
                status: 500,
            }
        );
    }
}