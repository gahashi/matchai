import { prisma } from "@/lib/prisma";
import { arquivoService } from "@/lib/storage/arquivo-service";

type ProdutoVariacaoWriteInput = {
    id?: number;
    nome: string;
    sku?: string | null;
    atributo1?: string | null;
    valor1?: string | null;
    atributo2?: string | null;
    valor2?: string | null;
    estoqueAtual?: number | null;
    ativo: boolean;
};

type ProdutoComponenteWriteInput = {
    produtoId: number;
    quantidade: number;
};

type ProdutoCampoWriteInput = {
    id?: number;
    codigo: string;
    nome: string;
    descricao?: string | null;
    tipo: "texto" | "numero";
    obrigatorio: boolean;
    valorUnico: boolean;
    ativo: boolean;
};

type ProdutoWriteInput = {
    prdProdutoTipoId: number;
    codigo: string;
    nome: string;
    descricao?: string | null;
    precoCusto?: number | null;
    precoNormal: number;
    precoSocio?: number | null;
    controlaEstoque: boolean;
    estoqueAtual?: number | null;
    ativo: boolean;
    destaque: boolean;
    visivelPublico: boolean;
    inicioExibicao?: Date | null;
    fimExibicao?: Date | null;
    exibirAposEncerramento: boolean;
    variacoes: ProdutoVariacaoWriteInput[];

    // Opcionais durante a transição das rotas/admin atuais.
    // Quando ausentes em update, o service preserva o cadastro existente.
    componentes?: ProdutoComponenteWriteInput[];
    campos?: ProdutoCampoWriteInput[];
};

type ImagemSyncInput = {
    novasImagens: File[];
    removerImagemIds: number[];
    principalRef?: string | null;
};

type CreateProdutoInput = ProdutoWriteInput &
    ImagemSyncInput & {
    createdBySysUsuarioId: number;
};

type UpdateProdutoInput = ProdutoWriteInput &
    ImagemSyncInput & {
    id: number;
    updatedBySysUsuarioId: number;
};

function slugify(value: string) {
    return value
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 140);
}

async function buildUniqueSlug(nome: string, excludeId?: number) {
    const base = slugify(nome) || "produto";
    let slug = base;
    let suffix = 2;

    while (
        await prisma.prdProduto.findFirst({
            where: {
                slug,
                deleted_at: null,
                ...(excludeId ? { id: { not: excludeId } } : {}),
            },
            select: { id: true },
        })
        ) {
        slug = `${base}-${suffix}`;
        suffix += 1;
    }

    return slug;
}

async function ensureCodigoDisponivel(codigo: string, excludeId?: number) {
    const existente = await prisma.prdProduto.findFirst({
        where: {
            codigo,
            ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: { id: true },
    });

    if (existente) {
        throw new Error("Já existe um produto com este código.");
    }
}

async function ensureTipoValido(prdProdutoTipoId: number) {
    const tipo = await prisma.prdProdutoTipo.findFirst({
        where: {
            id: prdProdutoTipoId,
            ativo: 1,
        },
        select: { id: true },
    });

    if (!tipo) {
        throw new Error("Tipo de produto inválido.");
    }
}

function normalizeOptional(value?: string | null) {
    const normalized = value?.trim();
    return normalized ? normalized : null;
}

function validateVariacoes(variacoes: ProdutoVariacaoWriteInput[]) {
    const skus = new Set<string>();

    for (const [index, variacao] of variacoes.entries()) {
        if (variacao.nome.trim().length < 1) {
            throw new Error(`Informe o nome da variação ${index + 1}.`);
        }

        const sku = normalizeOptional(variacao.sku)?.toUpperCase() ?? null;
        if (sku) {
            if (skus.has(sku)) {
                throw new Error(`O SKU ${sku} está repetido nas variações.`);
            }
            skus.add(sku);
        }

        if (
            variacao.estoqueAtual !== null &&
            variacao.estoqueAtual !== undefined &&
            (!Number.isInteger(variacao.estoqueAtual) ||
                variacao.estoqueAtual < 0)
        ) {
            throw new Error(
                `Informe um estoque válido para a variação ${index + 1}.`,
            );
        }
    }
}

function normalizeCampoCodigo(value: string) {
    return value
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 60);
}

function validateComponentes(componentes: ProdutoComponenteWriteInput[]) {
    const produtos = new Set<number>();

    for (const [index, componente] of componentes.entries()) {
        if (
            !Number.isInteger(componente.produtoId) ||
            componente.produtoId <= 0
        ) {
            throw new Error(`Produto inválido no componente ${index + 1}.`);
        }

        if (
            !Number.isInteger(componente.quantidade) ||
            componente.quantidade <= 0
        ) {
            throw new Error(
                `Informe uma quantidade válida para o componente ${index + 1}.`,
            );
        }

        if (produtos.has(componente.produtoId)) {
            throw new Error(
                "O mesmo produto não pode aparecer duas vezes no kit.",
            );
        }

        produtos.add(componente.produtoId);
    }
}

function validateCampos(campos: ProdutoCampoWriteInput[]) {
    const codigos = new Set<string>();

    for (const [index, campo] of campos.entries()) {
        const codigo = normalizeCampoCodigo(campo.codigo);

        if (!codigo) {
            throw new Error(
                `Informe um código válido para o campo ${index + 1}.`,
            );
        }

        if (codigos.has(codigo)) {
            throw new Error(`O campo ${codigo} está repetido.`);
        }

        codigos.add(codigo);

        if (campo.nome.trim().length < 2) {
            throw new Error(`Informe o nome do campo ${index + 1}.`);
        }

        if (campo.tipo !== "texto" && campo.tipo !== "numero") {
            throw new Error(
                `Tipo inválido no campo ${campo.nome.trim() || index + 1}.`,
            );
        }
    }
}

async function ensureComponentesValidos(
    componentes: ProdutoComponenteWriteInput[],
    produtoAtualId?: number,
) {
    if (componentes.length === 0) return;

    if (
        produtoAtualId &&
        componentes.some(
            (componente) => componente.produtoId === produtoAtualId,
        )
    ) {
        throw new Error("Um produto não pode ser componente dele mesmo.");
    }

    const ids = componentes.map((componente) => componente.produtoId);

    const encontrados = await prisma.prdProduto.findMany({
        where: {
            id: { in: ids },
            deleted_at: null,
        },
        select: { id: true },
    });

    if (encontrados.length !== ids.length) {
        throw new Error(
            "Um ou mais produtos selecionados para o kit não existem mais.",
        );
    }
}

function validateProdutoInput(input: ProdutoWriteInput) {
    if (
        !Number.isInteger(input.prdProdutoTipoId) ||
        input.prdProdutoTipoId <= 0
    ) {
        throw new Error("Informe o tipo do produto.");
    }

    if (input.nome.trim().length < 2) {
        throw new Error("Informe o nome do produto.");
    }

    if (input.codigo.trim().length < 2) {
        throw new Error("Informe o código do produto.");
    }

    if (!Number.isFinite(input.precoNormal) || input.precoNormal < 0) {
        throw new Error("Informe um preço normal válido.");
    }

    if (
        input.precoCusto !== null &&
        input.precoCusto !== undefined &&
        (!Number.isFinite(input.precoCusto) || input.precoCusto < 0)
    ) {
        throw new Error("Informe um preço de custo válido.");
    }

    if (
        input.precoSocio !== null &&
        input.precoSocio !== undefined &&
        (!Number.isFinite(input.precoSocio) || input.precoSocio < 0)
    ) {
        throw new Error("Informe um preço de sócio válido.");
    }

    if (
        input.controlaEstoque &&
        input.variacoes.length === 0 &&
        (input.estoqueAtual === null ||
            input.estoqueAtual === undefined ||
            !Number.isInteger(input.estoqueAtual) ||
            input.estoqueAtual < 0)
    ) {
        throw new Error("Informe um estoque válido.");
    }

    if (
        input.inicioExibicao &&
        input.fimExibicao &&
        input.fimExibicao < input.inicioExibicao
    ) {
        throw new Error(
            "O fim da exibição não pode ser anterior ao início.",
        );
    }

    validateVariacoes(input.variacoes);

    if (
        input.componentes !== undefined &&
        input.componentes.length > 0 &&
        input.variacoes.length > 0
    ) {
        throw new Error(
            "Um kit não pode possuir variações próprias. As variações devem pertencer aos produtos que compõem o kit.",
        );
    }

    if (input.componentes !== undefined) {
        validateComponentes(input.componentes);
    }

    if (input.campos !== undefined) {
        validateCampos(input.campos);
    }
}

type ProdutoStatus =
    | "ativo"
    | "inativo"
    | "oculto"
    | "agendado"
    | "encerrado";

function getProdutoStatus(produto: {
    ativo: number;
    visivel_publico: number;
    inicio_exibicao: Date | null;
    fim_exibicao: Date | null;
}): ProdutoStatus {
    const now = new Date();

    if (!produto.ativo) return "inativo";
    if (!produto.visivel_publico) return "oculto";
    if (produto.inicio_exibicao && produto.inicio_exibicao > now) {
        return "agendado";
    }
    if (produto.fim_exibicao && produto.fim_exibicao < now) {
        return "encerrado";
    }

    return "ativo";
}

const produtoSelect = {
    id: true,
    prd_produto_tipo_id: true,
    codigo: true,
    slug: true,
    nome: true,
    descricao: true,
    preco_custo: true,
    preco_normal: true,
    preco_socio: true,
    controla_estoque: true,
    estoque_atual: true,
    ativo: true,
    destaque: true,
    visivel_publico: true,
    inicio_exibicao: true,
    fim_exibicao: true,
    exibir_apos_encerramento: true,
    created_at: true,
    updated_at: true,

    prd_produto_tipo: {
        select: {
            id: true,
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
        orderBy: [{ principal: "desc" as const }, { ordem: "asc" as const }],
        select: {
            id: true,
            sys_arquivo_id: true,
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
        },
        orderBy: [{ ordem: "asc" as const }, { id: "asc" as const }],
        select: {
            id: true,
            sku: true,
            nome: true,
            atributo_1: true,
            valor_1: true,
            atributo_2: true,
            valor_2: true,
            ordem: true,
            estoque_atual: true,
            ativo: true,
        },
    },

    prd_produto_campos: {
        where: {
            deleted_at: null,
        },
        orderBy: [{ ordem: "asc" as const }, { id: "asc" as const }],
        select: {
            id: true,
            codigo: true,
            nome: true,
            descricao: true,
            tipo: true,
            obrigatorio: true,
            valor_unico: true,
            ordem: true,
            ativo: true,
        },
    },

    prd_produto_componentes: {
        orderBy: [{ ordem: "asc" as const }, { id: "asc" as const }],
        select: {
            id: true,
            prd_produto_componente_id: true,
            quantidade: true,
            ordem: true,
            ativo: true,
            prd_produto_componente: {
                select: {
                    id: true,
                    codigo: true,
                    nome: true,
                    ativo: true,
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
                        select: {
                            id: true,
                            nome: true,
                            estoque_atual: true,
                        },
                    },
                },
            },
        },
    },
};

function serializeProduto(produto: any) {
    const imagens = (produto.prd_produto_imagens ?? []).map((imagem: any) => ({
        prd_produto_imagem_id: imagem.id,
        sys_arquivo_id: imagem.sys_arquivo_id,
        ordem: imagem.ordem,
        principal: imagem.principal,
        public_url: imagem.sys_arquivo.public_url,
    }));

    const imagemPrincipal =
        imagens.find((imagem: any) => Boolean(imagem.principal)) ??
        imagens[0] ??
        null;

    return {
        id: produto.id,
        prd_produto_tipo_id: produto.prd_produto_tipo_id,
        codigo: produto.codigo,
        slug: produto.slug,
        nome: produto.nome,
        descricao: produto.descricao,
        preco_custo:
            produto.preco_custo !== null ? Number(produto.preco_custo) : null,
        preco_normal: Number(produto.preco_normal),
        preco_socio:
            produto.preco_socio !== null ? Number(produto.preco_socio) : null,
        controla_estoque: produto.controla_estoque,
        estoque_atual: produto.estoque_atual,
        ativo: produto.ativo,
        destaque: produto.destaque,
        visivel_publico: produto.visivel_publico,
        inicio_exibicao: produto.inicio_exibicao,
        fim_exibicao: produto.fim_exibicao,
        exibir_apos_encerramento: produto.exibir_apos_encerramento,
        created_at: produto.created_at,
        updated_at: produto.updated_at,
        prd_produto_tipo: produto.prd_produto_tipo,
        imagens,
        imagem_principal: imagemPrincipal,
        variacoes: (produto.prd_produto_variacoes ?? []).map(
            (variacao: any) => ({
                id: variacao.id,
                sku: variacao.sku,
                nome: variacao.nome,
                atributo_1: variacao.atributo_1,
                valor_1: variacao.valor_1,
                atributo_2: variacao.atributo_2,
                valor_2: variacao.valor_2,
                ordem: variacao.ordem,
                estoque_atual: variacao.estoque_atual,
                ativo: variacao.ativo,
            }),
        ),
        campos: (produto.prd_produto_campos ?? []).map(
            (campo: any) => ({
                id: campo.id,
                codigo: campo.codigo,
                nome: campo.nome,
                descricao: campo.descricao,
                tipo: campo.tipo,
                obrigatorio: campo.obrigatorio,
                valor_unico: campo.valor_unico,
                ordem: campo.ordem,
                ativo: campo.ativo,
            }),
        ),
        componentes: (produto.prd_produto_componentes ?? []).map(
            (componente: any) => ({
                id: componente.id,
                prd_produto_componente_id:
                componente.prd_produto_componente_id,
                quantidade: componente.quantidade,
                ordem: componente.ordem,
                ativo: componente.ativo,
                produto: {
                    id: componente.prd_produto_componente.id,
                    codigo: componente.prd_produto_componente.codigo,
                    nome: componente.prd_produto_componente.nome,
                    ativo: componente.prd_produto_componente.ativo,
                    controla_estoque:
                    componente.prd_produto_componente.controla_estoque,
                    estoque_atual:
                    componente.prd_produto_componente.estoque_atual,
                    variacoes:
                        componente.prd_produto_componente
                            .prd_produto_variacoes ?? [],
                },
            }),
        ),
        eh_kit: (produto.prd_produto_componentes ?? []).some(
            (componente: any) => Boolean(componente.ativo),
        ),
        status: getProdutoStatus(produto),
    };
}

class ProdutoService {
    async listAdminData() {
        const [tipos, produtos] = await Promise.all([
            prisma.prdProdutoTipo.findMany({
                where: { ativo: 1 },
                select: {
                    id: true,
                    codigo: true,
                    nome: true,
                },
                orderBy: { nome: "asc" },
            }),

            prisma.prdProduto.findMany({
                where: { deleted_at: null },
                select: produtoSelect,
                orderBy: [
                    { ativo: "desc" },
                    { created_at: "desc" },
                    { id: "desc" },
                ],
            }),
        ]);

        return {
            tipos,
            produtos: produtos.map(serializeProduto),
        };
    }

    async create(input: CreateProdutoInput) {
        validateProdutoInput(input);

        await Promise.all([
            ensureTipoValido(input.prdProdutoTipoId),
            ensureCodigoDisponivel(input.codigo.trim()),
            ensureComponentesValidos(input.componentes ?? []),
        ]);

        const slug = await buildUniqueSlug(input.nome);
        const ehKit = (input.componentes?.length ?? 0) > 0;

        const produto = await prisma.prdProduto.create({
            data: {
                prd_produto_tipo_id: input.prdProdutoTipoId,
                codigo: input.codigo.trim().toUpperCase(),
                slug,
                nome: input.nome.trim(),
                descricao: input.descricao?.trim() || null,
                preco_custo: input.precoCusto ?? null,
                preco_normal: input.precoNormal,
                preco_socio: input.precoSocio ?? null,
                controla_estoque:
                    !ehKit && input.controlaEstoque ? 1 : 0,
                estoque_atual:
                    !ehKit &&
                    input.controlaEstoque &&
                    input.variacoes.length === 0
                        ? input.estoqueAtual ?? 0
                        : null,
                ativo: input.ativo ? 1 : 0,
                destaque: input.destaque ? 1 : 0,
                visivel_publico: input.visivelPublico ? 1 : 0,
                inicio_exibicao: input.inicioExibicao ?? null,
                fim_exibicao: input.fimExibicao ?? null,
                exibir_apos_encerramento:
                    input.exibirAposEncerramento ? 1 : 0,
                created_at: new Date(),
                updated_at: new Date(),
            },
            select: { id: true },
        });

        try {
            await this.syncVariacoes(produto.id, input.variacoes);

            if (input.componentes !== undefined) {
                await this.syncComponentes(produto.id, input.componentes);
            }

            if (input.campos !== undefined) {
                await this.syncCampos(produto.id, input.campos);
            }

            if (input.novasImagens.length > 0) {
                await this.syncImagens({
                    prdProdutoId: produto.id,
                    novasImagens: input.novasImagens,
                    removerImagemIds: [],
                    principalRef: input.principalRef,
                    sysUsuarioId: input.createdBySysUsuarioId,
                });
            }
        } catch (error) {
            await prisma.prdProdutoComponente.deleteMany({
                where: { prd_produto_id: produto.id },
            });
            await prisma.prdProdutoCampo.deleteMany({
                where: { prd_produto_id: produto.id },
            });
            await prisma.prdProdutoVariacao.deleteMany({
                where: { prd_produto_id: produto.id },
            });
            await prisma.prdProduto.delete({
                where: { id: produto.id },
            });
            throw error;
        }

        return this.findById(produto.id);
    }

    async update(input: UpdateProdutoInput) {
        validateProdutoInput(input);

        const existente = await prisma.prdProduto.findFirst({
            where: {
                id: input.id,
                deleted_at: null,
            },
            select: {
                id: true,
                prd_produto_componentes: {
                    where: { ativo: 1 },
                    select: { id: true },
                    take: 1,
                },
            },
        });

        if (!existente) {
            throw new Error("Produto não encontrado.");
        }

        await Promise.all([
            ensureTipoValido(input.prdProdutoTipoId),
            ensureCodigoDisponivel(input.codigo.trim(), input.id),
            ensureComponentesValidos(
                input.componentes ?? [],
                input.id,
            ),
        ]);

        const slug = await buildUniqueSlug(input.nome, input.id);
        const ehKit =
            input.componentes !== undefined
                ? input.componentes.length > 0
                : existente.prd_produto_componentes.length > 0;

        await prisma.prdProduto.update({
            where: { id: input.id },
            data: {
                prd_produto_tipo_id: input.prdProdutoTipoId,
                codigo: input.codigo.trim().toUpperCase(),
                slug,
                nome: input.nome.trim(),
                descricao: input.descricao?.trim() || null,
                preco_custo: input.precoCusto ?? null,
                preco_normal: input.precoNormal,
                preco_socio: input.precoSocio ?? null,
                controla_estoque:
                    !ehKit && input.controlaEstoque ? 1 : 0,
                estoque_atual:
                    !ehKit &&
                    input.controlaEstoque &&
                    input.variacoes.length === 0
                        ? input.estoqueAtual ?? 0
                        : null,
                ativo: input.ativo ? 1 : 0,
                destaque: input.destaque ? 1 : 0,
                visivel_publico: input.visivelPublico ? 1 : 0,
                inicio_exibicao: input.inicioExibicao ?? null,
                fim_exibicao: input.fimExibicao ?? null,
                exibir_apos_encerramento:
                    input.exibirAposEncerramento ? 1 : 0,
                updated_at: new Date(),
            },
        });

        await this.syncVariacoes(input.id, input.variacoes);

        if (input.componentes !== undefined) {
            await this.syncComponentes(input.id, input.componentes);
        }

        if (input.campos !== undefined) {
            await this.syncCampos(input.id, input.campos);
        }

        await this.syncImagens({
            prdProdutoId: input.id,
            novasImagens: input.novasImagens,
            removerImagemIds: input.removerImagemIds,
            principalRef: input.principalRef,
            sysUsuarioId: input.updatedBySysUsuarioId,
        });

        return this.findById(input.id);
    }


    async setAtivo(id: number, ativo: boolean) {
        const existente = await prisma.prdProduto.findFirst({
            where: {
                id,
                deleted_at: null,
            },
            select: {
                id: true,
            },
        });

        if (!existente) {
            throw new Error("Produto não encontrado.");
        }

        await prisma.prdProduto.update({
            where: {
                id,
            },
            data: {
                ativo: ativo ? 1 : 0,
                updated_at: new Date(),
            },
        });

        return this.findById(id);
    }

    async softDelete(id: number) {
        const existente = await prisma.prdProduto.findFirst({
            where: {
                id,
                deleted_at: null,
            },
            select: {
                id: true,
            },
        });

        if (!existente) {
            throw new Error("Produto não encontrado.");
        }

        const componenteDeKit = await prisma.prdProdutoComponente.findFirst({
            where: {
                prd_produto_componente_id: id,
                ativo: 1,
                prd_produto: {
                    deleted_at: null,
                },
            },
            select: {
                prd_produto: {
                    select: {
                        nome: true,
                    },
                },
            },
        });

        if (componenteDeKit) {
            throw new Error(
                `Este produto faz parte do kit "${componenteDeKit.prd_produto.nome}". Remova-o do kit antes de excluir.`,
            );
        }

        const now = new Date();

        await prisma.$transaction(async (tx) => {
            await tx.prdProduto.update({
                where: {
                    id,
                },
                data: {
                    ativo: 0,
                    visivel_publico: 0,
                    deleted_at: now,
                    updated_at: now,
                },
            });

            await tx.prdProdutoVariacao.updateMany({
                where: {
                    prd_produto_id: id,
                    deleted_at: null,
                },
                data: {
                    ativo: 0,
                    deleted_at: now,
                    updated_at: now,
                },
            });

            await tx.prdProdutoCampo.updateMany({
                where: {
                    prd_produto_id: id,
                    deleted_at: null,
                },
                data: {
                    ativo: 0,
                    deleted_at: now,
                    updated_at: now,
                },
            });

            await tx.prdProdutoComponente.updateMany({
                where: {
                    prd_produto_id: id,
                    ativo: 1,
                },
                data: {
                    ativo: 0,
                    updated_at: now,
                },
            });
        });

        return {
            id,
        };
    }

    async findById(id: number) {
        const produto = await prisma.prdProduto.findFirst({
            where: {
                id,
                deleted_at: null,
            },
            select: produtoSelect,
        });

        return produto ? serializeProduto(produto) : null;
    }

    private async syncVariacoes(
        prdProdutoId: number,
        variacoes: ProdutoVariacaoWriteInput[],
    ) {
        const atuais = await prisma.prdProdutoVariacao.findMany({
            where: {
                prd_produto_id: prdProdutoId,
                deleted_at: null,
            },
            select: { id: true },
        });

        const idsRecebidos = new Set(
            variacoes
                .map((variacao) => variacao.id)
                .filter((id): id is number => Boolean(id)),
        );

        const idsRemover = atuais
            .map((variacao) => variacao.id)
            .filter((id) => !idsRecebidos.has(id));

        if (idsRemover.length > 0) {
            await prisma.prdProdutoVariacao.updateMany({
                where: {
                    prd_produto_id: prdProdutoId,
                    id: { in: idsRemover },
                },
                data: {
                    ativo: 0,
                    deleted_at: new Date(),
                    updated_at: new Date(),
                },
            });
        }

        for (const [ordem, variacao] of variacoes.entries()) {
            const data = {
                nome: variacao.nome.trim(),
                sku: normalizeOptional(variacao.sku)?.toUpperCase() ?? null,
                atributo_1: normalizeOptional(variacao.atributo1),
                valor_1: normalizeOptional(variacao.valor1),
                atributo_2: normalizeOptional(variacao.atributo2),
                valor_2: normalizeOptional(variacao.valor2),
                ordem,
                estoque_atual: variacao.estoqueAtual ?? null,
                ativo: variacao.ativo ? 1 : 0,
                updated_at: new Date(),
            };

            if (variacao.id) {
                const pertence = await prisma.prdProdutoVariacao.findFirst({
                    where: {
                        id: variacao.id,
                        prd_produto_id: prdProdutoId,
                    },
                    select: { id: true },
                });

                if (!pertence) {
                    throw new Error("Variação inválida para este produto.");
                }

                await prisma.prdProdutoVariacao.update({
                    where: { id: variacao.id },
                    data: {
                        ...data,
                        deleted_at: null,
                    },
                });
            } else {
                await prisma.prdProdutoVariacao.create({
                    data: {
                        prd_produto_id: prdProdutoId,
                        ...data,
                        created_at: new Date(),
                    },
                });
            }
        }
    }

    private async syncComponentes(
        prdProdutoId: number,
        componentes: ProdutoComponenteWriteInput[],
    ) {
        validateComponentes(componentes);
        await ensureComponentesValidos(componentes, prdProdutoId);

        const now = new Date();

        await prisma.$transaction(async (tx) => {
            await tx.prdProdutoComponente.deleteMany({
                where: {
                    prd_produto_id: prdProdutoId,
                },
            });

            if (componentes.length === 0) return;

            await tx.prdProdutoComponente.createMany({
                data: componentes.map((componente, ordem) => ({
                    prd_produto_id: prdProdutoId,
                    prd_produto_componente_id: componente.produtoId,
                    quantidade: componente.quantidade,
                    ordem,
                    ativo: 1,
                    created_at: now,
                    updated_at: now,
                })),
            });
        });
    }

    private async syncCampos(
        prdProdutoId: number,
        campos: ProdutoCampoWriteInput[],
    ) {
        validateCampos(campos);

        const atuais = await prisma.prdProdutoCampo.findMany({
            where: {
                prd_produto_id: prdProdutoId,
                deleted_at: null,
            },
            select: { id: true },
        });

        const idsRecebidos = new Set(
            campos
                .map((campo) => campo.id)
                .filter((id): id is number => Boolean(id)),
        );

        const idsRemover = atuais
            .map((campo) => campo.id)
            .filter((id) => !idsRecebidos.has(id));

        const now = new Date();

        if (idsRemover.length > 0) {
            await prisma.prdProdutoCampo.updateMany({
                where: {
                    prd_produto_id: prdProdutoId,
                    id: { in: idsRemover },
                },
                data: {
                    ativo: 0,
                    deleted_at: now,
                    updated_at: now,
                },
            });
        }

        for (const [ordem, campo] of campos.entries()) {
            const data = {
                codigo: normalizeCampoCodigo(campo.codigo),
                nome: campo.nome.trim(),
                descricao: normalizeOptional(campo.descricao),
                tipo: campo.tipo,
                obrigatorio: campo.obrigatorio ? 1 : 0,
                valor_unico: campo.valorUnico ? 1 : 0,
                ordem,
                ativo: campo.ativo ? 1 : 0,
                updated_at: now,
            };

            if (campo.id) {
                const pertence = await prisma.prdProdutoCampo.findFirst({
                    where: {
                        id: campo.id,
                        prd_produto_id: prdProdutoId,
                    },
                    select: { id: true },
                });

                if (!pertence) {
                    throw new Error(
                        "Campo personalizado inválido para este produto.",
                    );
                }

                await prisma.prdProdutoCampo.update({
                    where: { id: campo.id },
                    data: {
                        ...data,
                        deleted_at: null,
                    },
                });
            } else {
                await prisma.prdProdutoCampo.create({
                    data: {
                        prd_produto_id: prdProdutoId,
                        ...data,
                        created_at: now,
                    },
                });
            }
        }
    }

    private async syncImagens(params: {
        prdProdutoId: number;
        novasImagens: File[];
        removerImagemIds: number[];
        principalRef?: string | null;
        sysUsuarioId: number;
    }) {
        const atuais = await prisma.prdProdutoImagem.findMany({
            where: {
                prd_produto_id: params.prdProdutoId,
            },
            select: {
                id: true,
                sys_arquivo_id: true,
                principal: true,
                ordem: true,
            },
            orderBy: [{ principal: "desc" }, { ordem: "asc" }],
        });

        const idsAtuais = new Set(atuais.map((imagem) => imagem.id));
        const removerIds = params.removerImagemIds.filter((id) =>
            idsAtuais.has(id),
        );

        const uploads: Array<{
            arquivoId: number;
            relationId?: number;
        }> = [];

        try {
            for (const file of params.novasImagens) {
                const result = await arquivoService.uploadPublicImage({
                    file,
                    folder: `produtos/${params.prdProdutoId}`,
                    filenamePrefix: "produto",
                    tipoCodigo: "produto_imagem",
                    createdBySysUsuarioId: params.sysUsuarioId,
                });

                uploads.push({
                    arquivoId: result.arquivo.id,
                });
            }

            await prisma.$transaction(async (tx) => {
                if (removerIds.length > 0) {
                    await tx.prdProdutoImagem.deleteMany({
                        where: {
                            prd_produto_id: params.prdProdutoId,
                            id: { in: removerIds },
                        },
                    });
                }

                const restantes = atuais.filter(
                    (imagem) => !removerIds.includes(imagem.id),
                );

                for (const [index, upload] of uploads.entries()) {
                    const created = await tx.prdProdutoImagem.create({
                        data: {
                            prd_produto_id: params.prdProdutoId,
                            sys_arquivo_id: upload.arquivoId,
                            ordem: restantes.length + index,
                            principal: 0,
                            created_at: new Date(),
                            updated_at: new Date(),
                        },
                        select: { id: true },
                    });

                    upload.relationId = created.id;
                }

                const todasIds = [
                    ...restantes.map((imagem) => imagem.id),
                    ...uploads
                        .map((upload) => upload.relationId)
                        .filter((id): id is number => Boolean(id)),
                ];

                let principalId: number | null = null;

                if (params.principalRef?.startsWith("existing:")) {
                    const id = Number(
                        params.principalRef.replace("existing:", ""),
                    );
                    if (todasIds.includes(id)) principalId = id;
                }

                if (
                    principalId === null &&
                    params.principalRef?.startsWith("new:")
                ) {
                    const index = Number(
                        params.principalRef.replace("new:", ""),
                    );
                    principalId = uploads[index]?.relationId ?? null;
                }

                if (principalId === null) {
                    const principalAtual = restantes.find(
                        (imagem) => Boolean(imagem.principal),
                    );
                    principalId =
                        principalAtual?.id ??
                        restantes[0]?.id ??
                        uploads[0]?.relationId ??
                        null;
                }

                if (todasIds.length > 0) {
                    await tx.prdProdutoImagem.updateMany({
                        where: {
                            prd_produto_id: params.prdProdutoId,
                        },
                        data: {
                            principal: 0,
                            updated_at: new Date(),
                        },
                    });

                    if (principalId) {
                        await tx.prdProdutoImagem.update({
                            where: { id: principalId },
                            data: {
                                principal: 1,
                                updated_at: new Date(),
                            },
                        });
                    }
                }
            });

            const removidas = atuais.filter((imagem) =>
                removerIds.includes(imagem.id),
            );

            for (const imagem of removidas) {
                await arquivoService.marcarComoRemovido({
                    arquivoId: imagem.sys_arquivo_id,
                });
            }
        } catch (error) {
            for (const upload of uploads) {
                await arquivoService.marcarComoRemovido({
                    arquivoId: upload.arquivoId,
                });
            }
            throw error;
        }
    }
}

export const produtoService = new ProdutoService();
