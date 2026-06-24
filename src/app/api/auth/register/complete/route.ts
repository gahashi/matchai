import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth/auth";
import { createAuthLoginLog } from "@/lib/auth/login-log";
import { verifyEmailCode } from "@/lib/email/verification-code";
import { prisma } from "@/lib/prisma";

const schema = z.object({
    email: z.string().trim().email("Informe um email válido."),
    password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
    code: z.string().trim().length(6, "Informe o código de 6 dígitos."),
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

function getErrorMessage(error: unknown) {
    return error instanceof Error
        ? error.message
        : "Erro desconhecido ao finalizar cadastro.";
}

async function consumeRegistrationCode(email: string) {
    await prisma.sysEmailVerificationCode.updateMany({
        where: {
            email,
            tipo: "account_registration",
            used_at: null,
            deleted_at: null,
        },
        data: {
            used_at: new Date(),
            updated_at: new Date(),
        },
    });
}

async function cleanupCreatedUser(sysUsuarioId: number | null) {
    if (!sysUsuarioId) {
        return;
    }

    const authUser = await prisma.user.findFirst({
        where: {
            sysUsuarioId,
        },
        select: {
            id: true,
        },
    });

    if (authUser) {
        return;
    }

    await prisma.sysUsuario.delete({
        where: {
            id: sysUsuarioId,
        },
    });
}

export async function POST(request: NextRequest) {
    let createdSysUsuarioId: number | null = null;
    let emailForLog: string | null = null;

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
        const nickname = parsed.data.nickname.toLowerCase();

        emailForLog = email;

        const [sysUsuarioEmail, sysUsuarioNickname, authUserExistente] =
            await Promise.all([
                prisma.sysUsuario.findUnique({
                    where: {
                        email,
                    },
                    select: {
                        id: true,
                        deleted_at: true,
                    },
                }),
                prisma.sysUsuario.findUnique({
                    where: {
                        nickname,
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

        if (authUserExistente || (sysUsuarioEmail && !sysUsuarioEmail.deleted_at)) {
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

        if (sysUsuarioNickname && !sysUsuarioNickname.deleted_at) {
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

        if (sysUsuarioEmail?.deleted_at || sysUsuarioNickname?.deleted_at) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Existe um cadastro incompleto com estes dados. Remova o registro antigo de teste ou use outro email/nickname.",
                },
                {
                    status: 409,
                }
            );
        }

        const verification = await verifyEmailCode({
            email,
            code: parsed.data.code,
            tipo: "account_registration",
            consume: false,
        });

        if (!verification.ok) {
            return NextResponse.json(
                {
                    ok: false,
                    message: verification.message,
                },
                {
                    status: 400,
                }
            );
        }

        const usuario = await prisma.sysUsuario.create({
            data: {
                nome: nickname,
                nickname,
                email,
                senha_hash: null,
                ativo: 1,
                perfil_completo: 0,
                email_verificado_at: new Date(),
                created_at: new Date(),
                updated_at: new Date(),
            },
            select: {
                id: true,
                nome: true,
                email: true,
            },
        });

        createdSysUsuarioId = usuario.id;

        await auth.api.signUpEmail({
            body: {
                name: usuario.nome,
                email: usuario.email,
                password: parsed.data.password,
                sysUsuarioId: usuario.id,
            },
        });

        await prisma.user.update({
            where: {
                email,
            },
            data: {
                emailVerified: true,
                sysUsuarioId: usuario.id,
                updatedAt: new Date(),
            },
        });

        await consumeRegistrationCode(email);

        await createAuthLoginLog({
            request,
            evento: "register_success",
            status: "success",
            sysUsuarioId: usuario.id,
            email,
        });

        return NextResponse.json({
            ok: true,
            message: "Conta criada com sucesso.",
        });
    } catch (error) {
        console.error("Erro ao finalizar cadastro:", error);

        await cleanupCreatedUser(createdSysUsuarioId);

        try {
            await createAuthLoginLog({
                request,
                evento: "register_success",
                status: "failed",
                sysUsuarioId: createdSysUsuarioId,
                email: emailForLog,
                errorMessage: getErrorMessage(error),
            });
        } catch (logError) {
            console.error("Erro ao salvar log de cadastro:", logError);
        }

        return NextResponse.json(
            {
                ok: false,
                message: "Não foi possível criar a conta.",
                error:
                    process.env.NODE_ENV === "development"
                        ? getErrorMessage(error)
                        : undefined,
            },
            {
                status: 500,
            }
        );
    }
}