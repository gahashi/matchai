import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdminApiAccess } from "@/lib/auth/require-api-access";
import { socioService } from "@/lib/soc/socio-service";

const schema = z.object({
    soc_plano_id: z.number().int().positive(),
    soc_socio_status_id: z.number().int().positive(),
    inicio_at: z.string().min(1),
    fim_at: z.string().min(1),
    observacao: z.string().max(500).optional().nullable(),
});

type RouteParams = {
    params: Promise<{ id: string }>;
};

function parseId(value: string) {
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) {
        throw new Error("Associação inválida.");
    }
    return id;
}

function parseDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new Error("Data inválida.");
    return date;
}

export async function PATCH(
    request: NextRequest,
    { params }: RouteParams,
) {
    const access = await requireAdminApiAccess(request);
    if (!access.ok) return access.response;

    try {
        const { id } = await params;
        const socioId = parseId(id);
        const body = await request.json();

        if (body?.action === "renovar") {
            const socio = await socioService.renovar(socioId);
            return NextResponse.json({
                ok: true,
                message: "Associação renovada com sucesso.",
                data: { socio },
            });
        }

        if (body?.action === "cancelar" || body?.action === "bloquear") {
            const socio = await socioService.setStatusByCodigo(
                socioId,
                body.action === "cancelar" ? "cancelado" : "bloqueado",
            );
            return NextResponse.json({
                ok: true,
                message:
                    body.action === "cancelar"
                        ? "Associação cancelada."
                        : "Associação bloqueada.",
                data: { socio },
            });
        }

        if (body?.action === "set_status") {
            const statusId = Number(body.soc_socio_status_id);
            if (!Number.isInteger(statusId) || statusId <= 0) {
                return NextResponse.json(
                    { ok: false, message: "Status inválido." },
                    { status: 400 },
                );
            }

            const socio = await socioService.setStatus(socioId, statusId);
            return NextResponse.json({
                ok: true,
                message: "Status atualizado com sucesso.",
                data: { socio },
            });
        }

        const parsed = schema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                {
                    ok: false,
                    message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
                },
                { status: 400 },
            );
        }

        const socio = await socioService.update({
            id: socioId,
            socPlanoId: parsed.data.soc_plano_id,
            socSocioStatusId: parsed.data.soc_socio_status_id,
            inicioAt: parseDate(parsed.data.inicio_at),
            fimAt: parseDate(parsed.data.fim_at),
            observacao: parsed.data.observacao ?? null,
        });

        return NextResponse.json({
            ok: true,
            message: "Associação atualizada com sucesso.",
            data: { socio },
        });
    } catch (error) {
        console.error("[admin.socios.update]", error);

        const message =
            error instanceof Error
                ? error.message
                : "Não foi possível atualizar a associação.";

        return NextResponse.json(
            { ok: false, message },
            { status: message === "Associação não encontrada." ? 404 : 400 },
        );
    }
}
