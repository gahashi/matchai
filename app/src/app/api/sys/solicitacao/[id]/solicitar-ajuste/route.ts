import { NextRequest, NextResponse } from "next/server";

import { requireApiAccess } from "@/lib/auth/require-api-access";
import {
    getSolicitacaoErrorStatus,
    solicitacaoService,
} from "@/lib/sys/solicitacao/solicitacao-service";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
    const access = await requireApiAccess(request, {
        permissions: ["solicitacao.solicitar_ajuste"],
    });

    if (!access.ok) {
        return access.response;
    }

    try {
        const { id } = await context.params;
        const body = await request.json();
        const solicitacaoId = Number(id);

        if (!Number.isInteger(solicitacaoId)) {
            throw new Error("Solicitação inválida.");
        }

        if (!body.descricao) {
            throw new Error("Informe o ajuste solicitado.");
        }

        const solicitacao = await solicitacaoService.solicitarAjuste({
            solicitacaoId,
            sysUsuarioId: access.session.user.id,
            descricao: body.descricao,
            metadata: body.metadata ?? null,
        });

        return NextResponse.json({
            ok: true,
            solicitacao,
        });
    } catch (error) {
        return NextResponse.json(
            {
                ok: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível solicitar ajuste.",
            },
            {
                status: getSolicitacaoErrorStatus(error),
            }
        );
    }
}