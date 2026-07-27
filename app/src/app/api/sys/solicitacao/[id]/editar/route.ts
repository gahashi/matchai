import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    requireApiAccess,
} from "@/lib/auth/require-api-access";
import {
    getSolicitacaoErrorStatus,
    solicitacaoService,
} from "@/lib/sys/solicitacao/solicitacao-service";
import type {
    JsonLike,
} from "@/lib/sys/solicitacao/solicitacao-types";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

type EditarSolicitacaoBody = {
    titulo?: unknown;
    descricao?: unknown;
    payload?: unknown;
    metadata?: unknown;
};

function isJsonLike(
    value: unknown
): value is JsonLike {
    if (value === null) {
        return true;
    }

    return (
        Array.isArray(value) ||
        typeof value === "object"
    );
}

export async function PATCH(
    request: NextRequest,
    context: RouteContext
) {
    const access =
        await requireApiAccess(request);

    if (!access.ok) {
        return access.response;
    }

    try {
        const { id } = await context.params;
        const solicitacaoId = Number(id);

        if (
            !Number.isInteger(solicitacaoId) ||
            solicitacaoId <= 0
        ) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Solicitação inválida.",
                },
                {
                    status: 400,
                }
            );
        }

        const body =
            (await request.json()) as
                EditarSolicitacaoBody;

        if (
            body.payload === undefined ||
            !isJsonLike(body.payload)
        ) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Informe um payload válido para atualizar a solicitação.",
                },
                {
                    status: 400,
                }
            );
        }

        if (
            body.titulo !== undefined &&
            typeof body.titulo !== "string"
        ) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "O título informado é inválido.",
                },
                {
                    status: 400,
                }
            );
        }

        if (
            body.descricao !== undefined &&
            body.descricao !== null &&
            typeof body.descricao !== "string"
        ) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "A descrição informada é inválida.",
                },
                {
                    status: 400,
                }
            );
        }

        if (
            body.metadata !== undefined &&
            !isJsonLike(body.metadata)
        ) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Os metadados informados são inválidos.",
                },
                {
                    status: 400,
                }
            );
        }

        const solicitacao =
            await solicitacaoService.atualizarPayload({
                solicitacaoId,
                sysUsuarioId:
                access.session.user.id,
                titulo:
                    typeof body.titulo ===
                    "string"
                        ? body.titulo
                        : undefined,
                descricao:
                    body.descricao === null ||
                    typeof body.descricao ===
                    "string"
                        ? body.descricao
                        : undefined,
                payload: body.payload,
                metadata:
                    body.metadata === undefined
                        ? undefined
                        : body.metadata,
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
                        : "Não foi possível atualizar a solicitação.",
            },
            {
                status:
                    getSolicitacaoErrorStatus(
                        error
                    ),
            }
        );
    }
}