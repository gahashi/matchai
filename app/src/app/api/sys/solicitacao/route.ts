import { NextRequest, NextResponse } from "next/server";

import { requireApiAccess } from "@/lib/auth/require-api-access";
import { solicitacaoService } from "@/lib/sys/solicitacao/solicitacao-service";
import {
    SolicitacaoListScope,
    SolicitacaoListSort,
    SolicitacaoStatusCodigo,
    SolicitacaoTipoCodigo,
} from "@/lib/sys/solicitacao/solicitacao-types";

function toNumber(value: string | null) {
    if (!value) return undefined;

    const numberValue = Number(value);

    if (!Number.isInteger(numberValue)) {
        return undefined;
    }

    return numberValue;
}

export async function GET(request: NextRequest) {
    const access = await requireApiAccess(request, {
        permissions: ["solicitacao.visualizar"],
    });

    if (!access.ok) {
        return access.response;
    }

    const searchParams = request.nextUrl.searchParams;

    const result = await solicitacaoService.listar({
        sysUsuarioId: access.session.user.id,
        scope: (searchParams.get("scope") as SolicitacaoListScope | null) ?? "minhas",
        statusCodigo: searchParams.get("status") as SolicitacaoStatusCodigo | undefined,
        tipoCodigo: searchParams.get("tipo") as SolicitacaoTipoCodigo | undefined,
        page: toNumber(searchParams.get("page")),
        pageSize: toNumber(searchParams.get("pageSize")),
        sort: (searchParams.get("sort") as SolicitacaoListSort | null) ?? "recent",
    });

    return NextResponse.json({
        ok: true,
        ...result,
    });
}

export async function POST(request: NextRequest) {
    const access = await requireApiAccess(request, {
        permissions: ["solicitacao.criar"],
    });

    if (!access.ok) {
        return access.response;
    }

    try {
        const body = await request.json();

        const solicitacao = await solicitacaoService.criarRascunho({
            tipoCodigo: body.tipoCodigo,
            solicitadoPorUsuarioId: access.session.user.id,
            titulo: body.titulo,
            descricao: body.descricao ?? null,
            entidadeTipo: body.entidadeTipo ?? null,
            entidadeId: body.entidadeId ?? null,
            payload: body.payload ?? null,
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
                        : "Não foi possível criar a solicitação.",
            },
            {
                status: 400,
            }
        );
    }
}