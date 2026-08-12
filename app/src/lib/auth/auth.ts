import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";

import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/send-email";
import { baseEmailTemplate } from "@/lib/email/templates/base-email-template";

export const auth = betterAuth({
    appName: "AAACCU",

    baseURL: process.env.BETTER_AUTH_URL,

    database: prismaAdapter(prisma, {
        provider: "mysql",
    }),

    emailAndPassword: {
        enabled: true,

        minPasswordLength: 8,

        revokeSessionsOnPasswordReset: true,
    },

    user: {
        additionalFields: {
            sysUsuarioId: {
                type: "number",
                required: true,
                input: true,
            },
        },
    },

    plugins: [
        emailOTP({
            otpLength: 6,

            expiresIn: 600,

            allowedAttempts: 5,

            disableSignUp: true,

            async sendVerificationOTP({
                                          email,
                                          otp,
                                          type,
                                      }) {
                if (
                    type !==
                    "forget-password"
                ) {
                    return;
                }

                const usuario =
                    await prisma.sysUsuario.findUnique({
                        where: {
                            email:
                                email
                                    .trim()
                                    .toLowerCase(),
                        },

                        select: {
                            id: true,
                            nome: true,
                        },
                    });

                const html =
                    baseEmailTemplate({
                        title:
                            "Redefinição de senha",

                        preview:
                            "Use este código para redefinir sua senha.",

                        content: `
                            <p style="margin:0 0 16px;">
                                Olá${
                            usuario?.nome
                                ? `, ${usuario.nome}`
                                : ""
                        }.
                            </p>

                            <p style="margin:0 0 16px;">
                                Recebemos uma solicitação para redefinir a senha da sua conta.
                            </p>

                            <p style="margin:0 0 16px;">
                                Use o código abaixo para continuar:
                            </p>

                            <div style="
                                margin: 28px 0;
                                padding: 28px 18px;
                                text-align: center;
                                background: #11131b;
                                border: 1px solid #272b36;
                                border-radius: 22px;
                                color: #9cd91a;
                                font-size: 40px;
                                line-height: 1;
                                font-weight: 900;
                                letter-spacing: 0.20em;
                            ">
                                ${otp}
                            </div>

                            <p style="margin:0 0 16px;">
                                Este código expira em 10 minutos.
                            </p>

                            <p style="margin:0;">
                                Se você não solicitou esta redefinição,
                                ignore este email.
                            </p>
                        `,
                    });

                await sendEmail({
                    to: email,

                    subject:
                        "Código para redefinir sua senha — AAACCU",

                    html,

                    text:
                        `Seu código para redefinir a senha da AAACCU é: ${otp}. ` +
                        "Ele expira em 10 minutos.",

                    template:
                        "password_reset_code",

                    sysUsuarioId:
                        usuario?.id ??
                        null,
                });
            },
        }),

        nextCookies(),
    ],
});