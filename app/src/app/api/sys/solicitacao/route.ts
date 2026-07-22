import { prisma } from "@/lib/prisma";
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

function slugify(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

async function validarSlugCriarAtletica(body: any) {
    if (body?.tipoCodigo !== "criar_atletica") {
        return null;
    }

    const atleticaPayload = body?.payload?.atletica ?? body?.payload ?? {};
    const slug = slugify(String(atleticaPayload.slug ?? ""));

    if (!slug) {
        return NextResponse.json(
            {
                ok: false,
                field: "slug",
                message: "Informe um endereço público válido para a atlética.",
            },
            { status: 400 }
        );
    }

    const slugExistente = await prisma.atlAtletica.findFirst({
        where: {
            slug,
            deleted_at: null,
        },
        select: {
            id: true,
        },
    });

    if (slugExistente) {
        return NextResponse.json(
            {
                ok: false,
                field: "slug",
                message:
                    "Este endereço público já está em uso. Escolha outro, como computaria-itajai.",
            },
            { status: 409 }
        );
    }

    return null;
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
    try {
        const body = await request.json();

        const isCriarAtletica = body?.tipoCodigo === "criar_atletica";

        const access = await requireApiAccess(
            request,
            isCriarAtletica
                ? {}
                : {
                    permissions: ["solicitacao.criar"],
                }
        );

        if (!access.ok) {
            return access.response;
        }

        const erroSlug = await validarSlugCriarAtletica(body);

        if (erroSlug) {
            return erroSlug;
        }

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