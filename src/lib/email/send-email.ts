import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { getEmailConfig } from "@/lib/email/email-config";

type SendEmailParams = {
    to: string;
    subject: string;
    html: string;
    text?: string;
    template?: string;
    sysUsuarioId?: number | null;
    metadataText?: string | null;
};

export async function sendEmail({
                                    to,
                                    subject,
                                    html,
                                    text,
                                    template,
                                    sysUsuarioId,
                                    metadataText,
                                }: SendEmailParams) {
    const config = getEmailConfig();

    const transporter = nodemailer.createTransport(config.smtp);

    try {
        const result = await transporter.sendMail({
            from: config.from,
            to,
            subject,
            html,
            text,
        });

        await prisma.sysEmailLog.create({
            data: {
                sys_usuario_id: sysUsuarioId ?? null,
                email_to: to,
                email_from: config.from,
                subject,
                template: template ?? null,
                provider: "smtp",
                status: "sent",
                message_id: result.messageId ?? null,
                metadata_text: metadataText ?? null,
                sent_at: new Date(),
                created_at: new Date(),
                updated_at: new Date(),
            },
        });

        return {
            ok: true,
            messageId: result.messageId,
        };
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Erro desconhecido ao enviar email.";

        await prisma.sysEmailLog.create({
            data: {
                sys_usuario_id: sysUsuarioId ?? null,
                email_to: to,
                email_from: config.from,
                subject,
                template: template ?? null,
                provider: "smtp",
                status: "failed",
                error_message: message,
                metadata_text: metadataText ?? null,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });

        throw error;
    }
}