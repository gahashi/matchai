import { NextRequest, NextResponse } from "next/server";

import { requireApiAccess } from "@/lib/auth/require-api-access";
import { prisma } from "@/lib/prisma";
import { solicitacaoService } from "@/lib/sys/solicitacao/solicitacao-service";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
    const access = await requireApiAccess(request);

    if (!access.ok) {
        return access.response;
    }

    try {
        const { id } = await context.params;
        const body = await request.json().catch(() => ({}));
        const solicitacaoId = Number(id);

        if (!Number.isInteger(solicitacaoId) || solicitacaoId <= 0) {
            throw new Error("Solicitação inválida.");
        }

        const solicitacaoBase = await prisma.sysSolicitacao.findFirst({
            where: {
                id: solicitacaoId,
                deleted_at: null,
            },
            select: {
                id: true,
                solicitado_por_usuario_id: true,
                sys_solicitacao_tipo: {
                    select: {
                        codigo: true,
                    },
                },
            },
        });

        if (!solicitacaoBase) {
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

        const isCriarAtleticaPropria =
            solicitacaoBase.sys_solicitacao_tipo.codigo === "criar_atletica" &&
            solicitacaoBase.solicitado_por_usuario_id === access.session.user.id;

        if (!isCriarAtleticaPropria) {
            const permissionAccess = await requireApiAccess(request, {
                permissions: ["solicitacao.criar"],
            });

            if (!permissionAccess.ok) {
                return permissionAccess.response;
            }
        }

        const solicitacao = await solicitacaoService.enviar({
            solicitacaoId,
            sysUsuarioId: access.session.user.id,
            descricaoHistorico: body.descricao ?? null,
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
                        : "Não foi possível enviar a solicitação.",
            },
            {
                status: 400,
            }
        );
    }
}