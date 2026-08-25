import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    parceiroMembroService,
    podeGerenciarMembros,
} from "@/lib/par/parceiro-membro-service";

import {
    requireParceiroApiAccess,
} from "@/lib/par/require-parceiro-api-access";


type RouteParams = {
    params: Promise<{
        parceiroId: string;
        vinculoId: string;
    }>;
};


function parseVinculoId(
    value: string,
) {
    const id =
        Number(value);

    if (
        !Number.isInteger(
            id,
        ) ||
        id <=
            0
    ) {
        throw new Error(
            "Membro inválido.",
        );
    }

    return id;
}


export async function PATCH(
    request: NextRequest,
    {
        params,
    }: RouteParams,
) {
    const {
        parceiroId,
        vinculoId,
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

    if (
        !podeGerenciarMembros(
            access.vinculo.tipo.codigo,
        )
    ) {
        return NextResponse.json(
            {
                ok: false,
                message:
                    "Você não possui permissão para alterar membros.",
            },
            {
                status: 403,
            },
        );
    }

    try {
        const id =
            parseVinculoId(
                vinculoId,
            );

        const body =
            await request.json();

        const membro =
            await parceiroMembroService
                .updateTipo({
                    parceiroId:
                        access.parceiro.id,

                    actorSysUsuarioId:
                        access.session.user.id,

                    vinculoId:
                        id,

                    tipoCodigo:
                        String(
                            body
                                .tipo_codigo ??
                            "",
                        ),
                });

        return NextResponse.json({
            ok: true,
            message:
                "Nível de acesso atualizado.",

            data: {
                membro,
            },
        });
    } catch (error) {
        console.error(
            "[PARCEIRO_MEMBRO_PATCH]",
            error,
        );

        return NextResponse.json(
            {
                ok: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível alterar o membro.",
            },
            {
                status: 400,
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
        vinculoId,
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

    if (
        !podeGerenciarMembros(
            access.vinculo.tipo.codigo,
        )
    ) {
        return NextResponse.json(
            {
                ok: false,
                message:
                    "Você não possui permissão para remover membros.",
            },
            {
                status: 403,
            },
        );
    }

    try {
        const id =
            parseVinculoId(
                vinculoId,
            );

        const result =
            await parceiroMembroService
                .remove({
                    parceiroId:
                        access.parceiro.id,

                    actorSysUsuarioId:
                        access.session.user.id,

                    vinculoId:
                        id,
                });

        return NextResponse.json({
            ok: true,
            message:
                "Acesso removido com sucesso.",

            data:
                result,
        });
    } catch (error) {
        console.error(
            "[PARCEIRO_MEMBRO_DELETE]",
            error,
        );

        return NextResponse.json(
            {
                ok: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível remover o membro.",
            },
            {
                status: 400,
            },
        );
    }
}
