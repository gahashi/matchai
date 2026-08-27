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
    }>;
};


export async function GET(
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

    if (
        !podeGerenciarMembros(
            access.vinculo.tipo.codigo,
        )
    ) {
        return NextResponse.json(
            {
                ok: false,
                message:
                    "Você não possui permissão para gerenciar membros.",
            },
            {
                status: 403,
            },
        );
    }

    try {
        const data =
            await parceiroMembroService
                .listParceiroMembrosData(
                    access.parceiro.id,
                );

        return NextResponse.json({
            ok: true,
            message:
                "Membros carregados.",
            data,
        });
    } catch (error) {
        console.error(
            "[PARCEIRO_MEMBROS_GET]",
            error,
        );

        return NextResponse.json(
            {
                ok: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível carregar os membros.",
            },
            {
                status: 400,
            },
        );
    }
}


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

    if (
        !podeGerenciarMembros(
            access.vinculo.tipo.codigo,
        )
    ) {
        return NextResponse.json(
            {
                ok: false,
                message:
                    "Você não possui permissão para adicionar membros.",
            },
            {
                status: 403,
            },
        );
    }

    try {
        const body =
            await request.json();

        const sysUsuarioId =
            Number(
                body
                    .sys_usuario_id,
            );

        if (
            !Number.isInteger(
                sysUsuarioId,
            ) ||
            sysUsuarioId <=
                0
        ) {
            throw new Error(
                "Selecione um usuário válido.",
            );
        }

        const membro =
            await parceiroMembroService
                .add({
                    parceiroId:
                        access.parceiro.id,

                    actorSysUsuarioId:
                        access.session.user.id,

                    sysUsuarioId,

                    tipoCodigo:
                        String(
                            body
                                .tipo_codigo ??
                            "membro",
                        ),
                });

        return NextResponse.json({
            ok: true,
            message:
                "Membro adicionado com sucesso.",

            data: {
                membro,
            },
        });
    } catch (error) {
        console.error(
            "[PARCEIRO_MEMBROS_POST]",
            error,
        );

        return NextResponse.json(
            {
                ok: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível adicionar o membro.",
            },
            {
                status: 400,
            },
        );
    }
}
