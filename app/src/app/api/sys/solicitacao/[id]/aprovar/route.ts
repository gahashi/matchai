import { NextRequest, NextResponse } from "next/server";

import { requireApiAccess } from "@/lib/auth/require-api-access";
import { solicitacaoCriarAtleticaService } from "../../../../../../lib/ent/entidade/solicitacao-criar-atletica";
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
        permissions: ["solicitacao.aprovar"],
    });

    if (!access.ok) {
        return access.response;
    }

    try {
        const { id } = await context.params;
        const body = await request.json().catch(() => ({}));
        const solicitacaoId = Number(id);

        if (!Number.isInteger(solicitacaoId)) {
            throw new Error("Solicitação inválida.");
        }

        await solicitacaoService.aprovar({
            solicitacaoId,
            sysUsuarioId: access.session.user.id,
            descricao: body.descricao ?? null,
            metadata: body.metadata ?? null,
        });

        const detalhe = await solicitacaoService.detalhar({
            solicitacaoId,
            sysUsuarioId: access.session.user.id,
        });

        if (!detalhe) {
            throw new Error("Solicitação não encontrada após aprovação.");
        }

        let resultadoAplicacao = null;

        if (detalhe.sys_solicitacao_tipo.codigo === "criar_atletica") {
            resultadoAplicacao =
                await solicitacaoCriarAtleticaService.aplicarCriacaoAtletica({
                    solicitacaoId,
                    sysUsuarioId: access.session.user.id,
                });
        }

        return NextResponse.json({
            ok: true,
            solicitacao: await solicitacaoService.detalhar({
                solicitacaoId,
                sysUsuarioId: access.session.user.id,
            }),
            resultadoAplicacao,
        });
    } catch (error) {
        return NextResponse.json(
            {
                ok: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível aprovar a solicitação.",
            },
            {
                status: getSolicitacaoErrorStatus(error),
            }
        );
    }
}