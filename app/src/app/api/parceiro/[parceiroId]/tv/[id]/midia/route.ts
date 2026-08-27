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


type RouteParams = {
    params: Promise<{
        parceiroId: string;
        id: string;
    }>;
};


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
        const formData =
            await request.formData();

        const file =
            fileValue(
                formData.get(
                    "midia",
                ),
            );

        if (!file) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Selecione uma imagem válida.",
                },
                {
                    status: 400,
                },
            );
        }

        const exibicao =
            await tvProgramacaoService
                .setMidiaImagem({
                    id:
                        exibicaoId,

                    file,

                    sysUsuarioId:
                        access
                            .session
                            .user
                            .id,

                    scopeParceiroId:
                        access
                            .parceiro
                            .id,
                });

        return NextResponse.json({
            ok: true,
            message:
                "Imagem da TV atualizada com sucesso.",
            data: {
                exibicao,
            },
        });
    } catch (
        error
    ) {
        console.error(
            "[parceiro.tv.midia.upload]",
            error,
        );

        const message =
            error instanceof Error
                ? error.message
                : "Não foi possível atualizar a imagem da TV.";

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
        const exibicao =
            await tvProgramacaoService
                .removeMidia({
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
                "Imagem própria removida. A TV voltou a usar a mídia da fonte quando existir.",
            data: {
                exibicao,
            },
        });
    } catch (
        error
    ) {
        console.error(
            "[parceiro.tv.midia.delete]",
            error,
        );

        const message =
            error instanceof Error
                ? error.message
                : "Não foi possível remover a imagem da TV.";

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
