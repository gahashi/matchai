import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { baseEmailTemplate } from "@/lib/email/templates/base-email-template";
import { sendEmail } from "@/lib/email/send-email";

type VerificationCodeType =
    | "email_verification"
    | "account_registration"
    | "password_reset"
    | "login_verification";

function getCodeExpiresMinutes() {
    return Number(process.env.EMAIL_CODE_EXPIRES_MINUTES ?? 10);
}

function getMaxAttempts() {
    return Number(process.env.EMAIL_CODE_MAX_ATTEMPTS ?? 5);
}

function generateSixDigitCode() {
    return crypto.randomInt(100000, 999999).toString();
}

function hashCode(email: string, code: string, tipo: VerificationCodeType) {
    return crypto
        .createHash("sha256")
        .update(`${email.toLowerCase()}:${tipo}:${code}`)
        .digest("hex");
}

export async function createEmailVerificationCode(params: {
    email: string;
    tipo?: VerificationCodeType;
    sysUsuarioId?: number | null;
}) {
    const tipo = params.tipo ?? "email_verification";
    const email = params.email.trim().toLowerCase();
    const code = generateSixDigitCode();

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + getCodeExpiresMinutes());

    await prisma.sysEmailVerificationCode.updateMany({
        where: {
            email,
            tipo,
            used_at: null,
            deleted_at: null,
        },
        data: {
            deleted_at: new Date(),
            updated_at: new Date(),
        },
    });

    const record = await prisma.sysEmailVerificationCode.create({
        data: {
            sys_usuario_id: params.sysUsuarioId ?? null,
            email,
            tipo,
            codigo_hash: hashCode(email, code, tipo),
            tentativas: 0,
            max_tentativas: getMaxAttempts(),
            expires_at: expiresAt,
            created_at: new Date(),
            updated_at: new Date(),
        },
    });

    return {
        id: record.id,
        code,
        expiresAt,
    };
}

export async function sendEmailVerificationCode(params: {
    email: string;
    nome?: string;
    sysUsuarioId?: number | null;
}) {
    const email = params.email.trim().toLowerCase();

    const verification = await createEmailVerificationCode({
        email,
        tipo: "email_verification",
        sysUsuarioId: params.sysUsuarioId,
    });

    const html = baseEmailTemplate({
        title: "Código de verificação",
        preview: "Use este código para verificar seu email no Brava Pass.",
        content: `
            <p style="margin:0 0 16px;">
                Olá${params.nome ? `, ${params.nome}` : ""}.
            </p>

            <p style="margin:0 0 16px;">
                Use o código abaixo para confirmar que este email pertence a você:
            </p>

           <div style="
    margin: 28px 0;
    padding: 26px 18px;
    text-align: center;
    background: #11131b;
    border: 1px solid #272b36;
    border-radius: 22px;
    color: #f4f4f5;
    font-size: 40px;
    line-height: 1;
    font-weight: 900;
    letter-spacing: 0.20em;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
">
                ${verification.code}
            </div>

            <p style="margin:0;">
                Este código expira em ${getCodeExpiresMinutes()} minutos.
            </p>
        `,
    });

    await sendEmail({
        to: email,
        subject: "Seu código de verificação do Brava Pass",
        html,
        text: `Seu código de verificação do Brava Pass é: ${verification.code}. Ele expira em ${getCodeExpiresMinutes()} minutos.`,
        template: "email_verification_code",
        sysUsuarioId: params.sysUsuarioId,
    });

    return {
        ok: true,
        expiresAt: verification.expiresAt,
    };
}

export async function verifyEmailCode(params: {
    email: string;
    code: string;
    tipo?: VerificationCodeType;
    consume?: boolean;
}) {
    const tipo = params.tipo ?? "email_verification";
    const consume = params.consume ?? true;
    const email = params.email.trim().toLowerCase();
    const code = params.code.trim();

    const record = await prisma.sysEmailVerificationCode.findFirst({
        where: {
            email,
            tipo,
            used_at: null,
            deleted_at: null,
        },
        orderBy: {
            created_at: "desc",
        },
    });

    if (!record) {
        return {
            ok: false,
            message: "Código inválido ou expirado.",
        };
    }

    if (record.expires_at < new Date()) {
        return {
            ok: false,
            message: "Código expirado.",
        };
    }

    if (record.tentativas >= record.max_tentativas) {
        return {
            ok: false,
            message: "Limite de tentativas excedido.",
        };
    }

    const codeHash = hashCode(email, code, tipo);

    if (codeHash !== record.codigo_hash) {
        await prisma.sysEmailVerificationCode.update({
            where: {
                id: record.id,
            },
            data: {
                tentativas: {
                    increment: 1,
                },
                updated_at: new Date(),
            },
        });

        return {
            ok: false,
            message: "Código inválido.",
        };
    }

    if (consume) {
        await prisma.sysEmailVerificationCode.update({
            where: {
                id: record.id,
            },
            data: {
                used_at: new Date(),
                updated_at: new Date(),
            },
        });
    }

    return {
        ok: true,
        sysUsuarioId: record.sys_usuario_id,
    };
}

export async function sendAccountRegistrationCode(params: {
    email: string;
    nome?: string;
}) {
    const email = params.email.trim().toLowerCase();

    const verification = await createEmailVerificationCode({
        email,
        tipo: "account_registration",
        sysUsuarioId: null,
    });

    const html = baseEmailTemplate({
        title: "Confirme seu email",
        preview: "Use este código para criar sua conta no Brava Pass.",
        content: `
            <p style="margin:0 0 16px;">
                Olá${params.nome ? `, ${params.nome}` : ""}.
            </p>

            <p style="margin:0 0 16px;">
                Use o código abaixo para confirmar que este email pertence a você e continuar seu cadastro:
            </p>

            <div style="
                margin: 28px 0;
                padding: 28px 18px;
                text-align: center;
                background: #11131b;
                border: 1px solid #272b36;
                border-radius: 22px;
                color: #f4f4f5;
                font-size: 40px;
                line-height: 1;
                font-weight: 900;
                letter-spacing: 0.20em;
            ">
                ${verification.code}
            </div>

            <p style="margin:0;">
                Este código expira em ${getCodeExpiresMinutes()} minutos.
            </p>
        `,
    });

    await sendEmail({
        to: email,
        subject: "Seu código para criar conta no Brava Pass",
        html,
        text: `Seu código para criar conta no Brava Pass é: ${verification.code}. Ele expira em ${getCodeExpiresMinutes()} minutos.`,
        template: "account_registration_code",
        sysUsuarioId: null,
    });

    return {
        ok: true,
        expiresAt: verification.expiresAt,
    };
}

export async function sendPasswordResetCode(params: {
    email: string;
    nome?: string;
    sysUsuarioId: number;
}) {
    const email = params.email
        .trim()
        .toLowerCase();

    const verification =
        await createEmailVerificationCode({
            email,
            tipo: "password_reset",
            sysUsuarioId:
            params.sysUsuarioId,
        });

    const html = baseEmailTemplate({
        title: "Redefinição de senha",

        preview:
            "Use este código para redefinir sua senha.",

        content: `
            <p style="margin:0 0 16px;">
                Olá${params.nome ? `, ${params.nome}` : ""}.
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
                background: #121411;
                border: 1px solid #2b3028;
                border-radius: 22px;
                color: #9cd91a;
                font-size: 40px;
                line-height: 1;
                font-weight: 900;
                letter-spacing: 0.20em;
            ">
                ${verification.code}
            </div>

            <p style="margin:0 0 16px;">
                Este código expira em
                ${getCodeExpiresMinutes()}
                minutos.
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
            `Seu código para redefinir a senha da AAACCU é: ${verification.code}. ` +
            `Ele expira em ${getCodeExpiresMinutes()} minutos.`,

        template:
            "password_reset_code",

        sysUsuarioId:
        params.sysUsuarioId,
    });

    return {
        ok: true,
        expiresAt:
        verification.expiresAt,
    };
}