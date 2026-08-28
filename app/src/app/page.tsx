import type { Metadata } from "next";
import Link from "next/link";
import {
    Building2,
    CalendarDays,
    MapPin,
    
    ShoppingBag,
    Sparkles,
    UsersRound,
} from "lucide-react";

import {
    ProductCard,
} from "@/components/public/ProductCard";
import {
    PublicEventsSection,
} from "@/components/public/PublicEventsSection";
import {
    PublicPlansSection,
} from "@/components/public/PublicPlansSection";
import {
    PublicStoreShell,
} from "@/components/public/PublicStoreShell";
import {
    publicSiteConfig,
} from "@/config/public-site";
import {
    getAuthSession,
} from "@/lib/auth/session";
import {
    eventoPublicService,
} from "@/lib/cad/evento-public-service";
import {
    produtoPublicService,
} from "@/lib/prd/produto-public-service";
import {
    planoPublicService,
} from "@/lib/soc/plano-public-service";
import {
    socioPublicService,
} from "@/lib/soc/socio-public-service";

import {
    cardapioPublicService,
} from "@/lib/crd/cardapio-public-service";

export const metadata: Metadata = {
    title: "AAACCU | Computaria",
    description:
        "Eventos, produtos, associação e informações da AAACCU — Computaria UNIVALI.",
};

export default async function HomePage() {
    const session =
        await getAuthSession();

    const socio = session
        ? await socioPublicService.getSocioAtual(
            session.user.id,
        )
        : {
            isSocio: false as const,
            socio: null,
        };

    const [
        eventos,
        produtos,
        planos,
        parceiros,
    ] = await Promise.all([
        eventoPublicService.listHomeEvents(),

        produtoPublicService.listHomeProducts({
            isSocio: socio.isSocio,
        }),

        planoPublicService.listHomePlans(),

        cardapioPublicService.listPublicPartners(),
    ]);

    return (
        <PublicStoreShell
            user={
                session
                    ? {
                        nome:
                        session.user.nome,
                        avatar_url:
                            session.user.avatar_url ??
                            null,
                        isAdmin:
                            session.user
                                .sys_usuario_tipo
                                .codigo === "admin",
                    }
                    : null
            }
        >
            <section className="bp-public-hero">
                <div className="bp-public-container bp-public-hero-grid">
                    <div className="bp-public-hero-copy">
                        <span className="bp-public-kicker">
                            Atlética dos cursos de computação · UNIVALI
                        </span>

                        <h1>
                            Computaria é comunidade dentro e fora da sala.
                        </h1>

                        <p>
                            Eventos, produtos, esporte e vida universitária em um só lugar. Acompanhe a AAACCU e faça parte da comunidade.
                        </p>

                        <div className="bp-public-hero-actions">
                            {eventos.length > 0 ? (
                                <>
                                    <Link
                                        href="/#eventos"
                                        className="bp-public-primary-link"
                                    >
                                        <CalendarDays size={17} />
                                        Ver eventos
                                    </Link>

                                    <Link
                                        href="/#produtos"
                                        className="bp-public-secondary-link"
                                    >
                                        <ShoppingBag size={17} />
                                        Ver produtos
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/#produtos"
                                        className="bp-public-primary-link"
                                    >
                                        <ShoppingBag size={17} />
                                        Ver produtos
                                    </Link>

                                    <Link
                                        href="/#quem-somos"
                                        className="bp-public-secondary-link"
                                    >
                                        Conhecer a AAACCU
                                    </Link>
                                </>
                            )}
                        </div>

                        {session ? (
                            <div className="bp-public-session-note">
                                {socio.isSocio ? (
                                    <>
                                        <Sparkles size={16} />
                                        Você é sócio ativo. Valores de sócio já aparecem aplicados.
                                    </>
                                ) : (
                                    <>
                                        <UsersRound size={16} />
                                        Você está conectado. Preços de sócio são aplicados somente para associações ativas.
                                    </>
                                )}
                            </div>
                        ) : null}
                    </div>

                    <div className="bp-public-hero-logo-card">
                        <div className="bp-public-hero-logo-glow" />

                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={
                                publicSiteConfig.logoPath
                            }
                            alt="Logo AAACCU"
                        />

                        <div>
                            <strong>
                                {publicSiteConfig.name}
                            </strong>

                            <span>
                                {publicSiteConfig.displayName} ·{" "}
                                {publicSiteConfig.institution}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <PublicEventsSection
                eventos={eventos}
            />

            {parceiros.length > 0 ? (
                <section
                    id="parceiros"
                    className="bp-public-section"
                >
                    <div className="bp-public-container">
                        <div className="bp-public-section-head">
                            <div>
                    <span className="bp-public-kicker">
                        Parceiros
                    </span>

                                <h2>
                                    Conheça nossos parceiros
                                </h2>

                                <p>
                                    Acesse informações, cardápios,
                                    promoções e eventos dos nossos
                                    estabelecimentos parceiros.
                                </p>
                            </div>
                        </div>

                        <div className="bp-public-product-grid">
                            {parceiros.map(
                                (parceiro) => (
                                    <Link
                                        key={
                                            parceiro.id
                                        }
                                        href={
                                            `/cardapio/${parceiro.slug}`
                                        }
                                        className="bp-admin-option-link"
                                    >
                                        <article className="bp-public-products-empty">
                                            <div
                                                style={{
                                                    width: 72,
                                                    height: 72,
                                                    borderRadius: 18,
                                                    overflow:
                                                        "hidden",
                                                    display:
                                                        "grid",
                                                    placeItems:
                                                        "center",
                                                    border:
                                                        "1px solid var(--color-border)",
                                                }}
                                            >
                                                {parceiro.logo_url ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={
                                                            parceiro.logo_url
                                                        }
                                                        alt={
                                                            parceiro.nome
                                                        }
                                                        style={{
                                                            width:
                                                                "100%",
                                                            height:
                                                                "100%",
                                                            objectFit:
                                                                "contain",
                                                        }}
                                                    />
                                                ) : (
                                                    <Building2
                                                        size={
                                                            28
                                                        }
                                                    />
                                                )}
                                            </div>

                                            <strong>
                                                {
                                                    parceiro.nome
                                                }
                                            </strong>

                                            {parceiro
                                                .descricao ? (
                                                <span>
                                        {
                                            parceiro.descricao
                                        }
                                    </span>
                                            ) : null}

                                            <span>
                                    Ver estabelecimento
                                </span>
                                        </article>
                                    </Link>
                                ),
                            )}
                        </div>
                    </div>
                </section>
            ) : null}

            <section
                id="quem-somos"
                className="bp-public-section"
            >
                <div className="bp-public-container">
                    <div className="bp-public-section-head">
                        <div>
                            <span className="bp-public-kicker">
                                Sobre a atlética
                            </span>

                            <h2>
                                Quem somos
                            </h2>
                        </div>
                    </div>

                    <div className="bp-public-about-grid">
                        <article className="bp-public-about-copy">
                            <p>
                                {publicSiteConfig.about}
                            </p>
                        </article>

                        <div className="bp-public-info-grid">
                            <article>
                                <div>
                                    <CalendarDays size={19} />
                                </div>

                                <span>
                                    Fundação
                                </span>

                                <strong>
                                    {publicSiteConfig.foundationYear ??
                                        "A definir"}
                                </strong>
                            </article>

                            <article>
                                <div>
                                    <Building2 size={19} />
                                </div>

                                <span>
                                    Universidade
                                </span>

                                <strong>
                                    {publicSiteConfig.institution}
                                </strong>
                            </article>

                            <article>
                                <div>
                                    <MapPin size={19} />
                                </div>

                                <span>
                                    Nossa sede
                                </span>

                                <strong>
                                    {publicSiteConfig.headquarters ??
                                        "A definir"}
                                </strong>
                            </article>
                        </div>
                    </div>
                </div>
            </section>

            <section
                id="produtos"
                className="bp-public-section bp-public-products-section"
            >
                <div className="bp-public-container">
                    <div className="bp-public-section-head">
                        <div>
                            <span className="bp-public-kicker">
                                Loja
                            </span>

                            <h2>
                                Nossos produtos
                            </h2>

                            <p>
                                Produtos públicos e disponíveis agora. O preço de sócio é aplicado automaticamente para usuários autenticados com associação ativa.
                            </p>
                        </div>
                    </div>

                    {produtos.length > 0 ? (
                        <div className="bp-public-product-grid">
                            {produtos.map((produto) => (
                                <ProductCard
                                    key={produto.id}
                                    produto={produto}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bp-public-products-empty">
                            <ShoppingBag size={25} />

                            <strong>
                                Nenhum produto disponível no momento.
                            </strong>

                            <span>
                                Novos produtos aparecerão aqui quando forem publicados.
                            </span>
                        </div>
                    )}
                </div>
            </section>

            <PublicPlansSection
                planos={planos}
                membership={{
                    isAuthenticated:
                        Boolean(session),
                    isSocio:
                    socio.isSocio,
                    planoId:
                        socio.socio?.plano.id ??
                        null,
                    planoNome:
                        socio.socio?.plano.nome ??
                        null,
                    fimAt:
                        socio.socio?.fim_at
                            ? socio.socio.fim_at.toISOString()
                            : null,
                }}
            />
        </PublicStoreShell>
    );
}
