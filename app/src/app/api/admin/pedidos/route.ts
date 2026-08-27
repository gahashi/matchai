import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    requireAdminApiAccess,
} from "@/lib/auth/require-api-access";

import {
    pedidoService,
    type CreatePedidoManualInput,
} from "@/lib/vnd/pedido-service";

export async function GET(
    request: NextRequest,
) {
    const access =
        await requireAdminApiAccess(
            request,
        );

    if (!access.ok) {
        return access.response;
    }

    try {
        const searchParams =
            request.nextUrl.searchParams;

        const data =
            await pedidoService.listAdminData(
                {
                    q:
                        searchParams.get(
                            "q",
                        ),

                    status:
                        searchParams.get(
                            "status",
                        ),
                },
            );

        return NextResponse.json({
            ok: true,
            data,
        });
    } catch (error) {
        console.error(
            "[admin.pedidos.list]",
            error,
        );

        return NextResponse.json(
            {
                ok: false,
                message:
                    "Não foi possível carregar os pedidos.",
            },
            {
                status: 500,
            },
        );
    }
}

export async function POST(
    request: NextRequest,
) {
    const access =
        await requireAdminApiAccess(
            request,
        );

    if (!access.ok) {
        return access.response;
    }

    try {
        const body =
            await request.json();

        const origem =
            String(
                body?.origem ?? "",
            ).trim();

        const dataOriginal =
            body?.data_original
                ? new Date(
                    String(
                        body.data_original,
                    ),
                )
                : null;

        if (
            dataOriginal &&
            Number.isNaN(
                dataOriginal.getTime(),
            )
        ) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Data original inválida.",
                },
                {
                    status: 400,
                },
            );
        }

        const input: CreatePedidoManualInput =
            {
                origem:
                    origem as CreatePedidoManualInput["origem"],

                dataOriginal,

                clienteNome:
                    String(
                        body?.cliente?.nome ??
                        "",
                    ),

                clienteEmail:
                    body?.cliente?.email
                        ? String(
                            body.cliente.email,
                        )
                        : null,

                clienteTelefone:
                    String(
                        body?.cliente
                            ?.telefone ??
                        "",
                    ),

                statusCode:
                    String(
                        body?.status_code ??
                        "",
                    ) as CreatePedidoManualInput["statusCode"],

                pagamentoMetodoCode:
                    String(
                        body?.pagamento
                            ?.metodo_code ??
                        "",
                    ) as CreatePedidoManualInput["pagamentoMetodoCode"],

                pagamentoStatusCode:
                    String(
                        body?.pagamento
                            ?.status_code ??
                        "",
                    ) as CreatePedidoManualInput["pagamentoStatusCode"],

                movimentarEstoque:
                    Boolean(
                        body?.movimentar_estoque,
                    ),

                observacao:
                    body?.observacao
                        ? String(
                            body.observacao,
                        )
                        : null,

                itens:
                    Array.isArray(
                        body?.itens,
                    )
                        ? body.itens.map(
                            (
                                item: any,
                            ) => ({
                                produtoId:
                                    Number(
                                        item
                                            ?.produto_id,
                                    ),

                                variacaoId:
                                    item
                                        ?.variacao_id ===
                                    null ||
                                    item
                                        ?.variacao_id ===
                                    undefined
                                        ? null
                                        : Number(
                                            item
                                                .variacao_id,
                                        ),

                                quantidade:
                                    Number(
                                        item
                                            ?.quantidade,
                                    ),

                                precoUnitario:
                                    item
                                        ?.preco_unitario ===
                                    null ||
                                    item
                                        ?.preco_unitario ===
                                    undefined ||
                                    item
                                        ?.preco_unitario ===
                                    ""
                                        ? null
                                        : Number(
                                            item
                                                .preco_unitario,
                                        ),

                                campos:
                                    Array.isArray(
                                        item
                                            ?.campos,
                                    )
                                        ? item.campos.map(
                                            (
                                                campo: any,
                                            ) => ({
                                                campoId:
                                                    Number(
                                                        campo
                                                            ?.campo_id,
                                                    ),

                                                valor:
                                                    String(
                                                        campo
                                                            ?.valor ??
                                                        "",
                                                    ),
                                            }),
                                        )
                                        : [],

                                componentes:
                                    Array.isArray(
                                        item
                                            ?.componentes,
                                    )
                                        ? item.componentes.map(
                                            (
                                                componente: any,
                                            ) => ({
                                                componenteId:
                                                    Number(
                                                        componente
                                                            ?.componente_id,
                                                    ),

                                                variacaoId:
                                                    componente
                                                        ?.variacao_id ===
                                                    null ||
                                                    componente
                                                        ?.variacao_id ===
                                                    undefined
                                                        ? null
                                                        : Number(
                                                            componente
                                                                .variacao_id,
                                                        ),

                                                campos:
                                                    Array.isArray(
                                                        componente
                                                            ?.campos,
                                                    )
                                                        ? componente.campos.map(
                                                            (
                                                                campo: any,
                                                            ) => ({
                                                                campoId:
                                                                    Number(
                                                                        campo
                                                                            ?.campo_id,
                                                                    ),

                                                                valor:
                                                                    String(
                                                                        campo
                                                                            ?.valor ??
                                                                        "",
                                                                    ),
                                                            }),
                                                        )
                                                        : [],
                                            }),
                                        )
                                        : [],
                            }),
                        )
                        : [],

                createdBySysUsuarioId:
                access.session.user.id,
            };

        const pedido =
            await pedidoService.createManual(
                input,
            );

        return NextResponse.json(
            {
                ok: true,
                message:
                    input.origem ===
                    "legado"
                        ? "Pedido legado criado com sucesso."
                        : "Pedido manual criado com sucesso.",
                data: {
                    pedido,
                },
            },
            {
                status: 201,
            },
        );
    } catch (error) {
        console.error(
            "[admin.pedidos.create]",
            error,
        );

        return NextResponse.json(
            {
                ok: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível criar o pedido.",
            },
            {
                status: 400,
            },
        );
    }
}
