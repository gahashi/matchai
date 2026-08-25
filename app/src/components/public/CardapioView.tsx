import type {
    CSSProperties,
} from "react";

import {
    Building2,
    ImageIcon,
    Utensils,
} from "lucide-react";


export type CardapioViewItem = {
    id: number;
    nome: string;
    descricao: string | null;
    preco: number;
    imagem_url: string | null;
};


export type CardapioViewCategoria = {
    id: number;
    nome: string;
    descricao: string | null;
    itens: CardapioViewItem[];
};


export type CardapioViewParceiro = {
    nome: string;
    descricao: string | null;

    tema: {
        cor_primaria: string | null;
        cor_secundaria: string | null;
        cor_fundo: string | null;
        cor_texto: string | null;

        logo_url: string | null;
        banner_url: string | null;
    };

    categorias: CardapioViewCategoria[];
};


type Props = {
    parceiro: CardapioViewParceiro;
    preview?: boolean;
};


function money(
    value: number,
) {
    return new Intl.NumberFormat(
        "pt-BR",
        {
            style:
                "currency",

            currency:
                "BRL",
        },
    ).format(
        value,
    );
}


export function CardapioView({
    parceiro,
    preview = false,
}: Props) {
    const primaria =
        parceiro
            .tema
            .cor_primaria ??
        "#9CD91A";

    const secundaria =
        parceiro
            .tema
            .cor_secundaria ??
        "#F5F2E8";

    const fundo =
        parceiro
            .tema
            .cor_fundo ??
        "#141414";

    const texto =
        parceiro
            .tema
            .cor_texto ??
        "#F5F2E8";


    const themeStyle =
        {
            "--cardapio-primary":
            primaria,

            "--cardapio-secondary":
            secundaria,

            "--cardapio-background":
            fundo,

            "--cardapio-text":
            texto,
        } as CSSProperties;


    return (
        <main
            className={[
                "bp-cardapio-public",

                preview
                    ? "bp-cardapio-preview"
                    : "",
            ]
                .filter(
                    Boolean,
                )
                .join(
                    " ",
                )}
            style={
                themeStyle
            }
        >
            <section className="bp-cardapio-hero">
                {parceiro
                    .tema
                    .banner_url ? (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={
                                parceiro
                                    .tema
                                    .banner_url
                            }
                            alt=""
                            className="bp-cardapio-hero-banner"
                        />

                        <div className="bp-cardapio-hero-overlay" />
                    </>
                ) : null}

                <div className="bp-cardapio-container bp-cardapio-hero-content">
                    <div className="bp-cardapio-brand">
                        <div className="bp-cardapio-logo">
                            {parceiro
                                .tema
                                .logo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={
                                        parceiro
                                            .tema
                                            .logo_url
                                    }
                                    alt={
                                        parceiro.nome
                                    }
                                />
                            ) : (
                                <Building2
                                    size={
                                        36
                                    }
                                />
                            )}
                        </div>

                        <div>
                            <span className="bp-cardapio-kicker">
                                Cardápio
                            </span>

                            <h1>
                                {
                                    parceiro.nome
                                }
                            </h1>

                            {parceiro.descricao ? (
                                <p>
                                    {
                                        parceiro.descricao
                                    }
                                </p>
                            ) : null}
                        </div>
                    </div>
                </div>
            </section>


            <div className="bp-cardapio-container bp-cardapio-content">
                {parceiro
                    .categorias
                    .length >
                0 ? (
                    parceiro
                        .categorias
                        .map(
                            (
                                categoria,
                            ) => (
                                <section
                                    key={
                                        categoria.id
                                    }
                                    className="bp-cardapio-category"
                                >
                                    <header className="bp-cardapio-category-head">
                                        <div>
                                            <span className="bp-cardapio-kicker">
                                                <Utensils
                                                    size={
                                                        14
                                                    }
                                                />

                                                Categoria
                                            </span>

                                            <h2>
                                                {
                                                    categoria.nome
                                                }
                                            </h2>

                                            {categoria.descricao ? (
                                                <p>
                                                    {
                                                        categoria.descricao
                                                    }
                                                </p>
                                            ) : null}
                                        </div>
                                    </header>

                                    <div className="bp-cardapio-grid">
                                        {categoria
                                            .itens
                                            .map(
                                                (
                                                    item,
                                                ) => (
                                                    <article
                                                        key={
                                                            item.id
                                                        }
                                                        className="bp-cardapio-item"
                                                    >
                                                        <div className="bp-cardapio-item-image">
                                                            {item.imagem_url ? (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img
                                                                    src={
                                                                        item.imagem_url
                                                                    }
                                                                    alt={
                                                                        item.nome
                                                                    }
                                                                />
                                                            ) : (
                                                                <ImageIcon
                                                                    size={
                                                                        28
                                                                    }
                                                                />
                                                            )}
                                                        </div>

                                                        <div className="bp-cardapio-item-body">
                                                            <div className="bp-cardapio-item-title">
                                                                <h3>
                                                                    {
                                                                        item.nome
                                                                    }
                                                                </h3>

                                                                <strong>
                                                                    {money(
                                                                        item.preco,
                                                                    )}
                                                                </strong>
                                                            </div>

                                                            {item.descricao ? (
                                                                <p>
                                                                    {
                                                                        item.descricao
                                                                    }
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    </article>
                                                ),
                                            )}
                                    </div>
                                </section>
                            ),
                        )
                ) : (
                    <section className="bp-cardapio-empty">
                        <Utensils
                            size={
                                30
                            }
                        />

                        <strong>
                            Cardápio em preparação
                        </strong>

                        <span>
                            Os itens aparecerão aqui assim que forem publicados.
                        </span>
                    </section>
                )}
            </div>


            <footer className="bp-cardapio-footer">
                <div className="bp-cardapio-container">
                    <strong>
                        {
                            parceiro.nome
                        }
                    </strong>

                    <span>
                        Cardápio digital
                    </span>
                </div>
            </footer>
        </main>
    );
}
