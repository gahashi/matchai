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

        const categoriaId =
            parseId(id);

        if (!categoriaId) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Categoria inválida.",
                },
                {
                    status: 400,
                },
            );
        }

        const body =
            await request.json();

        if (
            body?.action ===
            "set_ativo"
        ) {
            const categoria =
                await cardapioService
                    .setCategoriaAtiva(
                        access
                            .parceiro
                            .id,

                        categoriaId,

                        Boolean(
                            body.ativo,
                        ),
                    );

            return NextResponse.json({
                ok: true,

                message:
                    body.ativo
                        ? "Categoria ativada com sucesso."
                        : "Categoria desativada com sucesso.",

                data: {
                    categoria,
                },
            });
        }

        const categoria =
            await cardapioService
                .updateCategoria({
                    id:
                    categoriaId,

                    parceiroId:
                    access
                        .parceiro
                        .id,

                    nome:
                        String(
                            body?.nome ??
                            "",
                        ),

                    descricao:
                        body?.descricao
                            ? String(
                                body.descricao,
                            )
                            : null,

                    ordem:
                        Number(
                            body?.ordem ??
                            0,
                        ),

                    ativo:
                        body?.ativo !==
                        false,
                });

        return NextResponse.json({
            ok: true,

            message:
                "Categoria atualizada com sucesso.",

            data: {
                categoria,
            },
        });
    } catch (error) {
        console.error(
            "[parceiro.cardapio.categoria.update]",
            error,
        );

        const message =
            error instanceof Error
                ? error.message
                : "Não foi possível atualizar a categoria.";

        return NextResponse.json(
            {
                ok: false,
                message,
            },
            {
                status:
                    message ===
                    "Categoria não encontrada."
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

        const categoriaId =
            parseId(id);

        if (!categoriaId) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Categoria inválida.",
                },
                {
                    status: 400,
                },
            );
        }

        await cardapioService
            .deleteCategoria(
                access
                    .parceiro
                    .id,

                categoriaId,
            );

        return NextResponse.json({
            ok: true,

            message:
                "Categoria excluída com sucesso.",

            data: {
                categoria_id:
                categoriaId,
            },
        });
    } catch (error) {
        console.error(
            "[parceiro.cardapio.categoria.delete]",
            error,
        );

        const message =
            error instanceof Error
                ? error.message
                : "Não foi possível excluir a categoria.";

        return NextResponse.json(
            {
                ok: false,
                message,
            },
            {
                status:
                    message ===
                    "Categoria não encontrada."
                        ? 404
                        : 400,
            },
        );
    }
}