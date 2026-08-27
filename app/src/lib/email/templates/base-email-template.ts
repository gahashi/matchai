type BaseEmailTemplateParams = {
    title: string;
    preview?: string;
    content: string;

    badgeLabel?: string;

    actionLabel?: string;
    actionUrl?: string;

    footerText?: string;
};

function escapeHtml(value: string) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

export function baseEmailTemplate({
                                      title,
                                      preview,
                                      content,
                                      badgeLabel = "Verificação de segurança",
                                      actionLabel,
                                      actionUrl,
                                      footerText = "Este email foi enviado automaticamente pelo Brava Pass. Se você não solicitou este código, pode ignorar esta mensagem.",
                                  }: BaseEmailTemplateParams) {
    const logoUrl = process.env.EMAIL_LOGO_URL;

    const safeTitle = escapeHtml(title);
    const safeBadgeLabel = escapeHtml(badgeLabel);
    const safeFooterText = escapeHtml(footerText);

    const logoHtml = logoUrl
        ? `
            <tr>
                <td align="center" style="padding: 34px 28px 12px;">
                    <img
                        src="${escapeHtml(logoUrl)}"
                        alt="AAACCU"
                        width="148"
                        style="
                            display: block;
                            width: 148px;
                            max-width: 100%;
                            height: auto;
                            border: 0;
                            outline: none;
                            text-decoration: none;
                        "
                    />
                </td>
            </tr>
        `
        : `
            <tr>
                <td align="center" style="padding: 34px 28px 12px;">
                    <div style="
                        display: inline-block;
                        background: #9cd91a;
                        color: #0b0c12;
                        border-radius: 18px;
                        padding: 12px 16px;
                        font-size: 18px;
                        line-height: 1;
                        font-weight: 900;
                        letter-spacing: -0.03em;
                    ">
                        AAACCU
                    </div>
                </td>
            </tr>
        `;

    const actionHtml =
        actionLabel && actionUrl
            ? `
                <div style="margin-top: 32px;">
                    <a
                        href="${escapeHtml(actionUrl)}"
                        style="
                            display: inline-block;
                            background: #9cd91a;
                            color: #0b0c12;
                            text-decoration: none;
                            font-weight: 800;
                            font-size: 14px;
                            padding: 14px 20px;
                            border-radius: 14px;
                        "
                    >
                        ${escapeHtml(actionLabel)}
                    </a>
                </div>
            `
            : "";

    return `
        <!doctype html>
        <html lang="pt-BR">
            <head>
                <meta charset="utf-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <meta name="color-scheme" content="dark" />
                <meta
                    name="supported-color-schemes"
                    content="dark"
                />
                <title>${safeTitle}</title>
            </head>

            <body style="
                margin: 0;
                padding: 0;
                background: #0b0c12;
                color: #f7f7f8;
                font-family: Arial, Helvetica, sans-serif;
            ">
                ${
        preview
            ? `
                            <div
                                style="
                                    display: none;
                                    max-height: 0;
                                    overflow: hidden;
                                "
                            >
                                ${escapeHtml(preview)}
                            </div>
                        `
            : ""
    }

                <table
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    role="presentation"
                    style="
                        width: 100%;
                        min-height: 720px;
                        background: #0b0c12;
                        padding: 34px 18px;
                    "
                >
                    <tr>
                        <td align="center" valign="top">
                            <table
                                width="100%"
                                cellpadding="0"
                                cellspacing="0"
                                role="presentation"
                                style="
                                    width: 100%;
                                    max-width: 600px;
                                    background: #171a23;
                                    border: 1px solid #272b36;
                                    border-radius: 26px;
                                    overflow: hidden;
                                    box-shadow:
                                        0 24px 80px
                                        rgba(0, 0, 0, 0.38);
                                "
                            >
                                ${logoHtml}

                                <tr>
                                    <td
                                        align="center"
                                        style="
                                            padding: 10px 34px 0;
                                        "
                                    >
                                        <div style="
                                            display: inline-block;
                                            background:
                                                rgba(156, 217, 26, 0.10);
                                            color: #9cd91a;
                                            border:
                                                1px solid
                                                rgba(156, 217, 26, 0.28);
                                            border-radius: 999px;
                                            padding: 7px 11px;
                                            font-size: 12px;
                                            line-height: 1;
                                            font-weight: 800;
                                            margin-bottom: 20px;
                                        ">
                                            ${safeBadgeLabel}
                                        </div>

                                        <h1 style="
                                            margin: 0;
                                            color: #f7f7f8;
                                            font-size: 30px;
                                            line-height: 1.12;
                                            letter-spacing: -0.045em;
                                        ">
                                            ${safeTitle}
                                        </h1>
                                    </td>
                                </tr>

                                <tr>
                                    <td style="
                                        padding: 24px 34px 38px;
                                        color: #a6abb7;
                                        font-size: 15px;
                                        line-height: 1.75;
                                    ">
                                        ${content}
                                        ${actionHtml}
                                    </td>
                                </tr>
                            </table>

                            <table
                                width="100%"
                                cellpadding="0"
                                cellspacing="0"
                                role="presentation"
                                style="
                                    width: 100%;
                                    max-width: 600px;
                                "
                            >
                                <tr>
                                    <td
                                        align="center"
                                        style="
                                            padding: 18px 16px 0;
                                            color: #707684;
                                            font-size: 12px;
                                            line-height: 1.6;
                                        "
                                    >
                                        ${safeFooterText}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
        </html>
    `;
}