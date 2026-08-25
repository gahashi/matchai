import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    cardapioService,
} from "@/lib/crd/cardapio-service";

import {
    requireParceiroApiAccess,
} from "@/lib/par/require-parceiro-api-access";


type RouteParams = {
    params: Promise<{
        id: string;
    }>;
};


function parseId(
    value: string,
) {
    const id =
        Number(value);

    return (
        Number.isInteger(id) &&
        id > 0
    )
        ? id
        : null;
}


function booleanValue(
    value:
        FormDataEntryValue |
        null,
) {
    return (
        value === "1" ||
        value === "true" ||
        value === "on"
    );
}


function fileValue(
    value:
        FormDataEntryValue |
        null,
) {
    return (
        value instanceof File &&
        value.size > 0
    )
        ? value
        : null;
}


export async function PATCH(
    request: NextRequest,
    {
        params,
    }: RouteParams,
) {
    const access =
        await requireParceiroApiAccess(
            request,
        );

    if (!access.ok) {
        return access.response;
    }

    try {
        const {
            id,
        } = await params;

        const itemId =
            parseId(id);

        if (!itemId) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Item inválido.",
                },
                {
                    status: 400,
                },
            );
        }

        const contentType =
            request.headers.get(
                "content-type",
            ) ?? "";

        if (
            contentType.includes(
                "application/json",
            )
        ) {
            const body =
                await request.json();

            if (
                body?.action !==
                "set_ativo"
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

            const item =
                await cardapioService
                    .setItemAtivo(
                        access
                            .parceiro
                            .id,

                        itemId,

                        Boolean(
                            body.ativo,
                        ),
                    );

            return NextResponse.json({
                ok: true,

                message:
                    body.ativo
                        ? "Item ativado com sucesso."
                        : "Item desativado com sucesso.",

                data: {
                    item,
                },
            });
        }

        const formData =
            await request.formData();

        const item =
            await cardapioService
                .updateItem({
                    id:
                    itemId,

                    parceiroId:
                    access
                        .parceiro
                        .id,

                    categoriaId:
                        Number(
                            formData.get(
                                "crd_categoria_id",
                            ),
                        ),

                    nome:
                        String(
                            formData.get(
                                "nome",
                            ) ??
                            "",
                        ),

                    descricao:
                        String(
                            formData.get(
                                "descricao",
                            ) ??
                            "",
                        ),

                    preco:
                        Number(
                            formData.get(
                                "preco",
                            ),
                        ),

                    ordem:
                        Number(
                            formData.get(
                                "ordem",
                            ) ??
                            0,
                        ),

                    ativo:
                        booleanValue(
                            formData.get(
                                "ativo",
                            ),
                        ),

                    imagem:
                        fileValue(
                            formData.get(
                                "imagem",
                            ),
                        ),

                    removerImagem:
                        booleanValue(
                            formData.get(
                                "remover_imagem",
                            ),
                        ),

                    sysUsuarioId:
                    access
                        .session
                        .user
                        .id,
                });

        return NextResponse.json({
            ok: true,

            message:
                "Item atualizado com sucesso.",

            data: {
                item,
            },
        });
    } catch (error) {
        console.error(
            "[parceiro.cardapio.item.update]",
            error,
        );

        const message =
            error instanceof Error
                ? error.message
                : "Não foi possível atualizar o item.";

        return NextResponse.json(
            {
                ok: false,
                message,
            },
            {
                status:
                    message ===
                    "Item do cardápio não encontrado."
                        ? 404
                        : 400,
            },
        );
    }
}


export async function DELETE(
    request: NextRequest,
    {
        params,
    }: RouteParams,
) {
    const access =
        await requireParceiroApiAccess(
            request,
        );

    if (!access.ok) {
        return access.response;
    }

    try {
        const {
            id,
        } = await params;

        const itemId =
            parseId(id);

        if (!itemId) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Item inválido.",
                },
                {
                    status: 400,
                },
            );
        }

        await cardapioService
            .deleteItem(
                access
                    .parceiro
                    .id,

                itemId,
            );

        return NextResponse.json({
            ok: true,

            message:
                "Item excluído com sucesso.",

            data: {
                item_id:
                itemId,
            },
        });
    } catch (error) {
        console.error(
            "[parceiro.cardapio.item.delete]",
            error,
        );

        const message =
            error instanceof Error
                ? error.message
                : "Não foi possível excluir o item.";

        return NextResponse.json(
            {
                ok: false,
                message,
            },
            {
                status:
                    message ===
                    "Item do cardápio não encontrado."
                        ? 404
                        : 400,
            },
        );
    }
}