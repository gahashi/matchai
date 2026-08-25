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


export async function POST(
    request: NextRequest,
) {
    const access =
        await requireParceiroApiAccess(
            request,
        );

    if (!access.ok) {
        return access.response;
    }

    try {
        const formData =
            await request.formData();

        const item =
            await cardapioService
                .createItem({
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

                    sysUsuarioId:
                    access
                        .session
                        .user
                        .id,
                });

        return NextResponse.json({
            ok: true,

            message:
                "Item criado com sucesso.",

            data: {
                item,
            },
        });
    } catch (error) {
        console.error(
            "[parceiro.cardapio.item.create]",
            error,
        );

        return NextResponse.json(
            {
                ok: false,

                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível criar o item.",
            },
            {
                status: 400,
            },
        );
    }
}