export function getEmailConfig() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const secure = process.env.SMTP_SECURE === "true";
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    const fromName = process.env.EMAIL_FROM_NAME ?? "Brava Pass";
    const fromAddress = process.env.EMAIL_FROM_ADDRESS ?? user;

    if (!host || !user || !pass || !fromAddress) {
        throw new Error(
            "Configuração de email incompleta. Verifique SMTP_HOST, SMTP_USER, SMTP_PASS e EMAIL_FROM_ADDRESS."
        );
    }

    return {
        smtp: {
            host,
            port,
            secure,
            auth: {
                user,
                pass,
            },
        },
        from: `${fromName} <${fromAddress}>`,
    };
}