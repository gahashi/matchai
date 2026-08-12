import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth/auth";
import { createAuthLoginLog } from "@/lib/auth/login-log";
import { verifyEmailCode } from "@/lib/email/verification-code";
import { prisma } from "@/lib/prisma";

const schema = z.object({
    email: z
        .string()
        .trim()
        .email("Informe um email válido."),

    password: z
        .string()
        .min(
            8,
            "A senha precisa ter pelo menos 8 caracteres.",
        ),

    code: z
        .string()
        .trim()
        .length(
            6,
            "Informe o código de 6 dígitos.",
        ),
});

function getErrorMessage(error: unknown) {
    return error instanceof Error
        ? error.message
        : "Erro desconhecido ao finalizar cadastro.";
}

async function consumeRegistrationCode(
    email: string,
) {
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

async function cleanupCreatedUser(
    sysUsuarioId: number | null,
) {
    if (!sysUsuarioId) {
        return;
    }

    const authUser =
        await prisma.user.findFirst({
            where: {
                sysUsuarioId,
            },

            select: {
                id: true,
            },
        });

    /*
     * Se o Better Auth já criou o usuário,
     * não removemos o sys_usuario.
     */
    if (authUser) {
        return;
    }

    await prisma.sysUsuario.delete({
        where: {
            id: sysUsuarioId,
        },
    });
}

export async function POST(
    request: NextRequest,
) {
    let createdSysUsuarioId: number | null =
        null;

    let emailForLog: string | null =
        null;

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
            parsed.data.email
                .trim()
                .toLowerCase();

        /*
         * O cliente não escolhe nickname.
         *
         * Como o email já é único,
         * utilizamos o próprio email como
         * identificador interno.
         */
        const nickname = email;

        emailForLog = email;

        /*
         * O tipo do usuário é decidido
         * exclusivamente pelo servidor.
         *
         * O cadastro público nunca pode
         * escolher ou enviar "admin".
         */
        const sysUsuarioTipoCliente =
            await prisma.sysUsuarioTipo.findUnique({
                where: {
                    codigo: "cliente",
                },

                select: {
                    id: true,
                    ativo: true,
                },
            });

        if (
            !sysUsuarioTipoCliente ||
            sysUsuarioTipoCliente.ativo !== 1
        ) {
            throw new Error(
                'Tipo de usuário "cliente" não encontrado ou inativo.',
            );
        }

        const [
            sysUsuarioEmail,
            authUserExistente,
        ] = await Promise.all([
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

        if (
            authUserExistente ||
            (
                sysUsuarioEmail &&
                !sysUsuarioEmail.deleted_at
            )
        ) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Este email já está em uso.",
                },

                {
                    status: 409,
                },
            );
        }

        /*
         * Como nickname = email,
         * não precisamos consultar nickname
         * separadamente.
         *
         * O próprio email já possui
         * constraint UNIQUE.
         */
        if (sysUsuarioEmail?.deleted_at) {
            return NextResponse.json(
                {
                    ok: false,

                    message:
                        "Existe um cadastro anterior com este email. Entre em contato com o suporte.",
                },

                {
                    status: 409,
                },
            );
        }

        const verification =
            await verifyEmailCode({
                email,

                code:
                parsed.data.code,

                tipo:
                    "account_registration",

                consume: false,
            });

        if (!verification.ok) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                    verification.message,
                },

                {
                    status: 400,
                },
            );
        }

        const now = new Date();

        const usuario =
            await prisma.sysUsuario.create({
                data: {
                    sys_usuario_tipo_id:
                    sysUsuarioTipoCliente.id,

                    /*
                     * Nome temporário.
                     *
                     * Será atualizado futuramente
                     * no perfil do cliente.
                     */
                    nome: email,

                    nickname,

                    email,

                    ativo: 1,

                    perfil_completo: 0,

                    email_verificado_at: now,

                    created_at: now,
                    updated_at: now,
                },

                select: {
                    id: true,
                    nome: true,
                    email: true,
                },
            });

        createdSysUsuarioId =
            usuario.id;

        await auth.api.signUpEmail({
            body: {
                name: usuario.nome,

                email:
                usuario.email,

                password:
                parsed.data.password,

                sysUsuarioId:
                usuario.id,
            },
        });

        await prisma.user.update({
            where: {
                email,
            },

            data: {
                emailVerified: true,

                sysUsuarioId:
                usuario.id,

                updatedAt:
                    new Date(),
            },
        });

        await consumeRegistrationCode(
            email,
        );

        await createAuthLoginLog({
            request,

            evento:
                "register_success",

            status:
                "success",

            sysUsuarioId:
            usuario.id,

            email,
        });

        return NextResponse.json({
            ok: true,

            message:
                "Conta criada com sucesso.",
        });
    } catch (error) {
        console.error(
            "Erro ao finalizar cadastro:",
            error,
        );

        await cleanupCreatedUser(
            createdSysUsuarioId,
        );

        try {
            await createAuthLoginLog({
                request,

                evento:
                    "register_success",

                status:
                    "failed",

                sysUsuarioId:
                createdSysUsuarioId,

                email:
                emailForLog,

                errorMessage:
                    getErrorMessage(
                        error,
                    ),
            });
        } catch (logError) {
            console.error(
                "Erro ao salvar log de cadastro:",
                logError,
            );
        }

        return NextResponse.json(
            {
                ok: false,

                message:
                    "Não foi possível criar a conta.",

                error:
                    process.env.NODE_ENV ===
                    "development"
                        ? getErrorMessage(
                            error,
                        )
                        : undefined,
            },

            {
                status: 500,
            },
        );
    }
}