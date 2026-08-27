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
    }>;
};


export async function GET(
    request:
        NextRequest,

    {
        params,
    }:
        RouteParams,
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
        const data =
            await tvProgramacaoService
                .listParceiroData(
                    access
                        .parceiro
                        .id,
                );

        return NextResponse.json({
            ok: true,
            data,
        });
    } catch (
        error
    ) {
        console.error(
            "[parceiro.tv.list]",
            error,
        );

        return NextResponse.json(
            {
                ok: false,
                message:
                    "Não foi possível carregar a programação da TV.",
            },
            {
                status: 500,
            },
        );
    }
}


export async function POST(
    request:
        NextRequest,

    {
        params,
    }:
        RouteParams,
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


    try {
        const body =
            await request.json();

        if (
            body?.action ===
            "add_source"
        ) {
            const tipo =
                String(
                    body?.tipo ??
                    "",
                );

            if (
                tipo !== "evento" &&
                tipo !== "promocao"
            ) {
                return NextResponse.json(
                    {
                        ok: false,
                        message:
                            "Tipo de conteúdo inválido.",
                    },
                    {
                        status: 400,
                    },
                );
            }

            const exibicao =
                await tvProgramacaoService
                    .addSource({
                        tipo,

                        sourceId:
                            Number(
                                body?.source_id,
                            ),

                        scopeParceiroId:
                            access
                                .parceiro
                                .id,
                    });

            return NextResponse.json({
                ok: true,
                message:
                    "Conteúdo adicionado à TV.",
                data: {
                    exibicao,
                },
            });
        }

        if (
            body?.action ===
            "create_divulgacao"
        ) {
            const exibicao =
                await tvProgramacaoService
                    .createDivulgacao({
                        parceiroId:
                            access
                                .parceiro
                                .id,

                        titulo:
                            String(
                                body?.titulo ??
                                "",
                            ),

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

                        duracaoSegundos:
                            body
                                ?.duracao_segundos ===
                                    null ||
                            body
                                ?.duracao_segundos ===
                                    undefined
                                ? null
                                : Number(
                                    body
                                        .duracao_segundos,
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
                    "Divulgação criada com sucesso.",
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
            "[parceiro.tv.create]",
            error,
        );

        return NextResponse.json(
            {
                ok: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível alterar a programação.",
            },
            {
                status: 400,
            },
        );
    }
}
