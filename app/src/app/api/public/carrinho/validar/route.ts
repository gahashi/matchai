import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthSession } from "@/lib/auth/session";
import { produtoPublicService } from "@/lib/prd/produto-public-service";
import { socioPublicService } from "@/lib/soc/socio-public-service";

const schema = z.object({
    items: z
        .array(
            z.object({
                produto_id: z.number().int().positive(),
                variacao_id: z.number().int().positive().nullable(),
                quantidade: z.number().int().min(1).max(99),
            }),
        )
        .max(50),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = schema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    ok: false,
                    message: parsed.error.issues[0]?.message ?? "Carrinho inválido.",
                },
                { status: 400 },
            );
        }

        const session = await getAuthSession({
            headers: request.headers,
        });

        const socio = session
            ? await socioPublicService.getSocioAtual(session.user.id)
            : {
                isSocio: false as const,
                socio: null,
            };

        const items = await produtoPublicService.validateCart(
            parsed.data.items.map((item) => ({
                produtoId: item.produto_id,
                variacaoId: item.variacao_id,
                quantidade: item.quantidade,
            })),
            {
                isSocio: socio.isSocio,
            },
        );

        return NextResponse.json({
            ok: true,
            data: {
                is_socio: socio.isSocio,
                items,
            },
        });
    } catch (error) {
        console.error("[public.cart.validate]", error);

        return NextResponse.json(
            {
                ok: false,
                message: "Não foi possível validar o carrinho.",
            },
            { status: 500 },
        );
    }
}
