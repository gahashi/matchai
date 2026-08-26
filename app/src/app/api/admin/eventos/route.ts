import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    requireAdminApiAccess,
} from "@/lib/auth/require-api-access";

import {
    eventoService,
} from "@/lib/cad/evento-service";

function optionalInteger(
    value: FormDataEntryValue | null,
) {
    if (
        value === null ||
        String(value).trim() === ""
    ) {
        return null;
    }

    const parsed = Number(value);

    if (!Number.isInteger(parsed)) {
        throw new Error("Valor inteiro inválido.");
    }

    return parsed;
}

function booleanValue(
    value: FormDataEntryValue | null,
) {
    return (
        value === "1" ||
        value === "true" ||
        value === "on"
    );
}

function optionalDate(
    value: FormDataEntryValue | null,
) {
    if (
        value === null ||
        String(value).trim() === ""
    ) {
        return null;
    }

    const date = new Date(String(value));

    if (Number.isNaN(date.getTime())) {
        throw new Error("Data inválida.");
    }

    return date;
}

function parseEventoFormData(
    formData: FormData,
) {
    const bannerValue =
        formData.get("banner");

    return {
        titulo: String(
            formData.get("titulo") || "",
        ),
        descricao: String(
            formData.get("descricao") || "",
        ),
        url: String(
            formData.get("url") || "",
        ),
        eventoAt: optionalDate(
            formData.get("evento_at"),
        ),
        inicioExibicao: optionalDate(
            formData.get("inicio_exibicao"),
        ),
        fimExibicao: optionalDate(
            formData.get("fim_exibicao"),
        ),
        ordem:
            optionalInteger(
                formData.get("ordem"),
            ) ?? 0,
        destaque: booleanValue(
            formData.get("destaque"),
        ),
        ativo: booleanValue(
            formData.get("ativo"),
        ),
        visivelPublico: booleanValue(
            formData.get("visivel_publico"),
        ),
        exibirTv: booleanValue(
            formData.get("exibir_tv"),
        ),
        banner:
            bannerValue instanceof File &&
            bannerValue.size > 0
                ? bannerValue
                : null,
    };
}

export async function POST(
    request: NextRequest,
) {
    const access =
        await requireAdminApiAccess(request);

    if (!access.ok) {
        return access.response;
    }

    try {
        const formData =
            await request.formData();

        const input =
            parseEventoFormData(formData);

        const evento =
            await eventoService.create({
                ...input,
                createdBySysUsuarioId:
                access.session.user.id,
            });

        return NextResponse.json({
            ok: true,
            message:
                "Evento criado com sucesso.",
            data: {
                evento,
            },
        });
    } catch (error) {
        console.error(
            "[admin.eventos.create]",
            error,
        );

        return NextResponse.json(
            {
                ok: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível criar o evento.",
            },
            {
                status: 400,
            },
        );
    }
}
