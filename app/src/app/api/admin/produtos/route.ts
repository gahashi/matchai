import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    requireAdminApiAccess,
} from "@/lib/auth/require-api-access";

import {
    produtoService,
} from "@/lib/prd/produto-service";

function optionalNumber(value: FormDataEntryValue | null) {
    if (value === null || String(value).trim() === "") {
        return null;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        throw new Error("Valor numérico inválido.");
    }

    return parsed;
}

function optionalInteger(value: FormDataEntryValue | null) {
    const parsed = optionalNumber(value);
    if (parsed === null) return null;

    if (!Number.isInteger(parsed)) {
        throw new Error("Valor inteiro inválido.");
    }

    return parsed;
}

function booleanValue(value: FormDataEntryValue | null) {
    return value === "1" || value === "true" || value === "on";
}

function optionalDate(value: FormDataEntryValue | null) {
    if (value === null || String(value).trim() === "") {
        return null;
    }

    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) {
        throw new Error("Data inválida.");
    }

    return date;
}

function parseJsonArray<T>(value: FormDataEntryValue | null, field: string): T[] {
    if (value === null || String(value).trim() === "") {
        return [];
    }

    try {
        const parsed = JSON.parse(String(value));
        if (!Array.isArray(parsed)) {
            throw new Error();
        }
        return parsed as T[];
    } catch {
        throw new Error(`Campo ${field} inválido.`);
    }
}

type RawVariacao = {
    id?: number;
    nome?: string;
    sku?: string | null;
    atributo_1?: string | null;
    valor_1?: string | null;
    atributo_2?: string | null;
    valor_2?: string | null;
    estoque_atual?: number | null;
    ativo?: boolean | number | string;
};

function parseOptionalJsonArray<T>(
    formData: FormData,
    field: string,
): T[] | undefined {
    if (!formData.has(field)) {
        return undefined;
    }

    return parseJsonArray<T>(
        formData.get(field),
        field,
    );
}

type RawComponente = {
    prd_produto_componente_id?: number | string;
    quantidade?: number | string;
};

type RawCampo = {
    id?: number | string;
    codigo?: string;
    nome?: string;
    descricao?: string | null;
    tipo?: string;
    obrigatorio?: boolean | number | string;
    valor_unico?: boolean | number | string;
    ativo?: boolean | number | string;
};

function parseModalidadeVenda(
    value: FormDataEntryValue | null,
): "estoque" | "pre_venda" {
    const modalidade = String(value || "estoque").trim();

    if (modalidade === "estoque" || modalidade === "pre_venda") {
        return modalidade;
    }

    throw new Error("Modalidade de venda inválida.");
}

function parseProdutoFormData(formData: FormData) {
    const variacoes = parseJsonArray<RawVariacao>(
        formData.get("variacoes"),
        "variacoes",
    ).map((variacao) => ({
        id:
            variacao.id && Number.isInteger(Number(variacao.id))
                ? Number(variacao.id)
                : undefined,
        nome: String(variacao.nome ?? ""),
        sku: variacao.sku ? String(variacao.sku) : null,
        atributo1: variacao.atributo_1
            ? String(variacao.atributo_1)
            : null,
        valor1: variacao.valor_1 ? String(variacao.valor_1) : null,
        atributo2: variacao.atributo_2
            ? String(variacao.atributo_2)
            : null,
        valor2: variacao.valor_2 ? String(variacao.valor_2) : null,
        estoqueAtual:
            variacao.estoque_atual === null ||
            variacao.estoque_atual === undefined ||
            String(variacao.estoque_atual).trim() === ""
                ? null
                : Number(variacao.estoque_atual),
        ativo:
            variacao.ativo === true ||
            variacao.ativo === 1 ||
            variacao.ativo === "1",
    }));


    const componentesRaw = parseOptionalJsonArray<RawComponente>(
        formData,
        "componentes",
    );

    const componentes = componentesRaw?.map((componente) => ({
        produtoId: Number(
            componente.prd_produto_componente_id,
        ),
        quantidade: Number(
            componente.quantidade,
        ),
    }));

    const camposRaw = parseOptionalJsonArray<RawCampo>(
        formData,
        "campos",
    );

    function parseCampoTipo(value: unknown): "texto" | "numero" {
        if (value === undefined || value === null || value === "texto") {
            return "texto";
        }

        if (value === "numero") {
            return "numero";
        }

        throw new Error("Tipo de campo personalizado inválido.");
    }

    const campos = camposRaw?.map((campo) => ({
        id:
            campo.id &&
            Number.isInteger(Number(campo.id))
                ? Number(campo.id)
                : undefined,

        codigo: String(campo.codigo ?? ""),
        nome: String(campo.nome ?? ""),

        descricao:
            campo.descricao === null ||
            campo.descricao === undefined
                ? null
                : String(campo.descricao),

        tipo: parseCampoTipo(campo.tipo),


        obrigatorio:
            campo.obrigatorio === true ||
            campo.obrigatorio === 1 ||
            campo.obrigatorio === "1" ||
            campo.obrigatorio === "true",

        valorUnico:
            campo.valor_unico === true ||
            campo.valor_unico === 1 ||
            campo.valor_unico === "1" ||
            campo.valor_unico === "true",

        ativo:
            campo.ativo === true ||
            campo.ativo === 1 ||
            campo.ativo === "1" ||
            campo.ativo === "true",
    }));

    const removerImagemIds = parseJsonArray<number>(
        formData.get("remover_imagem_ids"),
        "remover_imagem_ids",
    )
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0);

    const novasImagens = formData
        .getAll("imagens")
        .filter(
            (value): value is File =>
                value instanceof File && value.size > 0,
        );

    return {
        prdProdutoTipoId: Number(
            formData.get("prd_produto_tipo_id"),
        ),
        codigo: String(formData.get("codigo") || ""),
        nome: String(formData.get("nome") || ""),
        descricao: String(formData.get("descricao") || ""),
        precoCusto: optionalNumber(formData.get("preco_custo")),
        precoNormal: Number(formData.get("preco_normal")),
        precoSocio: optionalNumber(formData.get("preco_socio")),
        modalidadeVenda: parseModalidadeVenda(
            formData.get("modalidade_venda"),
        ),
        controlaEstoque: booleanValue(
            formData.get("controla_estoque"),
        ),
        estoqueAtual: optionalInteger(
            formData.get("estoque_atual"),
        ),
        compraUnicaPorUsuario:
            booleanValue(
                formData.get(
                    "compra_unica_por_usuario",
                ),
            ),

        somenteSocio:
            booleanValue(
                formData.get(
                    "somente_socio",
                ),
            ),
        ativo: booleanValue(formData.get("ativo")),
        destaque: booleanValue(formData.get("destaque")),
        visivelPublico: booleanValue(
            formData.get("visivel_publico"),
        ),
        inicioExibicao: optionalDate(
            formData.get("inicio_exibicao"),
        ),
        fimExibicao: optionalDate(
            formData.get("fim_exibicao"),
        ),
        previsaoEntrega: optionalDate(
            formData.get("previsao_entrega"),
        ),
        exibirAposEncerramento: booleanValue(
            formData.get("exibir_apos_encerramento"),
        ),

        variacoes,
        componentes,
        campos,

        novasImagens,
        removerImagemIds,
        principalRef:
            String(formData.get("imagem_principal_ref") || "").trim() ||
            null,
    };
}

export async function GET(request: NextRequest) {
    const access = await requireAdminApiAccess(request);
    if (!access.ok) return access.response;

    try {
        const data = await produtoService.listAdminData();

        return NextResponse.json({
            ok: true,
            data,
        });
    } catch (error) {
        console.error("[admin.produtos.list]", error);

        return NextResponse.json(
            {
                ok: false,
                message: "Não foi possível carregar os produtos.",
            },
            {status: 500},
        );
    }
}

export async function POST(request: NextRequest) {
    const access = await requireAdminApiAccess(request);
    if (!access.ok) return access.response;

    try {
        const formData = await request.formData();
        const input = parseProdutoFormData(formData);

        const produto = await produtoService.create({
            ...input,
            createdBySysUsuarioId: access.session.user.id,
        });

        return NextResponse.json(
            {
                ok: true,
                message: "Produto criado com sucesso.",
                data: {produto},
            },
            {status: 201},
        );
    } catch (error) {
        console.error("[admin.produtos.create]", error);

        return NextResponse.json(
            {
                ok: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Não foi possível criar o produto.",
            },
            {status: 400},
        );
    }
}
