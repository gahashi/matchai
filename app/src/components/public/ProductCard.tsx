"use client";

import { useMemo, useState } from "react";
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

import { usePublicCart } from "@/components/public/PublicCartProvider";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { PublicProduto } from "@/lib/prd/produto-public-types";

function money(value: number) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}

export function ProductCard({ produto }: { produto: PublicProduto }) {
    const { addItem } = usePublicCart();

    const [previewOpen, setPreviewOpen] = useState(false);
    const [selectedImageId, setSelectedImageId] =
        useState<number | null>(produto.imagens[0]?.id ?? null);
    const [selectedVariationId, setSelectedVariationId] =
        useState<number | null>(null);
    const [quantidade, setQuantidade] = useState(1);
    const [added, setAdded] = useState(false);

    const selectedVariation = useMemo(
        () =>
            produto.variacoes.find(
                (variacao) => variacao.id === selectedVariationId,
            ) ?? null,
        [produto.variacoes, selectedVariationId],
    );

    const selectedImageIndex = useMemo(() => {
        if (produto.imagens.length === 0) return -1;

        const index = produto.imagens.findIndex(
            (imagem) => imagem.id === selectedImageId,
        );

        return index >= 0 ? index : 0;
    }, [produto.imagens, selectedImageId]);

    const selectedImage =
        selectedImageIndex >= 0
            ? produto.imagens[selectedImageIndex]
            : null;

    const estoqueMaximo = produto.controla_estoque
        ? selectedVariation
            ? selectedVariation.estoque_atual
            : produto.variacoes.length > 0
                ? null
                : produto.estoque_atual
        : null;

    const exigeVariacao = produto.variacoes.length > 0;

    const canAdd =
        produto.disponivel_compra &&
        (!exigeVariacao || Boolean(selectedVariation)) &&
        (estoqueMaximo === null || estoqueMaximo > 0) &&
        quantidade > 0;

    function openPreview() {
        setSelectedImageId(produto.imagens[0]?.id ?? null);
        setSelectedVariationId(null);
        setQuantidade(1);
        setAdded(false);
        setPreviewOpen(true);
    }

    function selectVariation(id: number) {
        setSelectedVariationId(id);
        setQuantidade(1);
    }

    function previousImage() {
        if (produto.imagens.length <= 1) return;

        const nextIndex =
            selectedImageIndex <= 0
                ? produto.imagens.length - 1
                : selectedImageIndex - 1;

        setSelectedImageId(produto.imagens[nextIndex].id);
    }

    function nextImage() {
        if (produto.imagens.length <= 1) return;

        const nextIndex =
            selectedImageIndex >= produto.imagens.length - 1
                ? 0
                : selectedImageIndex + 1;

        setSelectedImageId(produto.imagens[nextIndex].id);
    }

    function decreaseQuantity() {
        setQuantidade((current) => Math.max(1, current - 1));
    }

    function increaseQuantity() {
        setQuantidade((current) => {
            const next = current + 1;

            if (estoqueMaximo !== null) {
                return Math.min(next, Math.max(estoqueMaximo, 1));
            }

            return Math.min(next, 99);
        });
    }

    function addToCart() {
        if (!canAdd) return;

        addItem({
            produtoId: produto.id,
            variacaoId: selectedVariation?.id ?? null,
            quantidade,
            produtoNome: produto.nome,
            produtoCodigo: produto.codigo,
            variacaoNome: selectedVariation?.nome ?? null,
            imagemUrl:
                selectedImage?.public_url ??
                produto.imagem_principal?.public_url ??
                null,
            precoVisual: produto.preco_aplicado,
        });

        setAdded(true);

        window.setTimeout(() => {
            setAdded(false);
            setPreviewOpen(false);
        }, 900);
    }

    const statusLabel =
        produto.status === "encerrado"
            ? "Encerrado"
            : produto.status === "esgotado"
                ? "Esgotado"
                : produto.destaque
                    ? "Destaque"
                    : null;

    return (
        <>
            <button
                type="button"
                className="bp-public-product-card"
                onClick={openPreview}
                aria-label={`Ver ${produto.nome}`}
            >
                <div className="bp-public-product-media">
                    {produto.imagem_principal?.public_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={produto.imagem_principal.public_url}
                            alt={produto.nome}
                        />
                    ) : (
                        <div className="bp-public-product-image-empty">
                            <ImageOff size={28} />
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
                        <span>{produto.tipo.nome}</span>
                        <h3>{produto.nome}</h3>
                    </div>

                    {produto.descricao ? (
                        <p className="bp-public-product-description">
                            {produto.descricao}
                        </p>
                    ) : null}

                    <div className="bp-public-product-prices">
                        <div>
                            <span>
                                {produto.socio_aplicado
                                    ? "Seu preço"
                                    : "Preço"}
                            </span>
                            <strong>{money(produto.preco_aplicado)}</strong>
                        </div>

                        {produto.preco_socio !== null &&
                        !produto.socio_aplicado ? (
                            <div className="bp-public-member-price">
                                <Sparkles size={14} />
                                <span>
                                    Sócio{" "}
                                    <strong>{money(produto.preco_socio)}</strong>
                                </span>
                            </div>
                        ) : null}

                        {produto.socio_aplicado ? (
                            <div className="bp-public-member-price is-applied">
                                <Check size={14} />
                                Preço de sócio aplicado
                            </div>
                        ) : null}
                    </div>
                </div>
            </button>

            <Modal
                open={previewOpen}
                size="full"
                title={produto.nome}
                description="Escolha a opção e a quantidade antes de adicionar ao carrinho."
                onCloseAction={() => setPreviewOpen(false)}
                footer={
                    <>
                        <Button
                            type="button"
                            color="secondary"
                            variant="ghost"
                            onClick={() => setPreviewOpen(false)}
                        >
                            Fechar
                        </Button>

                        <Button
                            type="button"
                            disabled={!canAdd || added}
                            onClick={addToCart}
                        >
                            {added ? (
                                <>
                                    <Check size={17} />
                                    Adicionado
                                </>
                            ) : (
                                <>
                                    <ShoppingBag size={17} />
                                    {produto.status === "encerrado"
                                        ? "Venda encerrada"
                                        : produto.status === "esgotado"
                                            ? "Esgotado"
                                            : exigeVariacao &&
                                            !selectedVariation
                                                ? "Escolha uma opção"
                                                : "Adicionar ao carrinho"}
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
                                    src={selectedImage.public_url}
                                    alt={produto.nome}
                                />
                            ) : (
                                <div className="bp-public-product-main-empty">
                                    <ImageOff size={42} />
                                    <span>Produto sem imagem.</span>
                                </div>
                            )}

                            {produto.imagens.length > 1 ? (
                                <>
                                    <button
                                        type="button"
                                        className="bp-public-gallery-arrow is-left"
                                        onClick={previousImage}
                                        aria-label="Imagem anterior"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>

                                    <button
                                        type="button"
                                        className="bp-public-gallery-arrow is-right"
                                        onClick={nextImage}
                                        aria-label="Próxima imagem"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </>
                            ) : null}
                        </div>

                        {produto.imagens.length > 1 ? (
                            <div className="bp-public-product-thumbs">
                                {produto.imagens.map((imagem) => (
                                    <button
                                        key={imagem.id}
                                        type="button"
                                        className={
                                            selectedImage?.id === imagem.id
                                                ? "is-active"
                                                : ""
                                        }
                                        onClick={() =>
                                            setSelectedImageId(imagem.id)
                                        }
                                    >
                                        {imagem.public_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={imagem.public_url}
                                                alt=""
                                            />
                                        ) : (
                                            <ImageOff size={18} />
                                        )}
                                    </button>
                                ))}
                            </div>
                        ) : null}
                    </section>

                    <section className="bp-public-product-detail-info">
                        <div className="bp-public-product-detail-heading">
                            <span className="bp-public-product-detail-type">
                                {produto.tipo.nome} · {produto.codigo}
                            </span>

                            <h2>{produto.nome}</h2>

                            {produto.descricao ? (
                                <p>{produto.descricao}</p>
                            ) : null}
                        </div>

                        <div className="bp-public-product-detail-price">
                            <span>
                                {produto.socio_aplicado
                                    ? "Seu preço"
                                    : "Preço"}
                            </span>
                            <strong>{money(produto.preco_aplicado)}</strong>

                            {produto.preco_socio !== null &&
                            !produto.socio_aplicado ? (
                                <small>
                                    Sócio paga{" "}
                                    <strong>{money(produto.preco_socio)}</strong>
                                </small>
                            ) : null}

                            {produto.socio_aplicado ? (
                                <small className="is-member">
                                    <Sparkles size={14} />
                                    Benefício de sócio aplicado
                                </small>
                            ) : null}
                        </div>

                        {exigeVariacao ? (
                            <div className="bp-public-product-variations">
                                <div className="bp-public-product-detail-label">
                                    <strong>Escolha uma opção</strong>
                                    <span>
                                        Selecione antes de adicionar ao carrinho.
                                    </span>
                                </div>

                                <div className="bp-public-product-variation-options">
                                    {produto.variacoes.map((variacao) => {
                                        const semEstoque =
                                            produto.controla_estoque &&
                                            variacao.estoque_atual === 0;

                                        return (
                                            <button
                                                key={variacao.id}
                                                type="button"
                                                disabled={semEstoque}
                                                className={
                                                    selectedVariationId ===
                                                    variacao.id
                                                        ? "is-active"
                                                        : ""
                                                }
                                                onClick={() =>
                                                    selectVariation(variacao.id)
                                                }
                                            >
                                                <span>{variacao.nome}</span>

                                                {produto.controla_estoque &&
                                                variacao.estoque_atual !==
                                                null ? (
                                                    <small>
                                                        {semEstoque
                                                            ? "Esgotado"
                                                            : `${variacao.estoque_atual} disponível(is)`}
                                                    </small>
                                                ) : null}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : null}

                        <div className="bp-public-product-buy-row">
                            <div className="bp-public-product-detail-label">
                                <strong>Quantidade</strong>
                                {estoqueMaximo !== null ? (
                                    <span>{estoqueMaximo} disponível(is)</span>
                                ) : (
                                    <span>Escolha a quantidade.</span>
                                )}
                            </div>

                            <div className="bp-public-product-quantity">
                                <button
                                    type="button"
                                    onClick={decreaseQuantity}
                                    disabled={quantidade <= 1}
                                    aria-label="Diminuir quantidade"
                                >
                                    <Minus size={16} />
                                </button>

                                <strong>{quantidade}</strong>

                                <button
                                    type="button"
                                    onClick={increaseQuantity}
                                    disabled={
                                        estoqueMaximo !== null &&
                                        quantidade >= estoqueMaximo
                                    }
                                    aria-label="Aumentar quantidade"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>

                        {!produto.disponivel_compra ? (
                            <div className="bp-public-product-unavailable">
                                {produto.status === "encerrado"
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
