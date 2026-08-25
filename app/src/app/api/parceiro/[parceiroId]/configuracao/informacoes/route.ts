import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    parceiroConfigService,
} from "@/lib/par/parceiro-config-service";

import {
    requireParceiroApiAccess,
} from "@/lib/par/require-parceiro-api-access";


type RouteParams = {
    params: Promise<{
        parceiroId: string;
    }>;
};


export async function PATCH(
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

        const parceiro =
            await parceiroConfigService
                .updateInformacoes({
                    parceiroId:
                    access.parceiro.id,

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

                    slug:
                        String(
                            body?.slug ??
                            "",
                        ),
                });

        return NextResponse.json({
            ok: true,

            message:
                "Informações atualizadas com sucesso.",

            data: {
                parceiro,
            },
        });
    } catch (error) {
        console.error(
            "[parceiro.configuracao.informacoes.update]",
            error,
        );

        return NextResponse.json(
            {
                ok: false,

                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível atualizar as informações.",
            },
            {
                status: 400,
            },
        );
    }
}