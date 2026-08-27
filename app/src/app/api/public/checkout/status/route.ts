import {
    NextRequest,
    NextResponse,
} from "next/server";
import {
    z,
} from "zod";

import {
    getMercadoPagoPayment,
    getMercadoPagoPixData,
} from "@/lib/fin/mercado-pago";
import {
    pedidoPublicService,
} from "@/lib/vnd/pedido-public-service";

const schema = z.object({
    pedido_codigo: z
        .string()
        .trim()
        .regex(/^[A-Z2-9]{6}$/),
    pagamento_id: z
        .string()
        .trim()
        .min(1)
        .max(80),
});

export async function POST(
    request: NextRequest,
) {
    try {
        const parsed = schema.safeParse(
            await request.json(),
        );

        if (!parsed.success) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "Pagamento inválido.",
                },
                { status: 400 },
            );
        }

        const localPayment =
            await pedidoPublicService.findPaymentForPublicStatus({
                orderCode:
                    parsed.data.pedido_codigo,
                externalPaymentId:
                    parsed.data.pagamento_id,
            });

        if (!localPayment) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "Pagamento não encontrado.",
                },
                { status: 404 },
            );
        }

        const payment =
            await getMercadoPagoPayment(
                parsed.data.pagamento_id,
            );
        const pix = getMercadoPagoPixData(
            payment,
        );

        await pedidoPublicService.applyMercadoPagoPayment({
            finPagamentoId: localPayment.id,
            payment,
            qrCodeText: pix.qrCodeText,
            paymentUrl: pix.ticketUrl,
        });

        return NextResponse.json({
            ok: true,
            data: {
                status:
                    payment.status ?? "pending",
                status_detail:
                    payment.status_detail ?? null,
                qr_code_text: pix.qrCodeText,
                qr_code_base64:
                    pix.qrCodeBase64,
                payment_url: pix.ticketUrl,
            },
        });
    } catch (error) {
        console.error(
            "[public.checkout.status]",
            error,
        );

        return NextResponse.json(
            {
                ok: false,
                message:
                    "Não foi possível atualizar o pagamento.",
            },
            { status: 500 },
        );
    }
}
