import {
    NextRequest,
    NextResponse,
} from "next/server";
import { z } from "zod";

import {
    requireAdminApiAccess,
} from "@/lib/auth/require-api-access";
import {
    planoService,
} from "@/lib/soc/plano-service";

function optionalInteger(
    value: FormDataEntryValue | null,
) {
    if (
        value === null ||
        String(value).trim() === ""
    ) {
        return null;
    }

    const parsed =
        Number(value);

    if (
        !Number.isInteger(parsed) ||
        parsed <= 0
    ) {
        throw new Error(
            "Produto associado inválido.",
        );
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
            "Data inválida.",
        );
    }

    return date;
}

const planoSchema =
    z.object({
        prdProdutoId:
            z
                .number()
                .int()
                .positive()
                .nullable(),
        codigo:
            z
                .string()
                .trim()
                .min(2)
                .max(60),
        nome:
            z
                .string()
                .trim()
                .min(2)
                .max(150),
        descricao:
            z
                .string()
                .max(65535),
        duracaoDias:
            z
                .number()
                .int()
                .min(1)
                .max(36500),
        ativo:
            z.boolean(),
        visivelPublico:
            z.boolean(),
        inicioExibicao:
            z
                .date()
                .nullable(),
        fimExibicao:
            z
                .date()
                .nullable(),
        exibirAposEncerramento:
            z.boolean(),
    });

function parsePlanoFormData(
    formData: FormData,
) {
    const bannerValue =
        formData.get(
            "banner",
        );

    const raw = {
        prdProdutoId:
            optionalInteger(
                formData.get(
                    "prd_produto_id",
                ),
            ),
        codigo:
            String(
                formData.get(
                    "codigo",
                ) ?? "",
            ),
        nome:
            String(
                formData.get(
                    "nome",
                ) ?? "",
            ),
        descricao:
            String(
                formData.get(
                    "descricao",
                ) ?? "",
            ),
        duracaoDias:
            Number(
                formData.get(
                    "duracao_dias",
                ) ?? 0,
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
        inicioExibicao:
            optionalDate(
                formData.get(
                    "inicio_exibicao",
                ),
            ),
        fimExibicao:
            optionalDate(
                formData.get(
                    "fim_exibicao",
                ),
            ),
        exibirAposEncerramento:
            booleanValue(
                formData.get(
                    "exibir_apos_encerramento",
                ),
            ),
    };

    const parsed =
        planoSchema.safeParse(
            raw,
        );

    if (!parsed.success) {
        throw new Error(
            parsed.error.issues[0]
                ?.message ??
            "Dados inválidos.",
        );
    }

    return {
        ...parsed.data,
        banner:
            bannerValue instanceof
            File &&
            bannerValue.size > 0
                ? bannerValue
                : null,
    };
}

export async function GET(
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
        const data =
            await planoService
                .listAdminData();

        return NextResponse.json({
            ok: true,
            data,
        });
    } catch (error) {
        console.error(
            "[admin.planos-socio.list]",
            error,
        );

        return NextResponse.json(
            {
                ok: false,
                message:
                    "Não foi possível carregar os planos de sócio.",
            },
            {
                status: 500,
            },
        );
    }
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
            parsePlanoFormData(
                formData,
            );

        const plano =
            await planoService.create({
                ...input,
                createdBySysUsuarioId:
                access.session.user.id,
            });

        return NextResponse.json(
            {
                ok: true,
                message:
                    "Plano de sócio criado com sucesso.",
                data: {
                    plano,
                },
            },
            {
                status: 201,
            },
        );
    } catch (error) {
        console.error(
            "[admin.planos-socio.create]",
            error,
        );

        return NextResponse.json(
            {
                ok: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível criar o plano de sócio.",
            },
            {
                status: 400,
            },
        );
    }
}
