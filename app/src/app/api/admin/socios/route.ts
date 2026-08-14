import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminApiAccess } from "@/lib/auth/require-api-access";
import { socioService } from "@/lib/soc/socio-service";

const schema = z.object({
    sys_usuario_id: z.number().int().positive(),
    soc_plano_id: z.number().int().positive(),
    soc_socio_status_id: z.number().int().positive(),
    inicio_at: z.string().min(1),
    fim_at: z.string().min(1),
    observacao: z.string().max(500).optional().nullable(),
});

function parseDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new Error("Data inválida.");
    return date;
}

export async function GET(request: NextRequest) {
    const access = await requireAdminApiAccess(request);
    if (!access.ok) return access.response;

    try {
        return NextResponse.json({
            ok: true,
            data: await socioService.listAdminData(),
        });
    } catch (error) {
        console.error("[admin.socios.list]", error);
        return NextResponse.json(
            { ok: false, message: "Não foi possível carregar os sócios." },
            { status: 500 },
        );
    }
}

export async function POST(request: NextRequest) {
    const access = await requireAdminApiAccess(request);
    if (!access.ok) return access.response;

    try {
        const parsed = schema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json(
                {
                    ok: false,
                    message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
                },
                { status: 400 },
            );
        }

        const socio = await socioService.createManual({
            sysUsuarioId: parsed.data.sys_usuario_id,
            socPlanoId: parsed.data.soc_plano_id,
            socSocioStatusId: parsed.data.soc_socio_status_id,
            inicioAt: parseDate(parsed.data.inicio_at),
            fimAt: parseDate(parsed.data.fim_at),
            observacao: parsed.data.observacao ?? null,
        });

        return NextResponse.json(
            {
                ok: true,
                message: "Sócio adicionado com sucesso.",
                data: { socio },
            },
            { status: 201 },
        );
    } catch (error) {
        console.error("[admin.socios.create]", error);
        return NextResponse.json(
            {
                ok: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível adicionar o sócio.",
            },
            { status: 400 },
        );
    }
}
