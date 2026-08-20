"use client";

import {
    useMemo,
    useState,
} from "react";
import {
    Check,
    ChevronLeft,
    ChevronRight,
    ImageOff,
    Minus,
    Plus,
    ShoppingBag,
    Sparkles,
} from "lucide-react";

import {
    usePublicCart,
    type PublicCartCampoValor,
    type PublicCartComponente,
} from "@/components/public/PublicCartProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import type {
    PublicProduto,
    PublicProdutoCampo,
    PublicProdutoComponente,
} from "@/lib/prd/produto-public-types";

function money(value: number) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}

function campoStateKey(
    scope: "produto" | "componente",
    scopeId: number,
    campoId: number,
) {
    return `${scope}:${scopeId}:${campoId}`;
}

function getCampoValue(
    values: Record<string, string>,
    scope: "produto" | "componente",
    scopeId: number,
    campoId: number,
) {
    return (
        values[
            campoStateKey(
                scope,
                scopeId,
                campoId,
            )
            ] ?? ""
    );
}

function buildCampoValores(
    campos: PublicProdutoCampo[],
    values: Record<string, string>,
    scope: "produto" | "componente",
    scopeId: number,
): PublicCartCampoValor[] {
    return campos
        .map((campo) => ({
            campoId: campo.id,
            codigo: campo.codigo,
            nome: campo.nome,
            valor: getCampoValue(
                values,
                scope,
                scopeId,
                campo.id,
            ).trim(),
        }))
        .filter(
            (campo) =>
                campo.valor.length > 0,
        );
}

function componentMaxQuantity(
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

        if (
            !variacao ||
            variacao.estoque_atual === null
        ) {
            return variacao ? null : 0;
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

export function ProductCard({
                                produto,
                            }: {
    produto: PublicProduto;
}) {
    const { addItem } =
        usePublicCart();

    const [previewOpen, setPreviewOpen] =
        useState(false);
    const [
        selectedImageId,
        setSelectedImageId,
    ] = useState<number | null>(
        produto.imagens[0]?.id ?? null,
    );
    const [
        selectedVariationId,
        setSelectedVariationId,
    ] = useState<number | null>(null);

    const [
        selectedComponentVariations,
        setSelectedComponentVariations,
    ] = useState<
        Record<number, number | null>
    >({});

    const [fieldValues, setFieldValues] =
        useState<Record<string, string>>(
            {},
        );

    const [quantidade, setQuantidade] =
        useState(1);
    const [added, setAdded] =
        useState(false);

    const selectedVariation = useMemo(
        () =>
            produto.variacoes.find(
                (variacao) =>
                    variacao.id ===
                    selectedVariationId,
            ) ?? null,
        [
            produto.variacoes,
            selectedVariationId,
        ],
    );

    const selectedImageIndex =
        useMemo(() => {
            if (
                produto.imagens.length === 0
            ) {
                return -1;
            }

            const index =
                produto.imagens.findIndex(
                    (imagem) =>
                        imagem.id ===
                        selectedImageId,
                );

            return index >= 0
                ? index
                : 0;
        }, [
            produto.imagens,
            selectedImageId,
        ]);

    const selectedImage =
        selectedImageIndex >= 0
            ? produto.imagens[
                selectedImageIndex
                ]
            : null;

    const exigeVariacao =
        !produto.eh_kit &&
        produto.variacoes.length > 0;

    const componentesValidos =
        useMemo(
            () =>
                produto.componentes.every(
                    (componente) => {
                        if (
                            !componente.disponivel
                        ) {
                            return false;
                        }

                        if (
                            componente
                                .variacoes
                                .length === 0
                        ) {
                            return true;
                        }

                        const variacaoId =
                            selectedComponentVariations[
                                componente.id
                                ];

                        if (!variacaoId) {
                            return false;
                        }

                        return Boolean(
                            componente.variacoes.find(
                                (
                                    variacao,
                                ) =>
                                    variacao.id ===
                                    variacaoId &&
                                    variacao.disponivel,
                            ),
                        );
                    },
                ),
            [
                produto.componentes,
                selectedComponentVariations,
            ],
        );

    const camposObrigatoriosValidos =
        useMemo(() => {
            const produtoOk =
                produto.campos.every(
                    (campo) =>
                        !campo.obrigatorio ||
                        getCampoValue(
                            fieldValues,
                            "produto",
                            produto.id,
                            campo.id,
                        ).trim().length >
                        0,
                );

            if (!produtoOk) {
                return false;
            }

            return produto.componentes.every(
                (componente) =>
                    componente.campos.every(
                        (campo) =>
                            !campo.obrigatorio ||
                            getCampoValue(
                                fieldValues,
                                "componente",
                                componente.id,
                                campo.id,
                            ).trim()
                                .length > 0,
                    ),
            );
        }, [
            produto,
            fieldValues,
        ]);

    const estoqueMaximo =
        useMemo(() => {
            if (produto.eh_kit) {
                const limites =
                    produto.componentes.map(
                        (componente) =>
                            componentMaxQuantity(
                                componente,
                                selectedComponentVariations[
                                    componente.id
                                    ] ?? null,
                            ),
                    );

                if (
                    limites.some(
                        (limite) =>
                            limite === 0,
                    )
                ) {
                    return 0;
                }

                const finitos =
                    limites.filter(
                        (
                            limite,
                        ): limite is number =>
                            limite !== null,
                    );

                return finitos.length > 0
                    ? Math.min(
                        ...finitos,
                    )
                    : null;
            }

            if (
                !produto.controla_estoque
            ) {
                return null;
            }

            if (selectedVariation) {
                return selectedVariation
                    .estoque_atual;
            }

            if (
                produto.variacoes.length >
                0
            ) {
                return null;
            }

            return produto.estoque_atual;
        }, [
            produto,
            selectedVariation,
            selectedComponentVariations,
        ]);

    const canAdd =
        produto.disponivel_compra &&
        (!exigeVariacao ||
            Boolean(
                selectedVariation?.disponivel,
            )) &&
        (!produto.eh_kit ||
            componentesValidos) &&
        camposObrigatoriosValidos &&
        (estoqueMaximo === null ||
            estoqueMaximo > 0) &&
        quantidade > 0;

    function resetSelection() {
        setSelectedImageId(
            produto.imagens[0]?.id ??
            null,
        );
        setSelectedVariationId(null);
        setSelectedComponentVariations(
            {},
        );
        setFieldValues({});
        setQuantidade(1);
        setAdded(false);
    }

    function openPreview() {
        resetSelection();
        setPreviewOpen(true);
    }

    function selectVariation(
        id: number,
    ) {
        setSelectedVariationId(id);
        setQuantidade(1);
    }

    function selectComponentVariation(
        componenteId: number,
        variacaoId: number,
    ) {
        setSelectedComponentVariations(
            (current) => ({
                ...current,
                [componenteId]:
                variacaoId,
            }),
        );

        setQuantidade(1);
    }

    function updateCampo(
        scope:
            | "produto"
            | "componente",
        scopeId: number,
        campoId: number,
        value: string,
    ) {
        setFieldValues(
            (current) => ({
                ...current,
                [campoStateKey(
                    scope,
                    scopeId,
                    campoId,
                )]: value,
            }),
        );
    }

    function previousImage() {
        if (
            produto.imagens.length <= 1
        ) {
            return;
        }

        const nextIndex =
            selectedImageIndex <= 0
                ? produto.imagens
                .length - 1
                : selectedImageIndex -
                1;

        setSelectedImageId(
            produto.imagens[nextIndex]
                .id,
        );
    }

    function nextImage() {
        if (
            produto.imagens.length <= 1
        ) {
            return;
        }

        const nextIndex =
            selectedImageIndex >=
            produto.imagens.length - 1
                ? 0
                : selectedImageIndex +
                1;

        setSelectedImageId(
            produto.imagens[nextIndex]
                .id,
        );
    }

    function decreaseQuantity() {
        setQuantidade((current) =>
            Math.max(
                1,
                current - 1,
            ),
        );
    }

    function increaseQuantity() {
        setQuantidade((current) => {
            const next =
                current + 1;

            if (
                estoqueMaximo !== null
            ) {
                return Math.min(
                    next,
                    Math.max(
                        estoqueMaximo,
                        1,
                    ),
                );
            }

            return Math.min(
                next,
                99,
            );
        });
    }

    function buildComponentes():
        PublicCartComponente[] {
        return produto.componentes.map(
            (componente) => {
                const variacaoId =
                    selectedComponentVariations[
                        componente.id
                        ] ?? null;

                const variacao =
                    variacaoId
                        ? componente.variacoes.find(
                        (
                            item,
                        ) =>
                            item.id ===
                            variacaoId,
                    ) ?? null
                        : null;

                return {
                    componenteId:
                    componente.id,
                    produtoId:
                    componente.produto_id,
                    produtoNome:
                    componente.nome,
                    quantidadePorKit:
                    componente.quantidade,
                    variacaoId,
                    variacaoNome:
                        variacao?.nome ??
                        null,
                    campos:
                        buildCampoValores(
                            componente.campos,
                            fieldValues,
                            "componente",
                            componente.id,
                        ),
                };
            },
        );
    }

    function addToCart() {
        if (!canAdd) return;

        addItem({
            produtoId: produto.id,
            variacaoId:
                selectedVariation?.id ??
                null,
            quantidade,
            campos:
                buildCampoValores(
                    produto.campos,
                    fieldValues,
                    "produto",
                    produto.id,
                ),
            componentes:
                buildComponentes(),
            produtoNome: produto.nome,
            produtoCodigo:
            produto.codigo,
            variacaoNome:
                selectedVariation?.nome ??
                null,
            imagemUrl:
                selectedImage?.public_url ??
                produto
                    .imagem_principal
                    ?.public_url ??
                null,
            precoVisual:
            produto.preco_aplicado,
        });

        setAdded(true);

        window.setTimeout(() => {
            setAdded(false);
            setPreviewOpen(false);
        }, 900);
    }

    const statusLabel =
        produto.status ===
        "encerrado"
            ? "Encerrado"
            : produto.status ===
            "esgotado"
                ? "Esgotado"
                : produto.modalidade_venda === "pre_venda"
                    ? "Pré-venda"
                    : produto.destaque
                        ? "Destaque"
                        : null;

    const missingSelectionLabel =
        produto.eh_kit &&
        !componentesValidos
            ? "Escolha os itens"
            : exigeVariacao &&
            !selectedVariation
                ? "Escolha uma opção"
                : !camposObrigatoriosValidos
                    ? "Preencha os campos"
                    : "Adicionar ao carrinho";

    return (
        <>
            <button
                type="button"
                className="bp-public-product-card"
                onClick={openPreview}
                aria-label={`Ver ${produto.nome}`}
            >
                <div className="bp-public-product-media">
                    {produto
                        .imagem_principal
                        ?.public_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={
                                produto
                                    .imagem_principal
                                    .public_url
                            }
                            alt={
                                produto.nome
                            }
                        />
                    ) : (
                        <div className="bp-public-product-image-empty">
                            <ImageOff
                                size={28}
                            />
                        </div>
                    )}

                    {statusLabel ? (
                        <span
                            className={`bp-public-product-status is-${produto.status}`}
                        >
                            {statusLabel}
                        </span>
                    ) : null}

                    <span className="bp-public-product-open-hint">
                        Ver produto
                    </span>
                </div>

                <div className="bp-public-product-body">
                    <div className="bp-public-product-title">
                        <span>
                            {
                                produto.tipo
                                    .nome
                            }
                            {produto.eh_kit
                                ? " · Kit"
                                : ""}
                        </span>
                        <h3>
                            {produto.nome}
                        </h3>
                    </div>

                    {produto.descricao ? (
                        <p className="bp-public-product-description">
                            {
                                produto.descricao
                            }
                        </p>
                    ) : null}

                    <div className="bp-public-product-prices">
                        <div>
                            <span>
                                {produto.socio_aplicado
                                    ? "Seu preço"
                                    : "Preço"}
                            </span>
                            <strong>
                                {money(
                                    produto.preco_aplicado,
                                )}
                            </strong>
                        </div>

                        {produto.preco_socio !==
                        null &&
                        !produto.socio_aplicado ? (
                            <div className="bp-public-member-price">
                                <Sparkles
                                    size={
                                        14
                                    }
                                />
                                <span>
                                    Sócio{" "}
                                    <strong>
                                        {money(
                                            produto.preco_socio,
                                        )}
                                    </strong>
                                </span>
                            </div>
                        ) : null}

                        {produto.socio_aplicado ? (
                            <div className="bp-public-member-price is-applied">
                                <Check
                                    size={
                                        14
                                    }
                                />
                                Preço de
                                sócio
                                aplicado
                            </div>
                        ) : null}
                    </div>
                </div>
            </button>

            <Modal
                open={previewOpen}
                size="full"
                title={produto.nome}
                description={
                    produto.eh_kit
                        ? "Escolha as opções de cada item do kit e preencha os dados necessários."
                        : "Escolha as opções e preencha os dados necessários antes de adicionar ao carrinho."
                }
                onCloseAction={() =>
                    setPreviewOpen(false)
                }
                footer={
                    <>
                        <Button
                            type="button"
                            color="secondary"
                            variant="ghost"
                            onClick={() =>
                                setPreviewOpen(
                                    false,
                                )
                            }
                        >
                            Fechar
                        </Button>

                        <Button
                            type="button"
                            disabled={
                                !canAdd ||
                                added
                            }
                            onClick={
                                addToCart
                            }
                        >
                            {added ? (
                                <>
                                    <Check
                                        size={
                                            17
                                        }
                                    />
                                    Adicionado
                                </>
                            ) : (
                                <>
                                    <ShoppingBag
                                        size={
                                            17
                                        }
                                    />
                                    {produto.status ===
                                    "encerrado"
                                        ? "Venda encerrada"
                                        : produto.status ===
                                        "esgotado"
                                            ? "Esgotado"
                                            : missingSelectionLabel}
                                </>
                            )}
                        </Button>
                    </>
                }
            >
                <div className="bp-public-product-detail">
                    <section className="bp-public-product-gallery">
                        <div className="bp-public-product-main-image">
                            {selectedImage?.public_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={
                                        selectedImage.public_url
                                    }
                                    alt={
                                        produto.nome
                                    }
                                />
                            ) : (
                                <div className="bp-public-product-main-empty">
                                    <ImageOff
                                        size={
                                            42
                                        }
                                    />
                                    <span>
                                        Produto sem
                                        imagem.
                                    </span>
                                </div>
                            )}

                            {produto.imagens
                                .length >
                            1 ? (
                                <>
                                    <button
                                        type="button"
                                        className="bp-public-gallery-arrow is-left"
                                        onClick={
                                            previousImage
                                        }
                                        aria-label="Imagem anterior"
                                    >
                                        <ChevronLeft
                                            size={
                                                20
                                            }
                                        />
                                    </button>

                                    <button
                                        type="button"
                                        className="bp-public-gallery-arrow is-right"
                                        onClick={
                                            nextImage
                                        }
                                        aria-label="Próxima imagem"
                                    >
                                        <ChevronRight
                                            size={
                                                20
                                            }
                                        />
                                    </button>
                                </>
                            ) : null}
                        </div>

                        {produto.imagens
                            .length >
                        1 ? (
                            <div className="bp-public-product-thumbs">
                                {produto.imagens.map(
                                    (
                                        imagem,
                                    ) => (
                                        <button
                                            key={
                                                imagem.id
                                            }
                                            type="button"
                                            className={
                                                selectedImage?.id ===
                                                imagem.id
                                                    ? "is-active"
                                                    : ""
                                            }
                                            onClick={() =>
                                                setSelectedImageId(
                                                    imagem.id,
                                                )
                                            }
                                        >
                                            {imagem.public_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={
                                                        imagem.public_url
                                                    }
                                                    alt=""
                                                />
                                            ) : (
                                                <ImageOff
                                                    size={
                                                        18
                                                    }
                                                />
                                            )}
                                        </button>
                                    ),
                                )}
                            </div>
                        ) : null}
                    </section>

                    <section className="bp-public-product-detail-info">
                        <div className="bp-public-product-detail-heading">
                            <span className="bp-public-product-detail-type">
                                {
                                    produto.tipo
                                        .nome
                                }{" "}
                                ·{" "}
                                {
                                    produto.codigo
                                }
                            </span>

                            <h2>
                                {produto.nome}
                            </h2>

                            {produto.descricao ? (
                                <p>
                                    {
                                        produto.descricao
                                    }
                                </p>
                            ) : null}
                        </div>

                        <div className="bp-public-product-detail-price">
                            <span>
                                {produto.socio_aplicado
                                    ? "Seu preço"
                                    : "Preço"}
                            </span>
                            <strong>
                                {money(
                                    produto.preco_aplicado,
                                )}
                            </strong>

                            {produto.preco_socio !==
                            null &&
                            !produto.socio_aplicado ? (
                                <small>
                                    Sócio
                                    paga{" "}
                                    <strong>
                                        {money(
                                            produto.preco_socio,
                                        )}
                                    </strong>
                                </small>
                            ) : null}

                            {produto.socio_aplicado ? (
                                <small className="is-member">
                                    <Sparkles
                                        size={
                                            14
                                        }
                                    />
                                    Benefício
                                    de sócio
                                    aplicado
                                </small>
                            ) : null}
                        </div>

                        {produto.eh_kit ? (
                            <div className="bp-public-product-variations">
                                <div className="bp-public-product-detail-label">
                                    <strong>
                                        Itens do
                                        kit
                                    </strong>
                                    <span>
                                        Escolha
                                        uma opção
                                        para cada
                                        item que
                                        possuir
                                        variações.
                                    </span>
                                </div>

                                <div
                                    style={{
                                        display:
                                            "grid",
                                        gap: 14,
                                    }}
                                >
                                    {produto.componentes.map(
                                        (
                                            componente,
                                        ) => (
                                            <div
                                                key={
                                                    componente.id
                                                }
                                                style={{
                                                    display:
                                                        "grid",
                                                    gap: 8,
                                                }}
                                            >
                                                <div className="bp-public-product-detail-label">
                                                    <strong>
                                                        {
                                                            componente.nome
                                                        }{" "}
                                                        ×{" "}
                                                        {
                                                            componente.quantidade
                                                        }
                                                    </strong>
                                                    {!componente.disponivel ? (
                                                        <span>
                                                            Esgotado
                                                        </span>
                                                    ) : componente
                                                        .variacoes
                                                        .length ===
                                                    0 ? (
                                                        <span>
                                                            Incluído
                                                            no
                                                            kit.
                                                        </span>
                                                    ) : (
                                                        <span>
                                                            Selecione
                                                            uma
                                                            opção.
                                                        </span>
                                                    )}
                                                </div>

                                                {componente
                                                    .variacoes
                                                    .length >
                                                0 ? (
                                                    <div className="bp-public-product-variation-options">
                                                        {componente.variacoes.map(
                                                            (
                                                                variacao,
                                                            ) => (
                                                                <button
                                                                    key={
                                                                        variacao.id
                                                                    }
                                                                    type="button"
                                                                    disabled={
                                                                        !variacao.disponivel
                                                                    }
                                                                    className={
                                                                        selectedComponentVariations[
                                                                            componente.id
                                                                            ] ===
                                                                        variacao.id
                                                                            ? "is-active"
                                                                            : ""
                                                                    }
                                                                    onClick={() =>
                                                                        selectComponentVariation(
                                                                            componente.id,
                                                                            variacao.id,
                                                                        )
                                                                    }
                                                                >
                                                                    <span>
                                                                        {
                                                                            variacao.nome
                                                                        }
                                                                    </span>
                                                                    {!variacao.disponivel ? (
                                                                        <small>
                                                                            Esgotado
                                                                        </small>
                                                                    ) : variacao.estoque_atual !==
                                                                    null ? (
                                                                        <small>
                                                                            {
                                                                                variacao.estoque_atual
                                                                            }{" "}
                                                                            em
                                                                            estoque
                                                                        </small>
                                                                    ) : null}
                                                                </button>
                                                            ),
                                                        )}
                                                    </div>
                                                ) : null}

                                                {componente.campos.map(
                                                    (
                                                        campo,
                                                    ) => (
                                                        <Input
                                                            key={
                                                                campo.id
                                                            }
                                                            label={`${campo.nome}${
                                                                campo.obrigatorio
                                                                    ? " *"
                                                                    : ""
                                                            }`}
                                                            type={
                                                                campo.tipo ===
                                                                "numero"
                                                                    ? "number"
                                                                    : "text"
                                                            }
                                                            value={getCampoValue(
                                                                fieldValues,
                                                                "componente",
                                                                componente.id,
                                                                campo.id,
                                                            )}
                                                            onChange={(
                                                                event,
                                                            ) =>
                                                                updateCampo(
                                                                    "componente",
                                                                    componente.id,
                                                                    campo.id,
                                                                    event
                                                                        .target
                                                                        .value,
                                                                )
                                                            }
                                                            helperText={
                                                                campo.descricao ??
                                                                undefined
                                                            }
                                                            required={
                                                                campo.obrigatorio
                                                            }
                                                        />
                                                    ),
                                                )}
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                        ) : exigeVariacao ? (
                            <div className="bp-public-product-variations">
                                <div className="bp-public-product-detail-label">
                                    <strong>
                                        Escolha
                                        uma opção
                                    </strong>
                                    <span>
                                        Selecione
                                        antes de
                                        adicionar
                                        ao
                                        carrinho.
                                    </span>
                                </div>

                                <div className="bp-public-product-variation-options">
                                    {produto.variacoes.map(
                                        (
                                            variacao,
                                        ) => (
                                            <button
                                                key={
                                                    variacao.id
                                                }
                                                type="button"
                                                disabled={
                                                    !variacao.disponivel
                                                }
                                                className={
                                                    selectedVariationId ===
                                                    variacao.id
                                                        ? "is-active"
                                                        : ""
                                                }
                                                onClick={() =>
                                                    selectVariation(
                                                        variacao.id,
                                                    )
                                                }
                                            >
                                                <span>
                                                    {
                                                        variacao.nome
                                                    }
                                                </span>

                                                {!variacao.disponivel ? (
                                                    <small>
                                                        Esgotado
                                                    </small>
                                                ) : produto.controla_estoque &&
                                                variacao.estoque_atual !==
                                                null ? (
                                                    <small>
                                                        {
                                                            variacao.estoque_atual
                                                        }{" "}
                                                        disponível(is)
                                                    </small>
                                                ) : null}
                                            </button>
                                        ),
                                    )}
                                </div>
                            </div>
                        ) : null}

                        {produto.campos.length >
                        0 ? (
                            <div className="bp-public-product-variations">
                                <div className="bp-public-product-detail-label">
                                    <strong>
                                        Personalização
                                    </strong>
                                    <span>
                                        Preencha
                                        os dados
                                        solicitados.
                                    </span>
                                </div>

                                <div
                                    style={{
                                        display:
                                            "grid",
                                        gap: 10,
                                    }}
                                >
                                    {produto.campos.map(
                                        (
                                            campo,
                                        ) => (
                                            <Input
                                                key={
                                                    campo.id
                                                }
                                                label={`${campo.nome}${
                                                    campo.obrigatorio
                                                        ? " *"
                                                        : ""
                                                }`}
                                                type={
                                                    campo.tipo ===
                                                    "numero"
                                                        ? "number"
                                                        : "text"
                                                }
                                                value={getCampoValue(
                                                    fieldValues,
                                                    "produto",
                                                    produto.id,
                                                    campo.id,
                                                )}
                                                onChange={(
                                                    event,
                                                ) =>
                                                    updateCampo(
                                                        "produto",
                                                        produto.id,
                                                        campo.id,
                                                        event
                                                            .target
                                                            .value,
                                                    )
                                                }
                                                helperText={
                                                    campo.descricao ??
                                                    undefined
                                                }
                                                required={
                                                    campo.obrigatorio
                                                }
                                            />
                                        ),
                                    )}
                                </div>
                            </div>
                        ) : null}

                        <div className="bp-public-product-buy-row">
                            <div className="bp-public-product-detail-label">
                                <strong>
                                    Quantidade
                                </strong>
                                {estoqueMaximo !==
                                null ? (
                                    <span>
                                        {
                                            estoqueMaximo
                                        }{" "}
                                        disponível(is)
                                    </span>
                                ) : (
                                    <span>
                                        Escolha
                                        a
                                        quantidade.
                                    </span>
                                )}
                            </div>

                            <div className="bp-public-product-quantity">
                                <button
                                    type="button"
                                    onClick={
                                        decreaseQuantity
                                    }
                                    disabled={
                                        quantidade <=
                                        1
                                    }
                                    aria-label="Diminuir quantidade"
                                >
                                    <Minus
                                        size={
                                            16
                                        }
                                    />
                                </button>

                                <strong>
                                    {
                                        quantidade
                                    }
                                </strong>

                                <button
                                    type="button"
                                    onClick={
                                        increaseQuantity
                                    }
                                    disabled={
                                        estoqueMaximo !==
                                        null &&
                                        quantidade >=
                                        estoqueMaximo
                                    }
                                    aria-label="Aumentar quantidade"
                                >
                                    <Plus
                                        size={
                                            16
                                        }
                                    />
                                </button>
                            </div>
                        </div>

                        {!produto.disponivel_compra ? (
                            <div className="bp-public-product-unavailable">
                                {produto.status ===
                                "encerrado"
                                    ? "A venda deste produto foi encerrada."
                                    : "Este produto está esgotado no momento."}
                            </div>
                        ) : null}
                    </section>
                </div>
            </Modal>
        </>
    );
}
