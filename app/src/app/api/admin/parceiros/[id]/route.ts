import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    requireAdminApiAccess,
} from "@/lib/auth/require-api-access";

import {
    parceiroService,
} from "@/lib/par/parceiro-service";


type RouteParams = {
    params: Promise<{
        id: string;
    }>;
};


function booleanValue(
    value: FormDataEntryValue | null,
) {
    return (
        value === "1" ||
        value === "true" ||
        value === "on"
    );
}


function optionalString(
    value: FormDataEntryValue | null,
) {
    const normalized =
        String(
            value ?? "",
        ).trim();

    return normalized || null;
}


function fileValue(
    value: FormDataEntryValue | null,
) {
    return (
        value instanceof File &&
        value.size > 0
    )
        ? value
        : null;
}


function parseUsuarioIds(
    value:
        FormDataEntryValue | null,
) {
    if (!value) {
        return [];
    }

    let parsed: unknown;

    try {
        parsed =
            JSON.parse(
                String(value),
            );
    } catch {
        throw new Error(
            "Usuários vinculados inválidos.",
        );
    }

    if (
        !Array.isArray(parsed)
    ) {
        throw new Error(
            "Usuários vinculados inválidos.",
        );
    }

    return parsed.map(
        (item) => {
            const id =
                Number(item);

            if (
                !Number.isInteger(
                    id,
                ) ||
                id <= 0
            ) {
                throw new Error(
                    "Usuário vinculado inválido.",
                );
            }

            return id;
        },
    );
}


function parseParceiroFormData(
    formData: FormData,
) {
    return {
        codigo:
            String(
                formData.get(
                    "codigo",
                ) ?? "",
            ),

        slug:
            String(
                formData.get(
                    "slug",
                ) ?? "",
            ),

        nome:
            String(
                formData.get(
                    "nome",
                ) ?? "",
            ),

        descricao:
            optionalString(
                formData.get(
                    "descricao",
                ),
            ),

        ativo:
            booleanValue(
                formData.get(
                    "ativo",
                ),
            ),

        visivelPublico:
            booleanValue(
                formData.get(
                    "visivel_publico",
                ),
            ),

        usuarioIds:
            parseUsuarioIds(
                formData.get(
                    "usuario_ids",
                ),
            ),

        corPrimaria:
            optionalString(
                formData.get(
                    "cor_primaria",
                ),
            ),

        corSecundaria:
            optionalString(
                formData.get(
                    "cor_secundaria",
                ),
            ),

        corFundo:
            optionalString(
                formData.get(
                    "cor_fundo",
                ),
            ),

        corTexto:
            optionalString(
                formData.get(
                    "cor_texto",
                ),
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
    };
}


function parseParceiroId(
    value: string,
) {
    const id =
        Number(value);

    if (
        !Number.isInteger(id) ||
        id <= 0
    ) {
        return null;
    }

    return id;
}


export async function PATCH(
    request: NextRequest,
    {
        params,
    }: RouteParams,
) {
    const access =
        await requireAdminApiAccess(
            request,
        );

    if (!access.ok) {
        return access.response;
    }

    try {
        const {
            id,
        } = await params;

        const parceiroId =
            parseParceiroId(id);

        if (!parceiroId) {
            return NextResponse.json(
                {
                    ok: false,

                    message:
                        "Parceiro inválido.",
                },
                {
                    status: 400,
                },
            );
        }

        const contentType =
            request.headers.get(
                "content-type",
            ) ?? "";

        if (
            contentType.includes(
                "application/json",
            )
        ) {
            const body =
                await request.json();

            if (
                body?.action !==
                "set_ativo"
            ) {
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
            }

            const parceiro =
                await parceiroService
                    .setAtivo(
                        parceiroId,
                        Boolean(
                            body.ativo,
                        ),
                    );

            return NextResponse.json({
                ok: true,

                message:
                    body.ativo
                        ? "Parceiro ativado com sucesso."
                        : "Parceiro desativado com sucesso.",

                data: {
                    parceiro,
                },
            });
        }

        const formData =
            await request.formData();

        const input =
            parseParceiroFormData(
                formData,
            );

        const parceiro =
            await parceiroService
                .update({
                    id:
                    parceiroId,

                    ...input,

                    updatedBySysUsuarioId:
                    access
                        .session
                        .user
                        .id,
                });

        return NextResponse.json({
            ok: true,

            message:
                "Parceiro atualizado com sucesso.",

            data: {
                parceiro,
            },
        });
    } catch (error) {
        console.error(
            "[admin.parceiros.update]",
            error,
        );

        const message =
            error instanceof Error
                ? error.message
                : "Não foi possível atualizar o parceiro.";

        return NextResponse.json(
            {
                ok: false,
                message,
            },
            {
                status:
                    message ===
                    "Parceiro não encontrado."
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
    const access =
        await requireAdminApiAccess(
            request,
        );

    if (!access.ok) {
        return access.response;
    }

    try {
        const {
            id,
        } = await params;

        const parceiroId =
            parseParceiroId(id);

        if (!parceiroId) {
            return NextResponse.json(
                {
                    ok: false,

                    message:
                        "Parceiro inválido.",
                },
                {
                    status: 400,
                },
            );
        }

        await parceiroService
            .softDelete(
                parceiroId,
            );

        return NextResponse.json({
            ok: true,

            message:
                "Parceiro excluído com sucesso.",

            data: {
                parceiro_id:
                parceiroId,
            },
        });
    } catch (error) {
        console.error(
            "[admin.parceiros.delete]",
            error,
        );

        const message =
            error instanceof Error
                ? error.message
                : "Não foi possível excluir o parceiro.";

        return NextResponse.json(
            {
                ok: false,
                message,
            },
            {
                status:
                    message ===
                    "Parceiro não encontrado."
                        ? 404
                        : 400,
            },
        );
    }
}