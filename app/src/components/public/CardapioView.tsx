"use client";

import {
    type CSSProperties,
    useMemo,
    useState,
} from "react";

import {
    Building2,
    CalendarDays,
    ImageIcon,
    Search,
    Sparkles,
    Utensils,
    X,
    Clock3,
    ExternalLink,
    Globe2,
    Camera,
    Mail,
    MapPin,
    MessageCircle,
    Phone,
} from "lucide-react";
import {
    PublicEventsSection,
} from "@/components/public/PublicEventsSection";

import type {
    PublicEvento,
} from "@/lib/cad/evento-public-types";


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

export type CardapioViewInformacoes = {
    email_contato: string | null;

    telefone: string | null;
    whatsapp: string | null;

    endereco: string | null;
    google_maps_url: string | null;

    instagram_url: string | null;
    site_url: string | null;

    horario_funcionamento: string | null;
};


export type CardapioViewPromocao = {
    id: number;

    titulo: string;
    descricao: string | null;

    preco_promocional: number | null;

    validade_inicio: string | null;
    validade_fim: string | null;

    imagem_url: string | null;

    itens: Array<{
        id: number;
        nome: string;
    }>;

    item_ids: number[];

    horarios: Array<{
        id: number;
        dia_semana: number;
        hora_inicio: string;
        hora_fim: string;
    }>;
};


export type CardapioViewParceiro = {
    nome: string;
    descricao: string | null;
    informacoes?: CardapioViewInformacoes;

    tema: {
        cor_primaria: string | null;
        cor_secundaria: string | null;
        cor_fundo: string | null;
        cor_texto: string | null;

        logo_url: string | null;
        banner_url: string | null;
    };

    promocoes?: CardapioViewPromocao[];

    categorias: CardapioViewCategoria[];
};


type Props = {
    parceiro:
        CardapioViewParceiro;

    eventos?:
        PublicEvento[];

    preview?:
        boolean;
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


function normalizeSearch(
    value: string,
) {
    return value
        .normalize(
            "NFD",
        )
        .replace(
            /[\u0300-\u036f]/g,
            "",
        )
        .toLocaleLowerCase(
            "pt-BR",
        )
        .trim();
}

function onlyDigits(
    value:
        string |
        null,
) {
    return (
        value ??
        ""
    ).replace(
        /\D/g,
        "",
    );
}


function whatsappHref(
    value:
        string |
        null,
) {
    const digits =
        onlyDigits(
            value,
        );

    if (
        !digits
    ) {
        return null;
    }

    /*
     * O formulário atual é brasileiro.
     * Quando vier apenas DDD + número,
     * acrescentamos o código do Brasil.
     */
    const number =
        digits.length === 10 ||
        digits.length === 11
            ? `55${digits}`
            : digits;

    return `https://wa.me/${number}`;
}


function phoneHref(
    value:
        string |
        null,
) {
    const digits =
        onlyDigits(
            value,
        );

    return digits
        ? `tel:${digits}`
        : null;
}


function formatDate(
    value: string | null,
) {
    if (
        !value
    ) {
        return null;
    }

    const [
        year,
        month,
        day,
    ] =
        value.split(
            "-",
        );

    if (
        !year ||
        !month ||
        !day
    ) {
        return value;
    }

    return `${day}/${month}/${year}`;
}

export function CardapioView({
                                 parceiro,

                                 eventos = [],

                                 preview = false,
                             }: Props) {
    const [
        search,
        setSearch,
    ] =
        useState(
            "",
        );


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


    const promocoes =
        parceiro
            .promocoes ??
        [];

    const informacoes =
        parceiro
            .informacoes;


    const possuiInformacoes =
        Boolean(
            informacoes &&
            (
                informacoes.email_contato ||
                informacoes.telefone ||
                informacoes.whatsapp ||
                informacoes.endereco ||
                informacoes.google_maps_url ||
                informacoes.instagram_url ||
                informacoes.site_url ||
                informacoes.horario_funcionamento
            ),
        );


    const telefoneHref =
        phoneHref(
            informacoes
                ?.telefone ??
            null,
        );


    const whatsHref =
        whatsappHref(
            informacoes
                ?.whatsapp ??
            null,
        );

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


    const categoriasFiltradas =
        useMemo(
            () => {
                const termo =
                    normalizeSearch(
                        search,
                    );

                if (
                    !termo
                ) {
                    return parceiro
                        .categorias;
                }

                return parceiro
                    .categorias
                    .map(
                        (
                            categoria,
                        ) => {
                            const itens =
                                categoria
                                    .itens
                                    .filter(
                                        (
                                            item,
                                        ) => {
                                            const searchable =
                                                normalizeSearch(
                                                    [
                                                        item.nome,

                                                        item.descricao ??
                                                        "",

                                                        categoria.nome,
                                                    ].join(
                                                        " ",
                                                    ),
                                                );

                                            return searchable
                                                .includes(
                                                    termo,
                                                );
                                        },
                                    );

                            return {
                                ...categoria,
                                itens,
                            };
                        },
                    )
                    .filter(
                        (
                            categoria,
                        ) =>
                            categoria
                                .itens
                                .length >
                            0,
                    );
            },
            [
                parceiro
                    .categorias,
                search,
            ],
        );


    const promocoesPorItem =
        useMemo(
            () => {
                const map =
                    new Map<
                        number,
                        CardapioViewPromocao[]
                    >();

                for (
                    const promocao
                    of parceiro.promocoes ??
                []
                    ) {
                    for (
                        const itemId
                        of promocao.item_ids
                        ) {
                        const atuais =
                            map.get(
                                itemId,
                            ) ??
                            [];

                        map.set(
                            itemId,
                            [
                                ...atuais,
                                promocao,
                            ],
                        );
                    }
                }

                return map;
            },
            [
                parceiro
                    .promocoes,
            ],
        );


    function scrollToCategory(
        categoriaId: number,
    ) {
        const element =
            document
                .getElementById(
                    `categoria-${categoriaId}`,
                );

        if (
            !element
        ) {
            return;
        }

        element
            .scrollIntoView({
                behavior:
                    "smooth",

                block:
                    "start",
            });
    }
    function scrollToSection(
        sectionId: string,
    ) {
        const element =
            document
                .getElementById(
                    sectionId,
                );

        if (
            !element
        ) {
            return;
        }

        element
            .scrollIntoView({
                behavior:
                    "smooth",

                block:
                    "start",
            });
    }

    const possuiCategorias =
        parceiro
            .categorias
            .length >
        0;

    const possuiResultados =
        categoriasFiltradas
            .length >
        0;


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
            <section
                id="inicio"
                className="bp-cardapio-hero"
            >
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

            <nav
                className="bp-cardapio-main-nav"
                aria-label="Navegação do parceiro"
            >
                <div className="bp-cardapio-container bp-cardapio-main-nav-inner">
                    <button
                        type="button"
                        onClick={
                            () =>
                                scrollToSection(
                                    "inicio",
                                )
                        }
                    >
                        Início
                    </button>


                    {promocoes.length > 0 ? (
                        <button
                            type="button"
                            onClick={
                                () =>
                                    scrollToSection(
                                        "promocoes",
                                    )
                            }
                        >
                            Promoções
                        </button>
                    ) : null}


                    <button
                        type="button"
                        onClick={
                            () =>
                                scrollToSection(
                                    "cardapio",
                                )
                        }
                    >
                        Cardápio
                    </button>

                    {eventos.length > 0 ? (
                        <button
                            type="button"
                            onClick={
                                () =>
                                    scrollToSection(
                                        "eventos",
                                    )
                            }
                        >
                            Eventos
                        </button>
                    ) : null}

                    {possuiInformacoes ? (
                        <button
                            type="button"
                            onClick={
                                () =>
                                    scrollToSection(
                                        "informacoes",
                                    )
                            }
                        >
                            Informações
                        </button>
                    ) : null}
                </div>
            </nav>
            {promocoes.length > 0 ? (
                <section
                    id="promocoes"
                    className="bp-cardapio-promotions"
                >
                    <div className="bp-cardapio-container">
                        <header className="bp-cardapio-promotions-head">
                            <div>
                                <span className="bp-cardapio-kicker">
                                    <Sparkles
                                        size={
                                            14
                                        }
                                    />

                                    Promoções
                                </span>

                                <h2>
                                    Destaques de agora
                                </h2>

                                <p>
                                    Aproveite enquanto estiver disponível.
                                </p>
                            </div>
                        </header>


                        <div className="bp-cardapio-promotion-grid">
                            {promocoes.map(
                                (
                                    promocao,
                                ) => {
                                    const validadeFim =
                                        formatDate(
                                            promocao
                                                .validade_fim,
                                        );

                                    return (
                                        <article
                                            key={
                                                promocao.id
                                            }
                                            id={
                                                `promocao-${promocao.id}`
                                            }
                                            className="bp-cardapio-promotion"
                                        >
                                            <div className="bp-cardapio-promotion-image">
                                                {promocao.imagem_url ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={
                                                            promocao.imagem_url
                                                        }
                                                        alt={
                                                            promocao.titulo
                                                        }
                                                    />
                                                ) : (
                                                    <Sparkles
                                                        size={
                                                            32
                                                        }
                                                    />
                                                )}
                                            </div>


                                            <div className="bp-cardapio-promotion-body">
                                                <div className="bp-cardapio-promotion-meta">
                                                    <span className="is-active">
                                                        <Sparkles
                                                            size={
                                                                13
                                                            }
                                                        />

                                                        Ativa agora
                                                    </span>

                                                    {validadeFim ? (
                                                        <span>
                                                            <CalendarDays
                                                                size={
                                                                    13
                                                                }
                                                            />

                                                            Até{" "}
                                                            {
                                                                validadeFim
                                                            }
                                                        </span>
                                                    ) : null}
                                                </div>


                                                <h3>
                                                    {
                                                        promocao.titulo
                                                    }
                                                </h3>

                                                {promocao.descricao ? (
                                                    <p>
                                                        {
                                                            promocao.descricao
                                                        }
                                                    </p>
                                                ) : null}


                                                {promocao
                                                    .preco_promocional !==
                                                null ? (
                                                    <div className="bp-cardapio-promotion-price">
                                                        <span>
                                                            Preço promocional
                                                        </span>

                                                        <strong>
                                                            {money(
                                                                promocao
                                                                    .preco_promocional,
                                                            )}
                                                        </strong>
                                                    </div>
                                                ) : null}


                                                <div className="bp-cardapio-promotion-items">
                                                    {promocao.itens.map(
                                                        (
                                                            item,
                                                        ) => (
                                                            <span
                                                                key={
                                                                    item.id
                                                                }
                                                            >
                                                                {
                                                                    item.nome
                                                                }
                                                            </span>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        </article>
                                    );
                                },
                            )}
                        </div>
                    </div>
                </section>
            ) : null}

            <div
                id="cardapio"
                className="bp-cardapio-section-anchor"
                aria-hidden="true"
            />
            {possuiCategorias ? (
                <section className="bp-cardapio-tools">
                    <div className="bp-cardapio-container bp-cardapio-tools-inner">
                        <div className="bp-cardapio-search">
                            <Search
                                size={
                                    18
                                }
                                aria-hidden="true"
                            />

                            <input
                                type="search"
                                value={
                                    search
                                }
                                onChange={
                                    (
                                        event,
                                    ) =>
                                        setSearch(
                                            event
                                                .target
                                                .value,
                                        )
                                }
                                placeholder="Buscar no cardápio..."
                                aria-label="Buscar no cardápio"
                            />

                            {search ? (
                                <button
                                    type="button"
                                    onClick={
                                        () =>
                                            setSearch(
                                                "",
                                            )
                                    }
                                    aria-label="Limpar pesquisa"
                                >
                                    <X
                                        size={
                                            17
                                        }
                                    />
                                </button>
                            ) : null}
                        </div>


                        {possuiResultados ? (
                            <nav
                                className="bp-cardapio-category-nav"
                                aria-label="Categorias do cardápio"
                            >
                                {categoriasFiltradas.map(
                                    (
                                        categoria,
                                    ) => (
                                        <button
                                            key={
                                                categoria.id
                                            }
                                            type="button"
                                            onClick={
                                                () =>
                                                    scrollToCategory(
                                                        categoria.id,
                                                    )
                                            }
                                        >
                                            {
                                                categoria.nome
                                            }
                                        </button>
                                    ),
                                )}
                            </nav>
                        ) : null}
                    </div>
                </section>
            ) : null}


            <div className="bp-cardapio-container bp-cardapio-content">
                {possuiResultados ? (
                    categoriasFiltradas
                        .map(
                            (
                                categoria,
                            ) => (
                                <section
                                    key={
                                        categoria.id
                                    }
                                    id={
                                        `categoria-${categoria.id}`
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
                                                ) => {
                                                    const itemPromocoes =
                                                        promocoesPorItem
                                                            .get(
                                                                item.id,
                                                            ) ??
                                                        [];

                                                    return (
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


                                                                {itemPromocoes.length >
                                                                0 ? (
                                                                    <div className="bp-cardapio-item-promotions">
                                                                        {itemPromocoes.map(
                                                                            (
                                                                                promocao,
                                                                            ) => (
                                                                                <a
                                                                                    key={
                                                                                        promocao.id
                                                                                    }
                                                                                    href={
                                                                                        `#promocao-${promocao.id}`
                                                                                    }
                                                                                >
                                                                                    <Sparkles
                                                                                        size={
                                                                                            13
                                                                                        }
                                                                                    />

                                                                                    <span>
                                                                                        {
                                                                                            promocao.titulo
                                                                                        }
                                                                                    </span>

                                                                                    {promocao
                                                                                        .preco_promocional !==
                                                                                    null ? (
                                                                                        <strong>
                                                                                            {money(
                                                                                                promocao
                                                                                                    .preco_promocional,
                                                                                            )}
                                                                                        </strong>
                                                                                    ) : null}
                                                                                </a>
                                                                            ),
                                                                        )}
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        </article>
                                                    );
                                                },
                                            )}
                                    </div>
                                </section>
                            ),
                        )
                ) : possuiCategorias ? (
                    <section className="bp-cardapio-empty">
                        <Search
                            size={
                                30
                            }
                        />

                        <strong>
                            Nenhum item encontrado
                        </strong>

                        <span>
                            Tente pesquisar por outro produto ou categoria.
                        </span>
                    </section>
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

            {eventos.length > 0 ? (
                <PublicEventsSection
                    eventos={
                        eventos
                    }
                    title="Próximos eventos"
                    description={
                        `Acompanhe os eventos de ${parceiro.nome}.`
                    }
                    ariaLabel={
                        `Eventos de ${parceiro.nome}`
                    }
                    containerClassName="bp-cardapio-container"
                    className="bp-cardapio-events"
                />
            ) : null}

            {possuiInformacoes &&
            informacoes ? (
                <section
                    id="informacoes"
                    className="bp-cardapio-info"
                >
                    <div className="bp-cardapio-container">
                        <header className="bp-cardapio-info-head">
                <span className="bp-cardapio-kicker">
                    <MapPin
                        size={
                            14
                        }
                    />

                    Informações
                </span>

                            <h2>
                                Saiba mais sobre{" "}
                                {
                                    parceiro.nome
                                }
                            </h2>
                        </header>


                        <div className="bp-cardapio-info-grid">
                            {(
                                informacoes.telefone ||
                                informacoes.whatsapp ||
                                informacoes.email_contato
                            ) ? (
                                <article className="bp-cardapio-info-card">
                                    <h3>
                                        Contato
                                    </h3>

                                    <div className="bp-cardapio-info-links">
                                        {informacoes.whatsapp &&
                                        whatsHref ? (
                                            <a
                                                href={
                                                    whatsHref
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <MessageCircle
                                                    size={
                                                        18
                                                    }
                                                />

                                                <span>
                                        <small>
                                            WhatsApp
                                        </small>

                                        <strong>
                                            {
                                                informacoes.whatsapp
                                            }
                                        </strong>
                                    </span>

                                                <ExternalLink
                                                    size={
                                                        14
                                                    }
                                                />
                                            </a>
                                        ) : null}


                                        {informacoes.telefone &&
                                        telefoneHref ? (
                                            <a
                                                href={
                                                    telefoneHref
                                                }
                                            >
                                                <Phone
                                                    size={
                                                        18
                                                    }
                                                />

                                                <span>
                                        <small>
                                            Telefone
                                        </small>

                                        <strong>
                                            {
                                                informacoes.telefone
                                            }
                                        </strong>
                                    </span>
                                            </a>
                                        ) : null}


                                        {informacoes.email_contato ? (
                                            <a
                                                href={
                                                    `mailto:${informacoes.email_contato}`
                                                }
                                            >
                                                <Mail
                                                    size={
                                                        18
                                                    }
                                                />

                                                <span>
                                        <small>
                                            E-mail
                                        </small>

                                        <strong>
                                            {
                                                informacoes.email_contato
                                            }
                                        </strong>
                                    </span>
                                            </a>
                                        ) : null}
                                    </div>
                                </article>
                            ) : null}


                            {(
                                informacoes.endereco ||
                                informacoes.google_maps_url
                            ) ? (
                                <article className="bp-cardapio-info-card">
                                    <h3>
                                        Localização
                                    </h3>

                                    {informacoes.endereco ? (
                                        <div className="bp-cardapio-info-text">
                                            <MapPin
                                                size={
                                                    18
                                                }
                                            />

                                            <span>
                                    {
                                        informacoes.endereco
                                    }
                                </span>
                                        </div>
                                    ) : null}


                                    {informacoes.google_maps_url ? (
                                        <a
                                            className="bp-cardapio-info-action"
                                            href={
                                                informacoes.google_maps_url
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Abrir no Google Maps

                                            <ExternalLink
                                                size={
                                                    14
                                                }
                                            />
                                        </a>
                                    ) : null}
                                </article>
                            ) : null}


                            {(
                                informacoes.instagram_url ||
                                informacoes.site_url
                            ) ? (
                                <article className="bp-cardapio-info-card">
                                    <h3>
                                        Redes e site
                                    </h3>

                                    <div className="bp-cardapio-info-links">
                                        {informacoes.instagram_url ? (
                                            <a
                                                href={
                                                    informacoes.instagram_url
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <Camera
                                                    size={
                                                        18
                                                    }
                                                />

                                                <span>
                                        <small>
                                            Rede social
                                        </small>

                                        <strong>
                                            Instagram
                                        </strong>
                                    </span>

                                                <ExternalLink
                                                    size={
                                                        14
                                                    }
                                                />
                                            </a>
                                        ) : null}


                                        {informacoes.site_url ? (
                                            <a
                                                href={
                                                    informacoes.site_url
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <Globe2
                                                    size={
                                                        18
                                                    }
                                                />

                                                <span>
                                        <small>
                                            Online
                                        </small>

                                        <strong>
                                            Site
                                        </strong>
                                    </span>

                                                <ExternalLink
                                                    size={
                                                        14
                                                    }
                                                />
                                            </a>
                                        ) : null}
                                    </div>
                                </article>
                            ) : null}


                            {informacoes.horario_funcionamento ? (
                                <article className="bp-cardapio-info-card">
                                    <h3>
                                        Funcionamento
                                    </h3>

                                    <div className="bp-cardapio-info-text">
                                        <Clock3
                                            size={
                                                18
                                            }
                                        />

                                        <span className="bp-cardapio-info-hours">
                                {
                                    informacoes.horario_funcionamento
                                }
                            </span>
                                    </div>
                                </article>
                            ) : null}
                        </div>
                    </div>
                </section>
            ) : null}

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