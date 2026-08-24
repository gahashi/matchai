import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    requireAdminApiAccess,
} from "@/lib/auth/require-api-access";

import {
    pedidoService,
    type PedidoEmailEvento,
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

        const emails =
            await pedidoService
                .getEmailNotifications(
                    pedidoId,
                );

        return NextResponse.json({
            ok: true,
            data: {
                pedido,

                emails,

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

        const action =
            String(
                body?.action ?? "",
            ).trim();

        if (
            action !== "set_status" &&
            action !== "resend_email"
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

        if (
            action === "resend_email"
        ) {
            const evento =
                String(
                    body.evento ?? "",
                ).trim();

            if (
                evento !== "confirmado" &&
                evento !== "pronto_retirada" &&
                evento !== "cancelado"
            ) {
                return NextResponse.json(
                    {
                        ok: false,
                        message:
                            "Evento de e-mail inválido.",
                    },
                    {
                        status: 400,
                    },
                );
            }

            const result =
                await pedidoService.resendEmail({
                    pedidoId,

                    evento:
                        evento as PedidoEmailEvento,
                });

            const pedido =
                await pedidoService.findById(
                    pedidoId,
                );

            if (!pedido) {
                throw new Error(
                    "Pedido não encontrado após o reenvio.",
                );
            }

            return NextResponse.json({
                ok: true,

                message:
                    "E-mail reenviado com sucesso.",

                data: {
                    pedido,

                    emails:
                    result.emails,

                    proximos_status:
                        pedidoService
                            .getAllowedNextStatuses(
                                pedido
                                    .status
                                    .codigo,
                            ),
                },
            });
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