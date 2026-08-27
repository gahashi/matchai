"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Loader2,
    Minus,
    Plus,
    ShoppingBag,
    Trash2,
} from "lucide-react";

import { usePublicCart } from "@/components/public/PublicCartProvider";
import { Button } from "@/components/ui/Button";

type ValidatedItem = {
    line_key: string;
    produto_id: number;
    variacao_id: number | null;
    quantidade: number;
    disponivel: boolean;
    motivo: string | null;
    produto:
        | {
        nome: string;
        codigo: string;
        imagem_principal: {
            public_url: string | null;
        } | null;
        preco_normal: number;
        preco_socio: number | null;
        preco_aplicado: number;
        socio_aplicado: boolean;
    }
        | null;
    variacao?: {
        id: number;
        nome: string;
        estoque_atual: number | null;
    } | null;
    preco_unitario?: number;
    subtotal?: number;
    socio_aplicado?: boolean;
};

function money(value: number) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}

export function CartPageClient() {
    const {
        hydrated,
        items,
        setQuantity,
        removeItem,
        clearCart,
    } = usePublicCart();

    const [validated, setValidated] = useState<ValidatedItem[]>([]);
    const [validating, setValidating] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    useEffect(() => {
        if (!hydrated) return;

        if (items.length === 0) {
            setValidated([]);
            setValidationError(null);
            setValidating(false);
            return;
        }

        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
            try {
                setValidating(true);
                setValidationError(null);

                const response = await fetch("/api/public/carrinho/validar", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        items: items.map((item) => ({
                            line_key: item.lineKey,
                            produto_id: item.produtoId,
                            variacao_id: item.variacaoId,
                            quantidade: item.quantidade,

                            campos: item.campos.map((campo) => ({
                                campo_id: campo.campoId,
                                valor: campo.valor,
                            })),

                            componentes: item.componentes.map(
                                (componente) => ({
                                    componente_id:
                                    componente.componenteId,
                                    variacao_id:
                                    componente.variacaoId,
                                    campos: componente.campos.map(
                                        (campo) => ({
                                            campo_id: campo.campoId,
                                            valor: campo.valor,
                                        }),
                                    ),
                                }),
                            ),
                        })),
                    }),
                    signal: controller.signal,
                });

                const result = await response.json();

                if (!response.ok || !result.ok) {
                    throw new Error(
                        result.message || "Não foi possível atualizar o carrinho.",
                    );
                }

                setValidated(result.data.items);
            } catch (error) {
                if (error instanceof DOMException && error.name === "AbortError") {
                    return;
                }

                setValidationError(
                    error instanceof Error
                        ? error.message
                        : "Não foi possível atualizar o carrinho.",
                );
            } finally {
                if (!controller.signal.aborted) setValidating(false);
            }
        }, 220);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [hydrated, items]);

    const validatedMap = useMemo(
        () =>
            new Map(
                validated.map((item) => [
                    item.line_key,
                    item,
                ]),
            ),
        [validated],
    );

    const total = validated.reduce(
        (sum, item) => (item.disponivel ? sum + (item.subtotal ?? 0) : sum),
        0,
    );

    const hasUnavailable = validated.some((item) => !item.disponivel);

    if (!hydrated) {
        return (
            <div className="bp-public-cart-loading">
                <Loader2 size={24} />
                Carregando carrinho...
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <section className="bp-public-cart-empty">
                <div>
                    <ShoppingBag size={30} />
                </div>
                <h1>Seu carrinho está vazio</h1>
                <p>
                    Confira os produtos disponíveis da AAACCU e adicione o que quiser.
                </p>
                <Link href="/#produtos" className="bp-public-primary-link">
                    Ver produtos
                </Link>
            </section>
        );
    }

    return (
        <div className="bp-public-cart-page">
            <div className="bp-public-cart-page-head">
                <div>
                    <Link href="/#produtos" className="bp-public-back-link">
                        <ArrowLeft size={16} />
                        Continuar comprando
                    </Link>
                    <h1>Carrinho</h1>
                    <p>
                        Preços e estoque são conferidos novamente pelo servidor antes da compra.
                    </p>
                </div>

                <Button
                    type="button"
                    color="secondary"
                    variant="ghost"
                    onClick={clearCart}
                >
                    <Trash2 size={16} />
                    Limpar
                </Button>
            </div>

            {validationError ? (
                <div className="bp-public-cart-alert">{validationError}</div>
            ) : null}

            <div className="bp-public-cart-layout">
                <section className="bp-public-cart-items">
                    {items.map((item) => {
                        const authoritative = validatedMap.get(
                            item.lineKey,
                        );
                        const produto = authoritative?.produto ?? null;
                        const available = authoritative
                            ? authoritative.disponivel
                            : true;
                        const imageUrl =
                            produto?.imagem_principal?.public_url ?? item.imagemUrl;

                        return (
                            <article
                                key={item.lineKey}
                                className={`bp-public-cart-item ${
                                    available ? "" : "is-unavailable"
                                }`}
                            >
                                <div className="bp-public-cart-item-media">
                                    {imageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={imageUrl} alt="" />
                                    ) : (
                                        <ShoppingBag size={22} />
                                    )}
                                </div>

                                <div className="bp-public-cart-item-main">
                                    <span className="bp-public-cart-item-code">
                                        {produto?.codigo ?? item.produtoCodigo}
                                    </span>
                                    <strong>{produto?.nome ?? item.produtoNome}</strong>

                                    {(authoritative?.variacao?.nome ??
                                        item.variacaoNome) ? (
                                        <span className="bp-public-cart-item-variation">
                                            {authoritative?.variacao?.nome ??
                                                item.variacaoNome}
                                        </span>
                                    ) : null}

                                    {item.componentes.length > 0 ? (
                                        <div
                                            style={{
                                                display: "grid",
                                                gap: 4,
                                                marginTop: 6,
                                            }}
                                        >
                                            {item.componentes.map(
                                                (componente) => (
                                                    <span
                                                        key={componente.componenteId}
                                                        className="bp-public-cart-item-variation"
                                                    >
                                                        {componente.produtoNome}
                                                        {componente.variacaoNome
                                                            ? ` · ${componente.variacaoNome}`
                                                            : ""}
                                                        {componente.quantidadePorKit > 1
                                                            ? ` × ${componente.quantidadePorKit}`
                                                            : ""}
                                                    </span>
                                                ),
                                            )}
                                        </div>
                                    ) : null}

                                    {(item.campos.length > 0 ||
                                        item.componentes.some(
                                            (componente) =>
                                                componente.campos.length > 0,
                                        )) ? (
                                        <div
                                            style={{
                                                display: "grid",
                                                gap: 3,
                                                marginTop: 6,
                                            }}
                                        >
                                            {item.campos.map((campo) => (
                                                <small key={`produto:${campo.campoId}`}>
                                                    {campo.nome}:{" "}
                                                    <strong>{campo.valor}</strong>
                                                </small>
                                            ))}

                                            {item.componentes.flatMap(
                                                (componente) =>
                                                    componente.campos.map(
                                                        (campo) => (
                                                            <small
                                                                key={`${componente.componenteId}:${campo.campoId}`}
                                                            >
                                                                {componente.produtoNome} ·{" "}
                                                                {campo.nome}:{" "}
                                                                <strong>
                                                                    {campo.valor}
                                                                </strong>
                                                            </small>
                                                        ),
                                                    ),
                                            )}
                                        </div>
                                    ) : null}

                                    {!available ? (
                                        <span className="bp-public-cart-item-error">
                                            {authoritative?.motivo ??
                                                "Item indisponível."}
                                        </span>
                                    ) : null}

                                    {authoritative?.socio_aplicado ? (
                                        <span className="bp-public-cart-member">
                                            Preço de sócio aplicado
                                        </span>
                                    ) : null}
                                </div>

                                <div className="bp-public-cart-item-side">
                                    <strong>
                                        {money(
                                            authoritative?.preco_unitario ??
                                            item.precoVisual,
                                        )}
                                    </strong>

                                    <div className="bp-public-quantity">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setQuantity(
                                                    item.lineKey,
                                                    item.quantidade - 1,
                                                )
                                            }
                                            aria-label="Diminuir quantidade"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span>{item.quantidade}</span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setQuantity(
                                                    item.lineKey,
                                                    item.quantidade + 1,
                                                )
                                            }
                                            aria-label="Aumentar quantidade"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        className="bp-public-remove-item"
                                        onClick={() =>
                                            removeItem(
                                                item.lineKey,
                                            )
                                        }
                                    >
                                        Remover
                                    </button>
                                </div>
                            </article>
                        );
                    })}
                </section>

                <aside className="bp-public-cart-summary">
                    <div className="bp-public-cart-summary-head">
                        <span>Resumo</span>
                        {validating ? <Loader2 size={17} /> : null}
                    </div>

                    <div className="bp-public-cart-summary-row">
                        <span>Produtos</span>
                        <strong>{money(total)}</strong>
                    </div>

                    <div className="bp-public-cart-summary-total">
                        <span>Total</span>
                        <strong>{money(total)}</strong>
                    </div>

                    {hasUnavailable ? (
                        <p className="bp-public-cart-summary-warning">
                            Remova ou ajuste os itens indisponíveis antes de continuar.
                        </p>
                    ) : null}

                    <Link
                        href="/checkout"
                        className="bp-public-primary-link"
                        aria-disabled={
                            validating || hasUnavailable
                        }
                        onClick={(event) => {
                            if (
                                validating ||
                                hasUnavailable
                            ) {
                                event.preventDefault();
                            }
                        }}
                    >
                        Continuar para checkout
                    </Link>

                    <small>
                        O estoque e os preços serão conferidos novamente no checkout antes do pagamento.
                    </small>
                </aside>
            </div>
        </div>
    );
}
