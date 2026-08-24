import {
    baseEmailTemplate,
} from "@/lib/email/templates/base-email-template";

import {
    sendEmail,
} from "@/lib/email/send-email";

export type PedidoEmailItem = {
    nome: string;
    variacao?: string | null;
    quantidade: number;
};

type PedidoEmailBaseParams = {
    pedidoId: number;
    codigo: string;

    sysUsuarioId?: number | null;

    clienteNome: string;
    clienteEmail: string;

    itens: PedidoEmailItem[];

    acompanhamentoUrl: string;
};

type PedidoCanceladoEmailParams =
    PedidoEmailBaseParams & {
    motivo?: string | null;
};

type PedidoProntoRetiradaEmailParams =
    PedidoEmailBaseParams & {
    retiradaLocal?: string | null;
};

export function getPedidoAcompanhamentoUrl() {
    const appUrl =
        process.env.NEXT_PUBLIC_APP_URL?.trim();

    if (!appUrl) {
        throw new Error(
            "NEXT_PUBLIC_APP_URL não está configurada.",
        );
    }

    return (
        appUrl.replace(/\/+$/, "") +
        "/acompanhar-pedido"
    );
}

function escapeHtml(value: string) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function buildPedidoCode(codigo: string) {
    return `
        <div style="
            margin: 26px 0;
            padding: 22px 18px;
            background: #11131b;
            border: 1px solid #2b3028;
            border-radius: 18px;
            text-align: center;
        ">
            <div style="
                margin-bottom: 7px;
                color: #7f8694;
                font-size: 12px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.08em;
            ">
                Código do pedido
            </div>

            <div style="
                color: #9cd91a;
                font-size: 30px;
                line-height: 1.1;
                font-weight: 900;
                letter-spacing: 0.08em;
            ">
                ${escapeHtml(codigo)}
            </div>
        </div>
    `;
}

function buildItens(itens: PedidoEmailItem[]) {
    if (itens.length === 0) {
        return "";
    }

    const rows = itens
        .map((item) => {
            const descricao = item.variacao
                ? `${item.nome} · ${item.variacao}`
                : item.nome;

            return `
                <tr>
                    <td
                        style="
                            padding: 10px 0;
                            color: #f4f4f5;
                            border-bottom:
                                1px solid #272b36;
                        "
                    >
                        ${escapeHtml(descricao)}
                    </td>

                    <td
                        align="right"
                        style="
                            padding: 10px 0 10px 16px;
                            color: #a6abb7;
                            border-bottom:
                                1px solid #272b36;
                            white-space: nowrap;
                        "
                    >
                        ${item.quantidade}x
                    </td>
                </tr>
            `;
        })
        .join("");

    return `
        <div style="margin-top: 26px;">
            <div style="
                margin-bottom: 8px;
                color: #7f8694;
                font-size: 12px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.07em;
            ">
                Itens do pedido
            </div>

            <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                role="presentation"
            >
                ${rows}
            </table>
        </div>
    `;
}

function buildMetadata(
    pedidoId: number,
    codigo: string,
    evento: string,
) {
    return JSON.stringify({
        pedido_id: pedidoId,
        pedido_codigo: codigo,
        evento,
    });
}

export async function sendPedidoPagamentoAprovadoEmail(
    params: PedidoEmailBaseParams,
) {
    const nome = escapeHtml(
        params.clienteNome.trim(),
    );

    const html = baseEmailTemplate({
        title: `Compra aprovada — Pedido #${params.codigo}`,

        preview:
            `Seu pagamento foi aprovado. Pedido #${params.codigo}.`,

        badgeLabel:
            "Pagamento aprovado",

        content: `
            <p style="margin:0 0 16px;">
                Olá, ${nome}.
            </p>

            <p style="margin:0 0 16px;">
                Seu pagamento foi aprovado e o pedido já está confirmado.
            </p>

            ${buildPedidoCode(params.codigo)}

            <p style="margin:0;">
                Guarde este código. Ele permite acompanhar o andamento
                da compra junto com o telefone informado no pedido.
            </p>

            ${buildItens(params.itens)}
        `,

        actionLabel:
            "Acompanhar pedido",

        actionUrl:
        params.acompanhamentoUrl,

        footerText:
            "Mensagem automática da AAACCU sobre o seu pedido.",
    });

    return sendEmail({
        to: params.clienteEmail,

        subject:
            `Compra aprovada — Pedido #${params.codigo}`,

        html,

        text:
            `Olá, ${params.clienteNome}. ` +
            `Seu pagamento foi aprovado. ` +
            `Código do pedido: ${params.codigo}. ` +
            `Acompanhe em: ${params.acompanhamentoUrl}`,

        template:
            "order_payment_approved",

        sysUsuarioId:
            params.sysUsuarioId ?? null,

        metadataText:
            buildMetadata(
                params.pedidoId,
                params.codigo,
                "confirmado",
            ),
    });
}

export async function sendPedidoProntoRetiradaEmail(
    params: PedidoProntoRetiradaEmailParams,
) {
    const nome = escapeHtml(
        params.clienteNome.trim(),
    );

    const retiradaLocal =
        params.retiradaLocal?.trim();

    const html = baseEmailTemplate({
        title:
            `Pedido #${params.codigo} pronto para retirada`,

        preview:
            `Seu pedido #${params.codigo} já pode ser retirado.`,

        badgeLabel:
            "Pronto para retirada",

        content: `
            <p style="margin:0 0 16px;">
                Olá, ${nome}.
            </p>

            <p style="margin:0 0 16px;">
                Seu pedido já está pronto e pode ser retirado.
            </p>

            ${buildPedidoCode(params.codigo)}

            ${
            retiradaLocal
                ? `
                        <div style="
                            margin: 22px 0;
                            padding: 16px 18px;
                            background: #11131b;
                            border: 1px solid #272b36;
                            border-radius: 16px;
                        ">
                            <strong
                                style="
                                    display:block;
                                    margin-bottom:4px;
                                    color:#f4f4f5;
                                "
                            >
                                Local da retirada
                            </strong>

                            <span>
                                ${escapeHtml(retiradaLocal)}
                            </span>
                        </div>
                    `
                : ""
        }

            ${buildItens(params.itens)}

            <p style="margin:24px 0 0;">
                Você também pode consultar o andamento do pedido
                pelo código acima.
            </p>
        `,

        actionLabel:
            "Acompanhar pedido",

        actionUrl:
        params.acompanhamentoUrl,

        footerText:
            "Mensagem automática da AAACCU sobre o seu pedido.",
    });

    return sendEmail({
        to: params.clienteEmail,

        subject:
            `Pedido #${params.codigo} pronto para retirada`,

        html,

        text:
            `Olá, ${params.clienteNome}. ` +
            `Seu pedido #${params.codigo} está pronto para retirada.` +
            (
                retiradaLocal
                    ? ` Local: ${retiradaLocal}.`
                    : ""
            ) +
            ` Acompanhe em: ${params.acompanhamentoUrl}`,

        template:
            "order_ready_for_pickup",

        sysUsuarioId:
            params.sysUsuarioId ?? null,

        metadataText:
            buildMetadata(
                params.pedidoId,
                params.codigo,
                "pronto_retirada",
            ),
    });
}

export async function sendPedidoCanceladoEmail(
    params: PedidoCanceladoEmailParams,
) {
    const nome = escapeHtml(
        params.clienteNome.trim(),
    );

    const motivo =
        params.motivo?.trim();

    const html = baseEmailTemplate({
        title:
            `Pedido #${params.codigo} cancelado`,

        preview:
            `O pedido #${params.codigo} foi cancelado.`,

        badgeLabel:
            "Pedido cancelado",

        content: `
            <p style="margin:0 0 16px;">
                Olá, ${nome}.
            </p>

            <p style="margin:0 0 16px;">
                O pedido abaixo foi cancelado.
            </p>

            ${buildPedidoCode(params.codigo)}
            
            ${
            motivo
                ? `
            <div style="
                margin: 22px 0;
                padding: 16px 18px;
                background: #11131b;
                border: 1px solid #272b36;
                border-radius: 16px;
            ">
                <strong
                    style="
                        display:block;
                        margin-bottom:4px;
                        color:#f4f4f5;
                    "
                >
                    Motivo do cancelamento
                </strong>

                <span>
                    ${escapeHtml(motivo)}
                </span>
            </div>
        `
                : ""
        }

            ${buildItens(params.itens)}

            <p style="margin:24px 0 0;">
                Você pode consultar o registro e o andamento do
                pedido usando o código acima.
            </p>
        `,

        actionLabel:
            "Consultar pedido",

        actionUrl:
        params.acompanhamentoUrl,

        footerText:
            "Mensagem automática da AAACCU sobre o seu pedido.",
    });

    return sendEmail({
        to: params.clienteEmail,

        subject:
            `Pedido #${params.codigo} cancelado`,

        html,

        text:
            `Olá, ${params.clienteNome}. ` +
            `O pedido #${params.codigo} foi cancelado.` +
            (
                motivo
                    ? ` Motivo: ${motivo}.`
                    : ""
            ) +
            ` Consulte em: ${params.acompanhamentoUrl}`,

        template:
            "order_cancelled",

        sysUsuarioId:
            params.sysUsuarioId ?? null,

        metadataText:
            buildMetadata(
                params.pedidoId,
                params.codigo,
                "cancelado",
            ),
    });
}