import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    requireAdminApiAccess,
} from "@/lib/auth/require-api-access";

import {
    tvProgramacaoService,
} from "@/lib/tv/tv-programacao-service";


type RouteParams = {
    params: Promise<{
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
        id,
    } =
        await params;

    const access =
        await requireAdminApiAccess(
            request,
        );

    if (!access.ok) {
        return access.response;
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
            "[admin.tv.midia.upload]",
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
        id,
    } =
        await params;

    const access =
        await requireAdminApiAccess(
            request,
        );

    if (!access.ok) {
        return access.response;
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
            "[admin.tv.midia.delete]",
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
