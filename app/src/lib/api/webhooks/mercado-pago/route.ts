import {
    createHmac,
    timingSafeEqual,
} from "node:crypto";

import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    getMercadoPagoPayment,
} from "@/lib/fin/mercado-pago";
import {
    pedidoPublicService,
} from "@/lib/vnd/pedido-public-service";

function parseSignature(value: string | null) {
    if (!value) return null;

    const parts = Object.fromEntries(
        value
            .split(",")
            .map((part) => part.trim().split("=", 2))
            .filter(
                (part): part is [string, string] =>
                    part.length === 2 && Boolean(part[0]) && Boolean(part[1]),
            ),
    );

    if (!parts.ts || !parts.v1) return null;

    return {
        ts: parts.ts,
        signature: parts.v1,
    };
}

function validateWebhookSignature(input: {
    xSignature: string | null;
    xRequestId: string | null;
    dataId: string | null;
    secret: string;
}) {
    const parsed = parseSignature(input.xSignature);

    if (!parsed || !input.dataId) return false;

    const templateParts = [
        `id:${input.dataId.toLowerCase()};`,
        input.xRequestId
            ? `request-id:${input.xRequestId};`
            : "",
        `ts:${parsed.ts};`,
    ];

    const expected = createHmac(
        "sha256",
        input.secret,
    )
        .update(templateParts.join(""))
        .digest("hex");

    const receivedBuffer = Buffer.from(
        parsed.signature,
        "utf8",
    );
    const expectedBuffer = Buffer.from(
        expected,
        "utf8",
    );

    return (
        receivedBuffer.length === expectedBuffer.length &&
        timingSafeEqual(
            receivedBuffer,
            expectedBuffer,
        )
    );
}

export async function POST(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const dataId =
            url.searchParams.get("data.id") ??
            url.searchParams.get("data_id");
        const type = url.searchParams.get("type");
        const webhookSecret =
            process.env.MERCADO_PAGO_WEBHOOK_SECRET?.trim();

        if (webhookSecret) {
            const valid = validateWebhookSignature({
                xSignature:
                    request.headers.get("x-signature"),
                xRequestId:
                    request.headers.get("x-request-id"),
                dataId,
                secret: webhookSecret,
            });

            if (!valid) {
                return NextResponse.json(
                    {
                        ok: false,
                        message: "Assinatura inválida.",
                    },
                    { status: 401 },
                );
            }
        } else if (process.env.NODE_ENV === "production") {
            console.error(
                "[mercado-pago.webhook] MERCADO_PAGO_WEBHOOK_SECRET ausente em produção.",
            );

            return NextResponse.json(
                {
                    ok: false,
                    message: "Webhook não configurado.",
                },
                { status: 503 },
            );
        }

        if (type && type !== "payment") {
            return NextResponse.json({ ok: true });
        }

        if (!dataId) {
            return NextResponse.json({
                ok: true,
                ignored: true,
            });
        }

        const payment =
            await getMercadoPagoPayment(dataId);

        const result =
            await pedidoPublicService.applyMercadoPagoWebhook(
                payment,
            );

        return NextResponse.json({
            ok: true,
            updated: result.updated,
        });
    } catch (error) {
        console.error(
            "[mercado-pago.webhook]",
            error,
        );

        return NextResponse.json(
            {
                ok: false,
                message: "Falha ao processar webhook.",
            },
            { status: 500 },
        );
    }
}
