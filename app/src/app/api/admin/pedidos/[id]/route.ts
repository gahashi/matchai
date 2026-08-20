import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    requireAdminApiAccess,
} from "@/lib/auth/require-api-access";

import {
    pedidoService,
    type PedidoStatusCode,
} from "@/lib/vnd/pedido-service";

type RouteParams = {
    params: Promise<{
        id: string;
    }>;
};

function parsePedidoId(
    value: string,
) {
    const id =
        Number(value);

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        return null;
    }

    return id;
}

export async function GET(
    request: NextRequest,
    { params }: RouteParams,
) {
    const access =
        await requireAdminApiAccess(
            request,
        );

    if (!access.ok) {
        return access.response;
    }

    try {
        const { id } =
            await params;

        const pedidoId =
            parsePedidoId(id);

        if (!pedidoId) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Pedido inválido.",
                },
                {
                    status: 400,
                },
            );
        }

        const pedido =
            await pedidoService.findById(
                pedidoId,
            );

        if (!pedido) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Pedido não encontrado.",
                },
                {
                    status: 404,
                },
            );
        }

        return NextResponse.json({
            ok: true,
            data: {
                pedido,

                proximos_status:
                    pedidoService
                        .getAllowedNextStatuses(
                            pedido
                                .status
                                .codigo,
                        ),
            },
        });
    } catch (error) {
        console.error(
            "[admin.pedidos.detail]",
            error,
        );

        return NextResponse.json(
            {
                ok: false,
                message:
                    "Não foi possível carregar o pedido.",
            },
            {
                status: 500,
            },
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: RouteParams,
) {
    const access =
        await requireAdminApiAccess(
            request,
        );

    if (!access.ok) {
        return access.response;
    }

    try {
        const { id } =
            await params;

        const pedidoId =
            parsePedidoId(id);

        if (!pedidoId) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Pedido inválido.",
                },
                {
                    status: 400,
                },
            );
        }

        const body =
            await request.json();

        if (
            body?.action !==
            "set_status"
        ) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Ação inválida.",
                },
                {
                    status: 400,
                },
            );
        }

        const statusCode =
            String(
                body.status_code ??
                "",
            ).trim();

        if (!statusCode) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Informe o novo status.",
                },
                {
                    status: 400,
                },
            );
        }

        const pedido =
            await pedidoService.updateStatus(
                {
                    id: pedidoId,

                    statusCode:
                        statusCode as PedidoStatusCode,

                    observacao:
                        body.observacao
                            ? String(
                                body.observacao,
                            )
                            : null,

                    updatedBySysUsuarioId:
                    access.session.user.id,
                },
            );

        return NextResponse.json({
            ok: true,
            message:
                pedido.status.codigo ===
                "cancelado"
                    ? "Pedido cancelado com sucesso. Nenhum estorno foi realizado."
                    : "Status do pedido atualizado com sucesso.",

            data: {
                pedido,

                proximos_status:
                    pedidoService
                        .getAllowedNextStatuses(
                            pedido
                                .status
                                .codigo,
                        ),
            },
        });
    } catch (error) {
        console.error(
            "[admin.pedidos.update]",
            error,
        );

        return NextResponse.json(
            {
                ok: false,

                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível atualizar o pedido.",
            },
            {
                status: 400,
            },
        );
    }
}