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
    };
}


export async function POST(
    request: NextRequest,
) {
    const access =
        await requireAdminApiAccess(
            request,
        );

    if (!access.ok) {
        return access.response;
    }

    try {
        const formData =
            await request.formData();

        const input =
            parseParceiroFormData(
                formData,
            );

        const parceiro =
            await parceiroService
                .create({
                    ...input,

                    createdBySysUsuarioId:
                    access
                        .session
                        .user
                        .id,
                });

        return NextResponse.json({
            ok: true,

            message:
                "Parceiro criado com sucesso.",

            data: {
                parceiro,
            },
        });
    } catch (error) {
        console.error(
            "[admin.parceiros.create]",
            error,
        );

        return NextResponse.json(
            {
                ok: false,

                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível criar o parceiro.",
            },
            {
                status: 400,
            },
        );
    }
}