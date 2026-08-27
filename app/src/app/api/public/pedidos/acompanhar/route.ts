import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    pedidoPublicService,
} from "@/lib/vnd/pedido-public-service";

export async function POST(
    request: NextRequest,
) {
    try {
        const body =
            await request.json();

        const codigo =
            String(
                body?.codigo ?? "",
            )
                .trim()
                .toUpperCase();

        const telefone =
            String(
                body?.telefone ?? "",
            ).trim();

        if (
            !codigo ||
            !telefone
        ) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Informe o código do pedido e o telefone da compra.",
                },
                {
                    status: 400,
                },
            );
        }

        const pedido =
            await pedidoPublicService
                .findPublicOrderByCodeAndPhone({
                    codigo,
                    telefone,
                });

        if (!pedido) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Pedido não encontrado. Confira o código e o telefone informados.",
                },
                {
                    status: 404,
                },
            );
        }

        return NextResponse.json({
            ok: true,
            data: {
                pedido,
            },
        });
    } catch (error) {
        console.error(
            "[public.pedidos.acompanhar]",
            error,
        );

        return NextResponse.json(
            {
                ok: false,
                message:
                    "Não foi possível consultar o pedido agora.",
            },
            {
                status: 500,
            },
        );
    }
}