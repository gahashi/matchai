import { prisma } from "@/lib/prisma";
import type {
    PublicProduto,
    PublicProdutoCampo,
    PublicProdutoComponente,
    PublicProdutoVariacao,
} from "@/lib/prd/produto-public-types";

type ListHomeOptions = {
    isSocio: boolean;
    limit?: number;
};

type ValidateCartCampoInput = {
    campoId: number;
    valor: string;
};

type ValidateCartComponenteInput = {
    componenteId: number;
    variacaoId: number | null;
    campos: ValidateCartCampoInput[];
};

type ValidateCartInput = {
    lineKey: string;
    produtoId: number;
    variacaoId: number | null;
    quantidade: number;
    campos: ValidateCartCampoInput[];
    componentes: ValidateCartComponenteInput[];
};

const variacaoPublicSelect = {
    id: true,
    nome: true,
    estoque_atual: true,
} as const;

const campoPublicSelect = {
    id: true,
    codigo: true,
    nome: true,
    descricao: true,
    tipo: true,
    obrigatorio: true,
    valor_unico: true,
} as const;

const publicProdutoSelect = {
    id: true,
    codigo: true,
    slug: true,
    nome: true,
    descricao: true,
    preco_normal: true,
    preco_socio: true,
    modalidade_venda: true,
    previsao_entrega: true,
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
        select: variacaoPublicSelect,
    },

    prd_produto_campos: {
        where: {
            deleted_at: null,
            ativo: 1,
        },
        orderBy: [
            { ordem: "asc" as const },
            { id: "asc" as const },
        ],
        select: campoPublicSelect,
    },

    prd_produto_componentes: {
        where: {
            ativo: 1,
            prd_produto_componente: {
                deleted_at: null,
                ativo: 1,
            },
        },
        orderBy: [
            { ordem: "asc" as const },
            { id: "asc" as const },
        ],
        select: {
            id: true,
            quantidade: true,
            prd_produto_componente: {
                select: {
                    id: true,
                    codigo: true,
                    nome: true,
                    controla_estoque: true,
                    estoque_atual: true,

                    prd_produto_variacoes: {
                        where: {
                            deleted_at: null,
                            ativo: 1,
                        },
                        orderBy: [
                            { ordem: "asc" as const },
                            { id: "asc" as const },
                        ],
                        select: variacaoPublicSelect,
                    },

                    prd_produto_campos: {
                        where: {
                            deleted_at: null,
                            ativo: 1,
                        },
                        orderBy: [
                            { ordem: "asc" as const },
                            { id: "asc" as const },
                        ],
                        select: campoPublicSelect,
                    },
                },
            },
        },
    },
};


type ReservationTotals = {
    produto: Map<number, number>;
    variacao: Map<number, number>;
};

function emptyReservationTotals(): ReservationTotals {
    return {
        produto: new Map<number, number>(),
        variacao: new Map<number, number>(),
    };
}

function addReservationTotal(
    map: Map<number, number>,
    id: number,
    quantidade: number,
) {
    map.set(id, (map.get(id) ?? 0) + quantidade);
}

function getProdutoStockIds(produtos: any[]) {
    const produtoIds = new Set<number>();

    for (const produto of produtos) {
        produtoIds.add(produto.id);

        for (const componente of
        produto.prd_produto_componentes ?? []) {
            const componenteProduto =
                componente.prd_produto_componente;

            if (componenteProduto?.id) {
                produtoIds.add(componenteProduto.id);
            }
        }
    }

    return Array.from(produtoIds);
}

async function loadActiveReservationTotals(
    produtos: any[],
    now: Date,
): Promise<ReservationTotals> {
    const produtoIds = getProdutoStockIds(produtos);

    if (produtoIds.length === 0) {
        return emptyReservationTotals();
    }

    const reservas =
        await prisma.vndEstoqueReserva.findMany({
            where: {
                prd_produto_id: {
                    in: produtoIds,
                },
                consumida_at: null,
                liberada_at: null,
            },
            select: {
                prd_produto_id: true,
                prd_produto_variacao_id: true,
                quantidade: true,
            },
        });

    const totals = emptyReservationTotals();

    for (const reserva of reservas) {
        if (
            reserva.prd_produto_variacao_id !== null
        ) {
            addReservationTotal(
                totals.variacao,
                reserva.prd_produto_variacao_id,
                reserva.quantidade,
            );
            continue;
        }

        addReservationTotal(
            totals.produto,
            reserva.prd_produto_id,
            reserva.quantidade,
        );
    }

    return totals;
}

function subtractReservedStock(
    estoqueFisico: number | null,
    reservado: number,
) {
    if (estoqueFisico === null) {
        return null;
    }

    return Math.max(
        estoqueFisico - reservado,
        0,
    );
}

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

function serializeCampo(campo: any): PublicProdutoCampo {
    return {
        id: campo.id,
        codigo: campo.codigo,
        nome: campo.nome,
        descricao: campo.descricao,
        tipo: campo.tipo === "numero" ? "numero" : "texto",
        obrigatorio: Boolean(campo.obrigatorio),
        valor_unico: Boolean(campo.valor_unico),
    };
}

function hasVariationStock(
    estoqueDisponivel: number | null,
    quantidadeNecessaria = 1,
) {
    return (
        estoqueDisponivel === null ||
        estoqueDisponivel >= quantidadeNecessaria
    );
}

function getVariationAvailableStock(
    variacao: any,
    reservations: ReservationTotals,
) {
    return subtractReservedStock(
        variacao.estoque_atual,
        reservations.variacao.get(variacao.id) ?? 0,
    );
}

function getProductAvailableStock(
    produto: any,
    reservations: ReservationTotals,
) {
    return subtractReservedStock(
        produto.estoque_atual,
        reservations.produto.get(produto.id) ?? 0,
    );
}

function serializeVariacao(
    variacao: any,
    controlaEstoque: boolean,
    reservations: ReservationTotals,
    quantidadeNecessaria = 1,
): PublicProdutoVariacao {
    const estoqueDisponivel =
        controlaEstoque
            ? getVariationAvailableStock(
                variacao,
                reservations,
            )
            : variacao.estoque_atual;

    return {
        id: variacao.id,
        nome: variacao.nome,
        estoque_atual: estoqueDisponivel,
        disponivel:
            !controlaEstoque ||
            hasVariationStock(
                estoqueDisponivel,
                quantidadeNecessaria,
            ),
    };
}

function hasComponentStock(
    componente: any,
    reservations: ReservationTotals,
) {
    const produto =
        componente.prd_produto_componente;
    const quantidadeNecessaria =
        componente.quantidade;

    if (!produto.controla_estoque) {
        return true;
    }

    const variacoes =
        produto.prd_produto_variacoes ?? [];

    if (variacoes.length > 0) {
        return variacoes.some(
            (variacao: any) =>
                hasVariationStock(
                    getVariationAvailableStock(
                        variacao,
                        reservations,
                    ),
                    quantidadeNecessaria,
                ),
        );
    }

    return hasVariationStock(
        getProductAvailableStock(
            produto,
            reservations,
        ),
        quantidadeNecessaria,
    );
}

function serializeComponente(
    componente: any,
    reservations: ReservationTotals,
    ignoreStock = false,
): PublicProdutoComponente {
    const produto =
        componente.prd_produto_componente;

    const controlaEstoque =
        !ignoreStock &&
        Boolean(produto.controla_estoque);

    const estoqueDisponivel =
        controlaEstoque
            ? getProductAvailableStock(
                produto,
                reservations,
            )
            : produto.estoque_atual;

    return {
        id: componente.id,
        produto_id: produto.id,
        codigo: produto.codigo,
        nome: produto.nome,
        quantidade: componente.quantidade,
        controla_estoque: controlaEstoque,
        estoque_atual: estoqueDisponivel,
        disponivel:
            ignoreStock ||
            hasComponentStock(
                componente,
                reservations,
            ),

        variacoes: (
            produto.prd_produto_variacoes ?? []
        ).map((variacao: any) =>
            serializeVariacao(
                variacao,
                controlaEstoque,
                reservations,
                componente.quantidade,
            ),
        ),

        campos: (
            produto.prd_produto_campos ?? []
        ).map(serializeCampo),
    };
}

function hasAvailableStock(
    produto: any,
    reservations: ReservationTotals,
) {
    const componentes =
        produto.prd_produto_componentes ?? [];

    if (componentes.length > 0) {
        return componentes.every(
            (componente: any) =>
                hasComponentStock(
                    componente,
                    reservations,
                ),
        );
    }

    if (!produto.controla_estoque) {
        return true;
    }

    const variacoes =
        produto.prd_produto_variacoes ?? [];

    if (variacoes.length > 0) {
        return variacoes.some(
            (variacao: any) =>
                hasVariationStock(
                    getVariationAvailableStock(
                        variacao,
                        reservations,
                    ),
                ),
        );
    }

    return hasVariationStock(
        getProductAvailableStock(
            produto,
            reservations,
        ),
    );
}

function isEnded(produto: any, now: Date) {
    return Boolean(
        produto.fim_exibicao &&
        produto.fim_exibicao < now,
    );
}

function serializePublicProduto(
    produto: any,
    options: {
        isSocio: boolean;
        now: Date;
        reservations: ReservationTotals;
    },
): PublicProduto {
    const imagens = (
        produto.prd_produto_imagens ?? []
    ).map((imagem: any) => ({
        id: imagem.id,
        ordem: imagem.ordem,
        principal: Boolean(imagem.principal),
        public_url: imagem.sys_arquivo.public_url,
    }));

    const imagem = imagens[0] ?? null;

    const modalidadeVenda =
        produto.modalidade_venda === "pre_venda"
            ? "pre_venda"
            : "estoque";
    const isPreVenda = modalidadeVenda === "pre_venda";

    const componentes = (
        produto.prd_produto_componentes ?? []
    ).map((componente: any) =>
        serializeComponente(
            componente,
            options.reservations,
            isPreVenda,
        ),
    );

    const ehKit = componentes.length > 0;

    const ended = isEnded(
        produto,
        options.now,
    );

    const stockAvailable =
        isPreVenda ||
        hasAvailableStock(
            produto,
            options.reservations,
        );

    const status: PublicProduto["status"] = ended
        ? "encerrado"
        : !stockAvailable
            ? "esgotado"
            : "disponivel";

    const precoNormal = Number(
        produto.preco_normal,
    );

    const precoSocio =
        produto.preco_socio !== null
            ? Number(produto.preco_socio)
            : null;

    const socioAplicado =
        options.isSocio &&
        precoSocio !== null;

    return {
        id: produto.id,
        codigo: produto.codigo,
        slug: produto.slug,
        nome: produto.nome,
        descricao: produto.descricao,

        tipo: {
            codigo:
            produto.prd_produto_tipo.codigo,
            nome:
            produto.prd_produto_tipo.nome,
        },

        preco_normal: precoNormal,
        preco_socio: precoSocio,
        preco_aplicado: socioAplicado
            ? precoSocio!
            : precoNormal,
        socio_aplicado: socioAplicado,
        modalidade_venda: modalidadeVenda,
        previsao_entrega:
            isPreVenda && produto.previsao_entrega
                ? produto.previsao_entrega
                    .toISOString()
                    .slice(0, 10)
                : null,

// Kit não possui
        controla_estoque:
            !isPreVenda &&
            !ehKit &&
            Boolean(produto.controla_estoque),

        estoque_atual:
            ehKit
                ? null
                : Boolean(produto.controla_estoque)
                    ? getProductAvailableStock(
                        produto,
                        options.reservations,
                    )
                    : produto.estoque_atual,

        destaque: Boolean(produto.destaque),

        imagem_principal: imagem
            ? {
                public_url: imagem.public_url,
            }
            : null,

        imagens,

        variacoes: (
            produto.prd_produto_variacoes ?? []
        ).map((variacao: any) =>
            serializeVariacao(
                variacao,
                !isPreVenda &&
                Boolean(
                    produto.controla_estoque,
                ),
                options.reservations,
            ),
        ),

        campos: (
            produto.prd_produto_campos ?? []
        ).map(serializeCampo),

        componentes,
        eh_kit: ehKit,

        status,
        disponivel_compra:
            status === "disponivel",
    };
}


function normalizeCampoValue(
    campo: PublicProdutoCampo,
    value: string,
) {
    const trimmed = value.trim();

    if (campo.tipo === "numero") {
        if (!trimmed) return "";

        const numero = Number(trimmed);

        if (!Number.isFinite(numero)) {
            return null;
        }

        return String(numero);
    }

    return trimmed;
}

function validateConfiguredFields(
    definicoes: PublicProdutoCampo[],
    recebidos: ValidateCartCampoInput[],
    contexto: string,
) {
    const recebidoMap = new Map<number, string>();

    for (const recebido of recebidos) {
        if (recebidoMap.has(recebido.campoId)) {
            return {
                ok: false as const,
                motivo: `Campo repetido em ${contexto}.`,
                campos: [],
            };
        }

        recebidoMap.set(
            recebido.campoId,
            recebido.valor,
        );
    }

    const definicaoIds = new Set(
        definicoes.map((campo) => campo.id),
    );

    for (const campoId of recebidoMap.keys()) {
        if (!definicaoIds.has(campoId)) {
            return {
                ok: false as const,
                motivo: `Campo inválido em ${contexto}.`,
                campos: [],
            };
        }
    }

    const campos = [];

    for (const campo of definicoes) {
        const raw =
            recebidoMap.get(campo.id) ?? "";

        const normalized =
            normalizeCampoValue(campo, raw);

        if (normalized === null) {
            return {
                ok: false as const,
                motivo: `Informe um número válido em "${campo.nome}".`,
                campos: [],
            };
        }

        if (
            campo.obrigatorio &&
            normalized.length === 0
        ) {
            return {
                ok: false as const,
                motivo: `Preencha o campo obrigatório "${campo.nome}".`,
                campos: [],
            };
        }

        if (normalized.length === 0) {
            continue;
        }

        campos.push({
            campo_id: campo.id,
            codigo: campo.codigo,
            nome: campo.nome,
            tipo: campo.tipo,
            valor: raw.trim(),
            valor_normalizado:
                campo.tipo === "texto"
                    ? normalized.toLocaleLowerCase(
                        "pt-BR",
                    )
                    : normalized,
            valor_unico: campo.valor_unico,
        });
    }

    return {
        ok: true as const,
        motivo: null,
        campos,
    };
}

function getComponentMaxQuantity(
    componente: PublicProdutoComponente,
    variacaoId: number | null,
) {
    if (!componente.controla_estoque) {
        return null;
    }

    if (componente.variacoes.length > 0) {
        const variacao =
            componente.variacoes.find(
                (item) =>
                    item.id === variacaoId,
            );

        if (!variacao) return 0;

        if (
            variacao.estoque_atual === null
        ) {
            return null;
        }

        return Math.floor(
            variacao.estoque_atual /
            componente.quantidade,
        );
    }

    if (
        componente.estoque_atual === null
    ) {
        return null;
    }

    return Math.floor(
        componente.estoque_atual /
        componente.quantidade,
    );
}

function validateKitConfiguration(
    produto: PublicProduto,
    item: ValidateCartInput,
) {
    const ignoreStock =
        produto.modalidade_venda === "pre_venda";
    if (item.variacaoId !== null) {
        return {
            ok: false as const,
            motivo:
                "Kit não pode possuir variação própria.",
            componentes: [],
            estoqueMaximo: null,
        };
    }

    if (
        item.componentes.length !==
        produto.componentes.length
    ) {
        return {
            ok: false as const,
            motivo:
                "A configuração do kit está incompleta.",
            componentes: [],
            estoqueMaximo: null,
        };
    }

    const recebidos = new Map<
        number,
        ValidateCartComponenteInput
    >();

    for (const componente of item.componentes) {
        if (
            recebidos.has(
                componente.componenteId,
            )
        ) {
            return {
                ok: false as const,
                motivo:
                    "Há componentes repetidos na configuração do kit.",
                componentes: [],
                estoqueMaximo: null,
            };
        }

        recebidos.set(
            componente.componenteId,
            componente,
        );
    }

    const componentes = [];
    const limites: Array<number | null> = [];

    for (const definicao of produto.componentes) {
        const recebido =
            recebidos.get(definicao.id);

        if (!recebido) {
            return {
                ok: false as const,
                motivo: `Selecione as opções de "${definicao.nome}".`,
                componentes: [],
                estoqueMaximo: null,
            };
        }

        let variacao:
            | PublicProdutoVariacao
            | null = null;

        if (
            definicao.variacoes.length > 0
        ) {
            if (
                recebido.variacaoId === null
            ) {
                return {
                    ok: false as const,
                    motivo: `Selecione uma opção para "${definicao.nome}".`,
                    componentes: [],
                    estoqueMaximo: null,
                };
            }

            variacao =
                definicao.variacoes.find(
                    (itemVariacao) =>
                        itemVariacao.id ===
                        recebido.variacaoId,
                ) ?? null;

            if (!variacao) {
                return {
                    ok: false as const,
                    motivo: `Opção inválida para "${definicao.nome}".`,
                    componentes: [],
                    estoqueMaximo: null,
                };
            }

            if (!ignoreStock && !variacao.disponivel) {
                return {
                    ok: false as const,
                    motivo: `A opção "${variacao.nome}" de "${definicao.nome}" está esgotada.`,
                    componentes: [],
                    estoqueMaximo: 0,
                };
            }
        } else if (
            recebido.variacaoId !== null
        ) {
            return {
                ok: false as const,
                motivo: `"${definicao.nome}" não possui variações.`,
                componentes: [],
                estoqueMaximo: null,
            };
        }

        const camposResult =
            validateConfiguredFields(
                definicao.campos,
                recebido.campos,
                definicao.nome,
            );

        if (!camposResult.ok) {
            return {
                ok: false as const,
                motivo:
                camposResult.motivo,
                componentes: [],
                estoqueMaximo: null,
            };
        }

        const limite =
            ignoreStock
                ? null
                : getComponentMaxQuantity(
                    definicao,
                    variacao?.id ?? null,
                );

        limites.push(limite);

        componentes.push({
            componente_id: definicao.id,
            produto_id:
            definicao.produto_id,
            produto_codigo:
            definicao.codigo,
            produto_nome:
            definicao.nome,
            quantidade_por_kit:
            definicao.quantidade,
            variacao_id:
                variacao?.id ?? null,
            variacao_nome:
                variacao?.nome ?? null,
            campos:
            camposResult.campos,
        });
    }

    const finitos = limites.filter(
        (
            limite,
        ): limite is number =>
            limite !== null,
    );

    const estoqueMaximo =
        finitos.length > 0
            ? Math.min(...finitos)
            : null;

    return {
        ok: true as const,
        motivo: null,
        componentes,
        estoqueMaximo,
    };
}

class ProdutoPublicService {
    async listHomeProducts(
        options: ListHomeOptions,
    ) {
        const now = new Date();

        const limit =
            options.limit !== undefined
                ? Math.min(
                    Math.max(options.limit, 1),
                    100,
                )
                : undefined;

        const produtos =
            await prisma.prdProduto.findMany({
                where:
                    buildPublicVisibilityWhere(
                        now,
                    ),
                select: publicProdutoSelect,
                orderBy: [
                    { destaque: "desc" },
                    { created_at: "desc" },
                    { id: "desc" },
                ],
                ...(limit !== undefined
                    ? {
                        take: limit,
                    }
                    : {}),
            });

        const reservations =
            await loadActiveReservationTotals(
                produtos,
                now,
            );

        return produtos.map((produto) =>
            serializePublicProduto(produto, {
                isSocio: options.isSocio,
                now,
                reservations,
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
            new Set(
                items.map(
                    (item) => item.produtoId,
                ),
            ),
        );

        const produtos =
            produtoIds.length > 0
                ? await prisma.prdProduto.findMany({
                    where: {
                        ...buildPublicVisibilityWhere(
                            now,
                        ),
                        id: {
                            in: produtoIds,
                        },
                    },
                    select: publicProdutoSelect,
                })
                : [];

        const produtoMap = new Map(
            produtos.map((produto) => [
                produto.id,
                produto,
            ]),
        );

        const reservations =
            await loadActiveReservationTotals(
                produtos,
                now,
            );

        return items.map((item) => {
            const base = {
                line_key: item.lineKey,
                produto_id: item.produtoId,
                variacao_id:
                item.variacaoId,
                quantidade:
                item.quantidade,
            };

            const raw =
                produtoMap.get(
                    item.produtoId,
                );

            if (!raw) {
                return {
                    ...base,
                    disponivel: false,
                    motivo:
                        "Produto indisponível.",
                    produto: null,
                };
            }

            const produto =
                serializePublicProduto(raw, {
                    isSocio:
                    options.isSocio,
                    now,
                    reservations,
                });

            if (
                !Number.isInteger(
                    item.quantidade,
                ) ||
                item.quantidade <= 0
            ) {
                return {
                    ...base,
                    disponivel: false,
                    motivo:
                        "Quantidade inválida.",
                    produto,
                };
            }

            if (
                !produto.disponivel_compra
            ) {
                return {
                    ...base,
                    disponivel: false,
                    motivo:
                        produto.status ===
                        "encerrado"
                            ? "Venda encerrada."
                            : "Produto esgotado.",
                    produto,
                };
            }

            const camposResult =
                validateConfiguredFields(
                    produto.campos,
                    item.campos,
                    produto.nome,
                );

            if (!camposResult.ok) {
                return {
                    ...base,
                    disponivel: false,
                    motivo:
                    camposResult.motivo,
                    produto,
                };
            }

            if (produto.eh_kit) {
                const kitResult =
                    validateKitConfiguration(
                        produto,
                        item,
                    );

                if (!kitResult.ok) {
                    return {
                        ...base,
                        variacao_id: null,
                        disponivel: false,
                        motivo:
                        kitResult.motivo,
                        produto,
                        campos:
                        camposResult.campos,
                    };
                }

                if (
                    kitResult.estoqueMaximo !==
                    null &&
                    item.quantidade >
                    kitResult.estoqueMaximo
                ) {
                    return {
                        ...base,
                        variacao_id: null,
                        disponivel: false,
                        motivo: `Estoque disponível para esta configuração do kit: ${kitResult.estoqueMaximo}.`,
                        produto,
                        campos:
                        camposResult.campos,
                        componentes:
                        kitResult.componentes,
                        estoque_maximo:
                        kitResult.estoqueMaximo,
                    };
                }

                return {
                    ...base,
                    variacao_id: null,
                    disponivel: true,
                    motivo: null,
                    produto,
                    variacao: null,
                    campos:
                    camposResult.campos,
                    componentes:
                    kitResult.componentes,
                    estoque_maximo:
                    kitResult.estoqueMaximo,
                    preco_tabela:
                    produto.preco_normal,
                    preco_unitario:
                    produto.preco_aplicado,
                    socio_aplicado:
                    produto.socio_aplicado,
                    subtotal: Number(
                        (
                            produto.preco_aplicado *
                            item.quantidade
                        ).toFixed(2),
                    ),
                };
            }

            if (
                item.componentes.length > 0
            ) {
                return {
                    ...base,
                    disponivel: false,
                    motivo:
                        "Este produto não possui componentes de kit.",
                    produto,
                };
            }

            let variacao:
                | PublicProduto["variacoes"][number]
                | null = null;

            if (
                produto.variacoes.length > 0
            ) {
                variacao =
                    produto.variacoes.find(
                        (
                            itemVariacao,
                        ) =>
                            itemVariacao.id ===
                            item.variacaoId,
                    ) ?? null;

                if (!variacao) {
                    return {
                        ...base,
                        disponivel:
                            false,
                        motivo:
                            "Selecione uma variação válida.",
                        produto,
                    };
                }

                if (
                    !variacao.disponivel
                ) {
                    return {
                        ...base,
                        disponivel:
                            false,
                        motivo:
                            "Variação esgotada.",
                        produto,
                        variacao,
                    };
                }
            } else if (
                item.variacaoId !== null
            ) {
                return {
                    ...base,
                    disponivel: false,
                    motivo:
                        "Este produto não possui variações.",
                    produto,
                };
            }

            const estoqueMaximo =
                produto.controla_estoque
                    ? variacao
                        ? variacao.estoque_atual
                        : produto.estoque_atual
                    : null;

            if (
                estoqueMaximo !== null &&
                item.quantidade >
                estoqueMaximo
            ) {
                return {
                    ...base,
                    disponivel: false,
                    motivo: `Estoque disponível: ${estoqueMaximo}.`,
                    produto,
                    variacao,
                    campos:
                    camposResult.campos,
                    estoque_maximo:
                    estoqueMaximo,
                };
            }

            return {
                ...base,
                variacao_id:
                    variacao?.id ?? null,
                disponivel: true,
                motivo: null,
                produto,
                variacao,
                campos:
                camposResult.campos,
                componentes: [],
                estoque_maximo:
                estoqueMaximo,
                preco_tabela:
                produto.preco_normal,
                preco_unitario:
                produto.preco_aplicado,
                socio_aplicado:
                produto.socio_aplicado,
                subtotal: Number(
                    (
                        produto.preco_aplicado *
                        item.quantidade
                    ).toFixed(2),
                ),
            };
        });
    }

}

export const produtoPublicService =
    new ProdutoPublicService();
