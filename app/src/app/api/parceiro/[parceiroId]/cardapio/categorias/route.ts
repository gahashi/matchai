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
        parceiroId: string;
    }>;
};

export async function POST(
    request: NextRequest,
    {
        params,
    }: RouteParams,
) {
    const {
        parceiroId,
    } =
        await params;

    const access =
        await requireParceiroApiAccess(
            request,
            parceiroId,
        );

    if (!access.ok) {
        return access.response;
    }

    try {
        const body =
            await request.json();

        const categoria =
            await cardapioService
                .createCategoria({
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
                "Categoria criada com sucesso.",

            data: {
                categoria,
            },
        });
    } catch (error) {
        console.error(
            "[parceiro.cardapio.categoria.create]",
            error,
        );

        return NextResponse.json(
            {
                ok: false,

                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível criar a categoria.",
            },
            {
                status: 400,
            },
        );
    }
}