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


function optionalString(
    value: unknown,
) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    return String(
        value,
    );
}


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


    if (
        !access.ok
    ) {
        return access.response;
    }


    try {
        const body =
            await request.json();


        const parceiro =
            await parceiroConfigService
                .updateInformacoes({
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
                        optionalString(
                            body?.descricao,
                        ),

                    slug:
                        String(
                            body?.slug ??
                            "",
                        ),

                    emailContato:
                        optionalString(
                            body?.email_contato,
                        ),

                    telefone:
                        optionalString(
                            body?.telefone,
                        ),

                    whatsapp:
                        optionalString(
                            body?.whatsapp,
                        ),

                    endereco:
                        optionalString(
                            body?.endereco,
                        ),

                    googleMapsUrl:
                        optionalString(
                            body?.google_maps_url,
                        ),

                    instagramUrl:
                        optionalString(
                            body?.instagram_url,
                        ),

                    siteUrl:
                        optionalString(
                            body?.site_url,
                        ),

                    horarioFuncionamento:
                        optionalString(
                            body?.horario_funcionamento,
                        ),
                });


        return NextResponse.json({
            ok:
                true,

            message:
                "Informações atualizadas com sucesso.",

            data: {
                parceiro,
            },
        });
    } catch (
        error
        ) {
        console.error(
            "[parceiro.configuracao.informacoes.update]",
            error,
        );


        return NextResponse.json(
            {
                ok:
                    false,

                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível atualizar as informações.",
            },
            {
                status:
                    400,
            },
        );
    }
}