import { NextRequest, NextResponse } from "next/server";

import { requireApiAccess } from "@/lib/auth/require-api-access";
import { solicitacaoService } from "@/lib/sys/solicitacao/solicitacao-service";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
    const access = await requireApiAccess(request, {
        permissions: ["solicitacao.visualizar"],
    });

    if (!access.ok) {
        return access.response;
    }

    const { id } = await context.params;
    const solicitacaoId = Number(id);

    if (!Number.isInteger(solicitacaoId)) {
        return NextResponse.json(
            {
                ok: false,
                message: "Solicitação inválida.",
            },
            {
                status: 400,
            }
        );
    }

    const solicitacao = await solicitacaoService.detalhar(solicitacaoId);

    if (!solicitacao) {
        return NextResponse.json(
            {
                ok: false,
                message: "Solicitação não encontrada.",
            },
            {
                status: 404,
            }
        );
    }

    return NextResponse.json({
        ok: true,
        solicitacao,
    });
}