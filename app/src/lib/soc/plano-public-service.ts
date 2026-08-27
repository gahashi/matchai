import { prisma } from "@/lib/prisma";

import type {
    PublicPlanoSocio,
} from "@/lib/soc/plano-public-types";

type ListHomePlansOptions = {
    limit?: number;
};

const planoPublicSelect = {
    id: true,
    codigo: true,
    nome: true,
    descricao: true,
    duracao_dias: true,
    fim_exibicao: true,
    exibir_apos_encerramento: true,

    banner_sys_arquivo: {
        select: {
            public_url: true,
        },
    },

    prd_produto: {
        select: {
            id: true,
            codigo: true,
            nome: true,
            preco_normal: true,
            ativo: true,
            visivel_publico: true,
            inicio_exibicao: true,
            fim_exibicao: true,
            deleted_at: true,

            prd_produto_tipo: {
                select: {
                    codigo: true,
                },
            },

            prd_produto_imagens: {
                where: {
                    principal: 1,
                    sys_arquivo: {
                        deleted_at: null,
                    },
                },
                orderBy: {
                    ordem: "asc" as const,
                },
                take: 1,
                select: {
                    sys_arquivo: {
                        select: {
                            public_url: true,
                        },
                    },
                },
            },
        },
    },
};

function isProdutoAssociacaoDisponivel(
    produto: any,
    now: Date,
) {
    if (!produto) return false;

    if (
        produto.deleted_at ||
        !produto.ativo ||
        !produto.visivel_publico ||
        produto.prd_produto_tipo?.codigo !== "associacao"
    ) {
        return false;
    }

    if (
        produto.inicio_exibicao &&
        produto.inicio_exibicao > now
    ) {
        return false;
    }

    if (
        produto.fim_exibicao &&
        produto.fim_exibicao < now
    ) {
        return false;
    }

    return true;
}

class PlanoPublicService {
    async listHomePlans(
        options: ListHomePlansOptions = {},
    ): Promise<PublicPlanoSocio[]> {
        const now = new Date();

        const limit = Math.min(
            Math.max(options.limit ?? 3, 1),
            6,
        );

        const planos =
            await prisma.socPlano.findMany({
                where: {
                    deleted_at: null,
                    ativo: 1,
                    visivel_publico: 1,

                    AND: [
                        {
                            OR: [
                                { inicio_exibicao: null },
                                {
                                    inicio_exibicao: {
                                        lte: now,
                                    },
                                },
                            ],
                        },
                        {
                            OR: [
                                { fim_exibicao: null },
                                {
                                    fim_exibicao: {
                                        gte: now,
                                    },
                                },
                                {
                                    exibir_apos_encerramento: 1,
                                },
                            ],
                        },
                    ],
                },

                select: planoPublicSelect,

                orderBy: [
                    { duracao_dias: "asc" },
                    { nome: "asc" },
                    { id: "desc" },
                ],

                take: limit,
            });

        return planos.map((plano) => {
            const ended = Boolean(
                plano.fim_exibicao &&
                plano.fim_exibicao < now,
            );

            const produto = plano.prd_produto;

            const produtoDisponivel =
                isProdutoAssociacaoDisponivel(
                    produto,
                    now,
                );

            const imagemProduto =
                produto
                    ?.prd_produto_imagens?.[0]
                    ?.sys_arquivo
                    ?.public_url ??
                null;

            return {
                id: plano.id,
                codigo: plano.codigo,
                nome: plano.nome,
                descricao: plano.descricao,
                duracao_dias: plano.duracao_dias,

                status: ended
                    ? "encerrado"
                    : "disponivel",

                banner: plano.banner_sys_arquivo
                    ? {
                        public_url:
                            plano.banner_sys_arquivo.public_url,
                    }
                    : null,

                imagem_publica_url:
                    plano.banner_sys_arquivo?.public_url ??
                    imagemProduto,

                produto:
                    produtoDisponivel && produto
                        ? {
                            id: produto.id,
                            codigo: produto.codigo,
                            nome: produto.nome,
                            preco_normal: Number(
                                produto.preco_normal,
                            ),
                            disponivel_compra: true,
                            imagem_principal:
                                imagemProduto
                                    ? {
                                        public_url:
                                            imagemProduto,
                                    }
                                    : null,
                        }
                        : null,

                disponivel_compra:
                    !ended &&
                    produtoDisponivel,
            } satisfies PublicPlanoSocio;
        });
    }
}

export const planoPublicService =
    new PlanoPublicService();
