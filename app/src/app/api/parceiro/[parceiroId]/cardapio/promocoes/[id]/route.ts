import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    promocaoService,
    type PromocaoHorarioInput,
} from "@/lib/crd/promocao-service";

import {
    requireParceiroApiAccess,
} from "@/lib/par/require-parceiro-api-access";


type RouteParams = {
    params: Promise<{
        parceiroId: string;
        id: string;
    }>;
};


function parseId(
    value: string,
) {
    const id =
        Number(
            value,
        );

    return (
        Number.isInteger(
            id,
        ) &&
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


function optionalNumber(
    value:
        FormDataEntryValue |
        null,
) {
    const normalized =
        String(
            value ??
            "",
        ).trim();

    if (
        !normalized
    ) {
        return null;
    }

    const parsed =
        Number(
            normalized,
        );

    if (
        !Number.isFinite(
            parsed,
        )
    ) {
        throw new Error(
            "Número inválido.",
        );
    }

    return parsed;
}


function optionalDate(
    value:
        FormDataEntryValue |
        null,
) {
    const normalized =
        String(
            value ??
            "",
        ).trim();

    if (
        !normalized
    ) {
        return null;
    }

    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(
            normalized,
        )
    ) {
        throw new Error(
            "Data inválida.",
        );
    }

    const date =
        new Date(
            `${normalized}T00:00:00.000Z`,
        );

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        throw new Error(
            "Data inválida.",
        );
    }

    return date;
}


function parseJsonArray<T>(
    value:
        FormDataEntryValue |
        null,

    fieldName:
        string,
) {
    try {
        const parsed =
            JSON.parse(
                String(
                    value ??
                    "[]",
                ),
            );

        if (
            !Array.isArray(
                parsed,
            )
        ) {
            throw new Error();
        }

        return parsed as T[];
    } catch {
        throw new Error(
            `${fieldName} inválido.`,
        );
    }
}


function parsePromocaoFormData(
    formData:
        FormData,
) {
    const itemIds =
        parseJsonArray<number>(
            formData.get(
                "item_ids",
            ),
            "Itens",
        )
            .map(
                Number,
            );

    const horariosRaw =
        parseJsonArray<{
            dia_semana:
                number;

            hora_inicio:
                string;

            hora_fim:
                string;
        }>(
            formData.get(
                "horarios",
            ),
            "Horários",
        );

    const horarios:
        PromocaoHorarioInput[] =
        horariosRaw.map(
            (
                horario,
            ) => ({
                diaSemana:
                    Number(
                        horario
                            .dia_semana,
                    ),

                horaInicio:
                    String(
                        horario
                            .hora_inicio ??
                        "",
                    ),

                horaFim:
                    String(
                        horario
                            .hora_fim ??
                        "",
                    ),
            }),
        );

    return {
        titulo:
            String(
                formData.get(
                    "titulo",
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

        precoPromocional:
            optionalNumber(
                formData.get(
                    "preco_promocional",
                ),
            ),

        validadeInicio:
            optionalDate(
                formData.get(
                    "validade_inicio",
                ),
            ),

        validadeFim:
            optionalDate(
                formData.get(
                    "validade_fim",
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

        exibirTv:
            booleanValue(
                formData.get(
                    "exibir_tv",
                ),
            ),

        itemIds,
        horarios,

        imagem:
            fileValue(
                formData.get(
                    "imagem",
                ),
            ),
    };
}


export async function PATCH(
    request: NextRequest,
    {
        params,
    }: RouteParams,
) {
    const {
        parceiroId,
        id,
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

    const promocaoId =
        parseId(
            id,
        );

    if (
        !promocaoId
    ) {
        return NextResponse.json(
            {
                ok:
                    false,

                message:
                    "Promoção inválida.",
            },
            {
                status:
                    400,
            },
        );
    }

    try {
        const contentType =
            request.headers.get(
                "content-type",
            ) ??
            "";

        if (
            contentType.includes(
                "application/json",
            )
        ) {
            const body =
                await request
                    .json();

            if (
                body?.action !==
                "set_ativo"
            ) {
                return NextResponse.json(
                    {
                        ok:
                            false,

                        message:
                            "Ação inválida.",
                    },
                    {
                        status:
                            400,
                    },
                );
            }

            const promocao =
                await promocaoService
                    .setAtivo(
                        access
                            .parceiro
                            .id,

                        promocaoId,

                        Boolean(
                            body.ativo,
                        ),
                    );

            return NextResponse.json({
                ok:
                    true,

                message:
                    body.ativo
                        ? "Promoção ativada com sucesso."
                        : "Promoção desativada com sucesso.",

                data: {
                    promocao,
                },
            });
        }

        const formData =
            await request
                .formData();

        const input =
            parsePromocaoFormData(
                formData,
            );

        const promocao =
            await promocaoService
                .update({
                    id:
                        promocaoId,

                    parceiroId:
                        access
                            .parceiro
                            .id,

                    ...input,

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
            ok:
                true,

            message:
                "Promoção atualizada com sucesso.",

            data: {
                promocao,
            },
        });
    } catch (
        error
    ) {
        console.error(
            "[parceiro.cardapio.promocao.update]",
            error,
        );

        const message =
            error instanceof Error
                ? error.message
                : "Não foi possível atualizar a promoção.";

        return NextResponse.json(
            {
                ok:
                    false,

                message,
            },
            {
                status:
                    message ===
                    "Promoção não encontrada."
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
    const {
        parceiroId,
        id,
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

    const promocaoId =
        parseId(
            id,
        );

    if (
        !promocaoId
    ) {
        return NextResponse.json(
            {
                ok:
                    false,

                message:
                    "Promoção inválida.",
            },
            {
                status:
                    400,
            },
        );
    }

    try {
        await promocaoService
            .delete(
                access
                    .parceiro
                    .id,

                promocaoId,
            );

        return NextResponse.json({
            ok:
                true,

            message:
                "Promoção excluída com sucesso.",

            data: {
                promocao_id:
                    promocaoId,
            },
        });
    } catch (
        error
    ) {
        console.error(
            "[parceiro.cardapio.promocao.delete]",
            error,
        );

        const message =
            error instanceof Error
                ? error.message
                : "Não foi possível excluir a promoção.";

        return NextResponse.json(
            {
                ok:
                    false,

                message,
            },
            {
                status:
                    message ===
                    "Promoção não encontrada."
                        ? 404
                        : 400,
            },
        );
    }
}
