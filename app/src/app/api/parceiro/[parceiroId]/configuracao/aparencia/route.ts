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
        const formData =
            await request.formData();

        const parceiro =
            await parceiroConfigService
                .updateAparencia({
                    parceiroId:
                    access.parceiro.id,

                    corPrimaria:
                        String(
                            formData.get(
                                "cor_primaria",
                            ) ??
                            "",
                        ),

                    corSecundaria:
                        String(
                            formData.get(
                                "cor_secundaria",
                            ) ??
                            "",
                        ),

                    corFundo:
                        String(
                            formData.get(
                                "cor_fundo",
                            ) ??
                            "",
                        ),

                    corTexto:
                        String(
                            formData.get(
                                "cor_texto",
                            ) ??
                            "",
                        ),

                    logo:
                        fileValue(
                            formData.get(
                                "logo",
                            ),
                        ),

                    banner:
                        fileValue(
                            formData.get(
                                "banner",
                            ),
                        ),

                    removerLogo:
                        booleanValue(
                            formData.get(
                                "remover_logo",
                            ),
                        ),

                    removerBanner:
                        booleanValue(
                            formData.get(
                                "remover_banner",
                            ),
                        ),

                    sysUsuarioId:
                    access.session.user.id,
                });


        return NextResponse.json({
            ok: true,

            message:
                "Aparência atualizada com sucesso.",

            data: {
                parceiro,
            },
        });
    } catch (error) {
        console.error(
            "[parceiro.configuracao.aparencia.update]",
            error,
        );

        return NextResponse.json(
            {
                ok: false,

                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível atualizar a aparência.",
            },
            {
                status: 400,
            },
        );
    }
}