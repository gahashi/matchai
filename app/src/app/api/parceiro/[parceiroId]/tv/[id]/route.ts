import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    requireParceiroApiAccess,
} from "@/lib/par/require-parceiro-api-access";

import {
    getParceiroOperacaoPermissao,
} from "@/lib/par/parceiro-operacao-permissions";

import {
    tvProgramacaoService,
} from "@/lib/tv/tv-programacao-service";


function optionalDate(
    value:
        unknown,
) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return null;
    }

    const date =
        new Date(
            String(value),
        );

    if (
        Number.isNaN(
            date.getTime(),
        )
    ) {
        throw new Error(
            "Data de exibição inválida.",
        );
    }

    return date;
}


function parseHorarios(
    value:
        unknown,
) {
    if (
        !Array.isArray(value)
    ) {
        return [];
    }

    return value.map(
        (
            horario:
                any,
        ) => ({
            diaSemana:
                Number(
                    horario
                        ?.diaSemana,
                ),

            horaInicio:
                String(
                    horario
                        ?.horaInicio ??
                    "",
                ),

            horaFim:
                String(
                    horario
                        ?.horaFim ??
                    "",
                ),
        }),
    );
}



type RouteParams = {
    params: Promise<{
        parceiroId: string;
        id: string;
    }>;
};


export async function PATCH(
    request:
        NextRequest,

    {
        params,
    }:
        RouteParams,
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

    if (!access.ok) {
        return access.response;
    }


    const permissao =
        await getParceiroOperacaoPermissao({
            sysUsuarioId:
                access
                    .session
                    .user
                    .id,

            parceiroId:
                access
                    .parceiro
                    .id,
        });


    if (
        !permissao
            ?.canManage
    ) {
        return NextResponse.json(
            {
                ok:
                    false,

                message:
                    "Seu nível de acesso permite visualizar a TV, mas não alterar a programação.",
            },
            {
                status:
                    403,
            },
        );
    }


    const exibicaoId =
        Number(id);

    if (
        !Number.isInteger(
            exibicaoId,
        ) ||
        exibicaoId <= 0
    ) {
        return NextResponse.json(
            {
                ok: false,
                message:
                    "Exibição inválida.",
            },
            {
                status: 400,
            },
        );
    }

    try {
        const body =
            await request.json();

        if (
            body?.action ===
            "set_ativo"
        ) {
            const exibicao =
                await tvProgramacaoService
                    .setAtivo({
                        id:
                            exibicaoId,

                        ativo:
                            Boolean(
                                body?.ativo,
                            ),

                        scopeParceiroId:
                            access
                                .parceiro
                                .id,
                    });

            return NextResponse.json({
                ok: true,
                message:
                    body?.ativo
                        ? "Conteúdo ativado na TV."
                        : "Conteúdo pausado na TV.",
                data: {
                    exibicao,
                },
            });
        }

        if (
            body?.action ===
            "update"
        ) {
            const exibicao =
                await tvProgramacaoService
                    .update({
                        id:
                            exibicaoId,

                        scopeParceiroId:
                            access
                                .parceiro
                                .id,

                        titulo:
                            body?.titulo ??
                            null,

                        descricao:
                            body?.descricao ??
                            null,

                        link:
                            body?.link ??
                            null,

                        kicker:
                            body?.kicker ??
                            null,

                        corDestaque:
                            body
                                ?.cor_destaque ??
                            null,

                        ...(
                            Object.prototype
                                .hasOwnProperty
                                .call(
                                    body,
                                    "duracao_segundos",
                                )
                                ? {
                                    duracaoSegundos:
                                        body
                                            ?.duracao_segundos ===
                                        null
                                            ? null
                                            : Number(
                                                body
                                                    .duracao_segundos,
                                            ),
                                }
                                : {}
                        ),

                        ordem:
                            Number(
                                body?.ordem ??
                                0,
                            ),

                        ativo:
                            body?.ativo !==
                            false,

                        inicioExibicao:
                            optionalDate(
                                body
                                    ?.inicio_exibicao,
                            ),

                        fimExibicao:
                            optionalDate(
                                body
                                    ?.fim_exibicao,
                            ),

                        horarios:
                            parseHorarios(
                                body?.horarios,
                            ),
                    });

            return NextResponse.json({
                ok: true,
                message:
                    "Programação atualizada com sucesso.",
                data: {
                    exibicao,
                },
            });
        }

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
    } catch (
        error
    ) {
        console.error(
            "[parceiro.tv.update]",
            error,
        );

        const message =
            error instanceof Error
                ? error.message
                : "Não foi possível alterar a programação.";

        return NextResponse.json(
            {
                ok: false,
                message,
            },
            {
                status:
                    message ===
                    "Exibição não encontrada."
                        ? 404
                        : 400,
            },
        );
    }
}


export async function DELETE(
    request:
        NextRequest,

    {
        params,
    }:
        RouteParams,
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

    if (!access.ok) {
        return access.response;
    }


    const permissao =
        await getParceiroOperacaoPermissao({
            sysUsuarioId:
                access
                    .session
                    .user
                    .id,

            parceiroId:
                access
                    .parceiro
                    .id,
        });


    if (
        !permissao
            ?.canManage
    ) {
        return NextResponse.json(
            {
                ok:
                    false,

                message:
                    "Seu nível de acesso permite visualizar a TV, mas não alterar a programação.",
            },
            {
                status:
                    403,
            },
        );
    }


    const exibicaoId =
        Number(id);

    if (
        !Number.isInteger(
            exibicaoId,
        ) ||
        exibicaoId <= 0
    ) {
        return NextResponse.json(
            {
                ok: false,
                message:
                    "Exibição inválida.",
            },
            {
                status: 400,
            },
        );
    }

    try {
        await tvProgramacaoService
            .remove({
                id:
                    exibicaoId,

                scopeParceiroId:
                    access
                        .parceiro
                        .id,
            });

        return NextResponse.json({
            ok: true,
            message:
                "Conteúdo removido da programação da TV.",
            data: {
                exibicao_id:
                    exibicaoId,
            },
        });
    } catch (
        error
    ) {
        console.error(
            "[parceiro.tv.delete]",
            error,
        );

        const message =
            error instanceof Error
                ? error.message
                : "Não foi possível remover o conteúdo da TV.";

        return NextResponse.json(
            {
                ok: false,
                message,
            },
            {
                status:
                    message ===
                    "Exibição não encontrada."
                        ? 404
                        : 400,
            },
        );
    }
}
