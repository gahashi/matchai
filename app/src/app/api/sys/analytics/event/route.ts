import {
    NextRequest,
    NextResponse,
} from "next/server";

import { z } from "zod";

import {
    getAuthSession,
} from "@/lib/auth/session";

import {
    prisma,
} from "@/lib/prisma";

const schema = z.object({
    session_id: z
        .string()
        .min(1)
        .max(100),

    tipo: z
        .string()
        .min(1)
        .max(40),

    nome: z
        .string()
        .min(1)
        .max(100)
        .nullable()
        .optional(),

    rota: z
        .string()
        .min(1)
        .max(500),

    rota_anterior: z
        .string()
        .max(500)
        .nullable()
        .optional(),

    entidade_tipo: z
        .string()
        .min(1)
        .max(50)
        .nullable()
        .optional(),

    entidade_id: z
        .number()
        .int()
        .positive()
        .nullable()
        .optional(),
});

export async function POST(
    request: NextRequest,
) {
    try {
        const body =
            await request.json();

        const parsed =
            schema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Evento de analytics inválido.",
                },
                {
                    status: 400,
                },
            );
        }

        const session =
            await getAuthSession({
                headers:
                request.headers,
            });

        await prisma.sysAnalyticsEvento.create({
            data: {
                sys_usuario_id:
                    session?.user.id ??
                    null,

                session_id:
                parsed.data.session_id,

                tipo:
                parsed.data.tipo,

                nome:
                    parsed.data.nome ??
                    null,

                rota:
                parsed.data.rota,

                rota_anterior:
                    parsed.data
                        .rota_anterior ??
                    null,

                entidade_tipo:
                    parsed.data
                        .entidade_tipo ??
                    null,

                entidade_id:
                    parsed.data
                        .entidade_id ??
                    null,

                created_at:
                    new Date(),
            },
        });

        return NextResponse.json({
            ok: true,
        });
    } catch (error) {
        console.error(
            "[analytics.event]",
            error,
        );

        /*
         * Analytics nunca deve atrapalhar
         * a navegação normal do usuário.
         */
        return NextResponse.json(
            {
                ok: false,
                message:
                    "Não foi possível registrar o evento.",
            },
            {
                status: 500,
            },
        );
    }
}