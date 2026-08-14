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
        removerBanner: booleanValue(
            formData.get("remover_banner"),
        ),
        banner:
            bannerValue instanceof File &&
            bannerValue.size > 0
                ? bannerValue
                : null,
    };
}

type RouteParams = {
    params: Promise<{
        id: string;
    }>;
};

export async function PATCH(
    request: NextRequest,
    { params }: RouteParams,
) {
    const access =
        await requireAdminApiAccess(request);

    if (!access.ok) {
        return access.response;
    }

    try {
        const { id } = await params;
        const eventoId = Number(id);

        if (
            !Number.isInteger(eventoId) ||
            eventoId <= 0
        ) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Evento inválido.",
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

            const evento =
                await eventoService.setAtivo(
                    eventoId,
                    Boolean(body.ativo),
                );

            return NextResponse.json({
                ok: true,
                message: body.ativo
                    ? "Evento ativado com sucesso."
                    : "Evento desativado com sucesso.",
                data: {
                    evento,
                },
            });
        }

        const formData =
            await request.formData();

        const input =
            parseEventoFormData(formData);

        const evento =
            await eventoService.update({
                id: eventoId,
                ...input,
                updatedBySysUsuarioId:
                access.session.user.id,
            });

        return NextResponse.json({
            ok: true,
            message:
                "Evento atualizado com sucesso.",
            data: {
                evento,
            },
        });
    } catch (error) {
        console.error(
            "[admin.eventos.update]",
            error,
        );

        const message =
            error instanceof Error
                ? error.message
                : "Não foi possível atualizar o evento.";

        return NextResponse.json(
            {
                ok: false,
                message,
            },
            {
                status:
                    message ===
                    "Evento não encontrado."
                        ? 404
                        : 400,
            },
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: RouteParams,
) {
    const access =
        await requireAdminApiAccess(request);

    if (!access.ok) {
        return access.response;
    }

    try {
        const { id } = await params;
        const eventoId = Number(id);

        if (
            !Number.isInteger(eventoId) ||
            eventoId <= 0
        ) {
            return NextResponse.json(
                {
                    ok: false,
                    message:
                        "Evento inválido.",
                },
                {
                    status: 400,
                },
            );
        }

        await eventoService.softDelete(
            eventoId,
        );

        return NextResponse.json({
            ok: true,
            message:
                "Evento excluído com sucesso.",
            data: {
                evento_id: eventoId,
            },
        });
    } catch (error) {
        console.error(
            "[admin.eventos.delete]",
            error,
        );

        const message =
            error instanceof Error
                ? error.message
                : "Não foi possível excluir o evento.";

        return NextResponse.json(
            {
                ok: false,
                message,
            },
            {
                status:
                    message ===
                    "Evento não encontrado."
                        ? 404
                        : 400,
            },
        );
    }
}
