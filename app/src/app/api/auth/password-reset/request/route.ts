import {
    NextRequest,
    NextResponse,
} from "next/server";

import { z } from "zod";

import { prisma } from "@/lib/prisma";

import {
    sendPasswordResetCode,
} from "@/lib/email/verification-code";

const schema = z.object({
    email: z
        .string()
        .trim()
        .email("Informe um email válido."),
});

export async function POST(
    request: NextRequest,
) {
    try {
        const body =
            await request.json();

        const parsed =
            schema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    ok: false,

                    message:
                        parsed.error
                            .issues[0]
                            ?.message ??
                        "Dados inválidos.",
                },
                {
                    status: 400,
                },
            );
        }

        const email =
            parsed.data.email.toLowerCase();

        const usuario =
            await prisma.sysUsuario.findUnique({
                where: {
                    email,
                },

                select: {
                    id: true,
                    nome: true,
                    email: true,
                    ativo: true,
                    deleted_at: true,
                },
            });

        /*
         * Não revelamos se o email existe.
         *
         * Isso evita enumeração de usuários.
         */
        if (
            !usuario ||
            usuario.ativo !== 1 ||
            usuario.deleted_at
        ) {
            return NextResponse.json({
                ok: true,

                message:
                    "Se o email estiver cadastrado, enviaremos um código de recuperação.",
            });
        }

        await sendPasswordResetCode({
            email: usuario.email,

            nome: usuario.nome,

            sysUsuarioId:
            usuario.id,
        });

        return NextResponse.json({
            ok: true,

            message:
                "Se o email estiver cadastrado, enviaremos um código de recuperação.",
        });
    } catch (error) {
        console.error(
            "Erro ao solicitar recuperação de senha:",
            error,
        );

        return NextResponse.json(
            {
                ok: false,

                message:
                    "Não foi possível solicitar a recuperação de senha.",
            },
            {
                status: 500,
            },
        );
    }
}