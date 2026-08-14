import { prisma } from "@/lib/prisma";
import type { PublicProduto } from "@/lib/prd/produto-public-types";

type ListHomeOptions = {
    isSocio: boolean;
    limit?: number;
};

type ValidateCartInput = {
    produtoId: number;
    variacaoId: number | null;
    quantidade: number;
};

const publicProdutoSelect = {
    id: true,
    codigo: true,
    slug: true,
    nome: true,
    descricao: true,
    preco_normal: true,
    preco_socio: true,
    controla_estoque: true,
    estoque_atual: true,
    destaque: true,
    inicio_exibicao: true,
    fim_exibicao: true,
    exibir_apos_encerramento: true,

    prd_produto_tipo: {
        select: {
            codigo: true,
            nome: true,
        },
    },

    prd_produto_imagens: {
        where: {
            sys_arquivo: {
                deleted_at: null,
            },
        },
        orderBy: [
            { principal: "desc" as const },
            { ordem: "asc" as const },
            { id: "asc" as const },
        ],
        select: {
            id: true,
            ordem: true,
            principal: true,
            sys_arquivo: {
                select: {
                    public_url: true,
                },
            },
        },
    },

    prd_produto_variacoes: {
        where: {
            deleted_at: null,
            ativo: 1,
        },
        orderBy: [
            { ordem: "asc" as const },
            { id: "asc" as const },
        ],
        select: {
            id: true,
            nome: true,
            estoque_atual: true,
        },
    },
};

function buildPublicVisibilityWhere(now: Date) {
    return {
        deleted_at: null,
        ativo: 1,
        visivel_publico: 1,
        prd_produto_tipo: {
            codigo: {
                not: "associacao",
            },
        },
        AND: [
            {
                OR: [
                    { inicio_exibicao: null },
                    { inicio_exibicao: { lte: now } },
                ],
            },
            {
                OR: [
                    { fim_exibicao: null },
                    { fim_exibicao: { gte: now } },
                    { exibir_apos_encerramento: 1 },
                ],
            },
        ],
    };
}

function hasAvailableStock(produto: any) {
    if (!produto.controla_estoque) {
        return true;
    }

    const variacoes = produto.prd_produto_variacoes ?? [];

    if (variacoes.length > 0) {
        return variacoes.some(
            (variacao: any) =>
                variacao.estoque_atual === null ||
                variacao.estoque_atual > 0,
        );
    }

    return produto.estoque_atual === null || produto.estoque_atual > 0;
}

function isEnded(produto: any, now: Date) {
    return Boolean(produto.fim_exibicao && produto.fim_exibicao < now);
}

function serializePublicProduto(
    produto: any,
    options: {
        isSocio: boolean;
        now: Date;
    },
): PublicProduto {
    const imagens = (produto.prd_produto_imagens ?? []).map(
        (imagem: any) => ({
            id: imagem.id,
            ordem: imagem.ordem,
            principal: Boolean(imagem.principal),
            public_url: imagem.sys_arquivo.public_url,
        }),
    );

    const imagem = imagens[0] ?? null;
    const ended = isEnded(produto, options.now);
    const stockAvailable = hasAvailableStock(produto);

    const status: PublicProduto["status"] = ended
        ? "encerrado"
        : !stockAvailable
            ? "esgotado"
            : "disponivel";

    const precoNormal = Number(produto.preco_normal);
    const precoSocio =
        produto.preco_socio !== null ? Number(produto.preco_socio) : null;

    const socioAplicado = options.isSocio && precoSocio !== null;

    return {
        id: produto.id,
        codigo: produto.codigo,
        slug: produto.slug,
        nome: produto.nome,
        descricao: produto.descricao,
        tipo: {
            codigo: produto.prd_produto_tipo.codigo,
            nome: produto.prd_produto_tipo.nome,
        },
        preco_normal: precoNormal,
        preco_socio: precoSocio,
        preco_aplicado: socioAplicado ? precoSocio! : precoNormal,
        socio_aplicado: socioAplicado,
        controla_estoque: Boolean(produto.controla_estoque),
        estoque_atual: produto.estoque_atual,
        destaque: Boolean(produto.destaque),
        imagem_principal: imagem
            ? {
                public_url: imagem.public_url,
            }
            : null,
        imagens,
        variacoes: (produto.prd_produto_variacoes ?? []).map(
            (variacao: any) => ({
                id: variacao.id,
                nome: variacao.nome,
                estoque_atual: variacao.estoque_atual,
            }),
        ),
        status,
        disponivel_compra: status === "disponivel",
    };
}

class ProdutoPublicService {
    async listHomeProducts(options: ListHomeOptions) {
        const now = new Date();
        const limit = Math.min(Math.max(options.limit ?? 4, 1), 12);

        const produtos = await prisma.prdProduto.findMany({
            where: buildPublicVisibilityWhere(now),
            select: publicProdutoSelect,
            orderBy: [
                { destaque: "desc" },
                { created_at: "desc" },
                { id: "desc" },
            ],
            take: limit,
        });

        return produtos.map((produto) =>
            serializePublicProduto(produto, {
                isSocio: options.isSocio,
                now,
            }),
        );
    }

    async validateCart(
        items: ValidateCartInput[],
        options: {
            isSocio: boolean;
        },
    ) {
        const now = new Date();
        const produtoIds = Array.from(
            new Set(items.map((item) => item.produtoId)),
        );

        const produtos = produtoIds.length
            ? await prisma.prdProduto.findMany({
                where: {
                    ...buildPublicVisibilityWhere(now),
                    id: { in: produtoIds },
                },
                select: publicProdutoSelect,
            })
            : [];

        const produtoMap = new Map(
            produtos.map((produto) => [produto.id, produto]),
        );

        return items.map((item) => {
            const raw = produtoMap.get(item.produtoId);

            if (!raw) {
                return {
                    produto_id: item.produtoId,
                    variacao_id: item.variacaoId,
                    quantidade: item.quantidade,
                    disponivel: false,
                    motivo: "Produto indisponível.",
                    produto: null,
                };
            }

            const produto = serializePublicProduto(raw, {
                isSocio: options.isSocio,
                now,
            });

            if (!produto.disponivel_compra) {
                return {
                    produto_id: item.produtoId,
                    variacao_id: item.variacaoId,
                    quantidade: item.quantidade,
                    disponivel: false,
                    motivo:
                        produto.status === "encerrado"
                            ? "Venda encerrada."
                            : "Produto esgotado.",
                    produto,
                };
            }

            let variacao: PublicProduto["variacoes"][number] | null = null;

            if (produto.variacoes.length > 0) {
                variacao =
                    produto.variacoes.find(
                        (itemVariacao) => itemVariacao.id === item.variacaoId,
                    ) ?? null;

                if (!variacao) {
                    return {
                        produto_id: item.produtoId,
                        variacao_id: item.variacaoId,
                        quantidade: item.quantidade,
                        disponivel: false,
                        motivo: "Selecione uma variação válida.",
                        produto,
                    };
                }
            }

            const estoqueMaximo = produto.controla_estoque
                ? variacao
                    ? variacao.estoque_atual
                    : produto.estoque_atual
                : null;

            if (
                estoqueMaximo !== null &&
                item.quantidade > estoqueMaximo
            ) {
                return {
                    produto_id: item.produtoId,
                    variacao_id: item.variacaoId,
                    quantidade: item.quantidade,
                    disponivel: false,
                    motivo: `Estoque disponível: ${estoqueMaximo}.`,
                    produto,
                    variacao,
                    estoque_maximo: estoqueMaximo,
                };
            }

            return {
                produto_id: item.produtoId,
                variacao_id: variacao?.id ?? null,
                quantidade: item.quantidade,
                disponivel: true,
                motivo: null,
                produto,
                variacao,
                estoque_maximo: estoqueMaximo,
                preco_tabela: produto.preco_normal,
                preco_unitario: produto.preco_aplicado,
                socio_aplicado: produto.socio_aplicado,
                subtotal: Number(
                    (produto.preco_aplicado * item.quantidade).toFixed(2),
                ),
            };
        });
    }
}

export const produtoPublicService = new ProdutoPublicService();
