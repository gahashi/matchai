import {
    Building2,
    CalendarClock,
    Info,
    Megaphone,
    Palette,
    Store,
    UsersRound,
} from "lucide-react";

import {
    AppShell,
} from "@/components/layout/AppShell";

import {
    ParceiroContextNav,
} from "@/components/layout/ParceiroContextNav";

import {
    AppLink,
} from "@/components/ui/AppLink";

import {
    Badge,
} from "@/components/ui/Badge";

import {
    Card,
    CardBody,
} from "@/components/ui/Card";

import {
    EntityThemeScope,
} from "@/components/theme/EntityThemeScope";

import {
    requireParceiroPageAccess,
} from "@/lib/par/require-parceiro-access";


type PageProps = {
    params: Promise<{
        slug: string;
    }>;
};


type ParceiroOption = {
    title: string;
    description: string;
    icon: typeof Store;
    href: string | null;
    status: string | null;
};


export default async function ParceiroPage({
                                               params,
                                           }: PageProps) {
    const {
        slug,
    } =
        await params;

    const {
        parceiro,
    } =
        await requireParceiroPageAccess(
            `/parceiro/${slug}`,
            slug,
        );

    const tema =
        parceiro
            .par_parceiro_tema;

    const corPrimaria =
        tema?.cor_primaria ??
        "#9CD91A";

    const corSecundaria =
        tema?.cor_secundaria ??
        "#F5F2E8";

    const corFundo =
        tema?.cor_fundo ??
        "#141414";

    const corTexto =
        tema?.cor_texto ??
        "#FFFFFF";

    const logoUrl =
        tema
            ?.logo_sys_arquivo
            ?.public_url ??
        null;

    const bannerUrl =
        tema
            ?.banner_sys_arquivo
            ?.public_url ??
        null;


    const configuracoes: ParceiroOption[] = [
        {
            title:
                "Informações",

            description:
                "Edite nome, descrição e endereço público do estabelecimento.",

            icon:
            Info,

            href:
                `/parceiro/${parceiro.slug}/informacoes`,

            status:
                null,
        },

        {
            title:
                "Aparência",

            description:
                "Personalize cores, logo e banner exibidos no ambiente e no cardápio.",

            icon:
            Palette,

            href:
                `/parceiro/${parceiro.slug}/aparencia`,

            status:
                null,
        },

        {
            title:
                "Membros",

            description:
                "Gerencie as pessoas que possuem acesso a este parceiro.",

            icon:
            UsersRound,

            href:
                `/parceiro/${parceiro.slug}/membros`,

            status:
                null,
        },
    ];


    const operacao: ParceiroOption[] = [
        {
            title:
                "Cardápio",

            description:
                "Gerencie categorias, itens, preços e o conteúdo exibido aos clientes.",

            icon:
            Store,

            href:
                `/parceiro/${parceiro.slug}/cardapio`,

            status:
                null,
        },

        {
            title:
                "Promoções",

            description:
                "Defina ofertas com dias e horários específicos de exibição.",

            icon:
            CalendarClock,

            href:
                null,

            status:
                "Em breve",
        },

        {
            title:
                "Divulgações",

            description:
                "Gerencie conteúdos do parceiro que poderão aparecer nas TVs.",

            icon:
            Megaphone,

            href:
                null,

            status:
                "Em breve",
        },
    ];


    function renderOption(
        option: ParceiroOption,
    ) {
        const Icon =
            option.icon;

        const content = (
            <Card
                variant="outline"
                className="bp-admin-option-card"
            >
                <CardBody>
                    <div className="bp-admin-option-content">
                        <div className="bp-admin-option-icon">
                            <Icon
                                size={21}
                            />
                        </div>

                        <div
                            style={{
                                minWidth:
                                    0,
                            }}
                        >
                            <div
                                style={{
                                    display:
                                        "flex",

                                    alignItems:
                                        "center",

                                    gap:
                                        8,

                                    flexWrap:
                                        "wrap",
                                }}
                            >
                                <h2 className="bp-section-title bp-admin-option-title">
                                    {
                                        option.title
                                    }
                                </h2>

                                {option.status ? (
                                    <Badge color="secondary">
                                        {
                                            option.status
                                        }
                                    </Badge>
                                ) : null}
                            </div>

                            <p className="bp-section-subtitle bp-admin-option-description">
                                {
                                    option.description
                                }
                            </p>
                        </div>
                    </div>
                </CardBody>
            </Card>
        );

        if (!option.href) {
            return (
                <div
                    key={
                        option.title
                    }
                >
                    {content}
                </div>
            );
        }

        return (
            <AppLink
                key={
                    option.title
                }
                href={
                    option.href
                }
                className="bp-admin-option-link"
            >
                {content}
            </AppLink>
        );
    }


    return (
        <EntityThemeScope
            tema={
                tema
            }
        >
            <AppShell>
                <ParceiroContextNav
                    slug={
                        parceiro.slug
                    }
                />

                <section
                    style={{
                        overflow:
                            "hidden",

                        position:
                            "relative",

                        minHeight:
                            250,

                        borderRadius:
                            20,

                        border:
                            "1px solid var(--color-border)",

                        background:
                        corFundo,

                        color:
                        corTexto,
                    }}
                >
                    {bannerUrl ? (
                        <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={
                                    bannerUrl
                                }
                                alt=""
                                style={{
                                    position:
                                        "absolute",

                                    inset:
                                        0,

                                    width:
                                        "100%",

                                    height:
                                        "100%",

                                    objectFit:
                                        "cover",

                                    opacity:
                                        0.28,
                                }}
                            />

                            <div
                                style={{
                                    position:
                                        "absolute",

                                    inset:
                                        0,

                                    background:
                                        `linear-gradient(90deg, ${corFundo} 18%, ${corFundo}E6 48%, transparent 100%)`,
                                }}
                            />
                        </>
                    ) : null}

                    <div
                        style={{
                            position:
                                "relative",

                            zIndex:
                                1,

                            minHeight:
                                250,

                            display:
                                "flex",

                            alignItems:
                                "center",

                            gap:
                                22,

                            padding:
                                28,

                            flexWrap:
                                "wrap",
                        }}
                    >
                        <div
                            style={{
                                width:
                                    104,

                                height:
                                    104,

                                borderRadius:
                                    24,

                                flexShrink:
                                    0,

                                display:
                                    "grid",

                                placeItems:
                                    "center",

                                overflow:
                                    "hidden",

                                background:
                                corPrimaria,

                                color:
                                corFundo,

                                border:
                                    `2px solid ${corSecundaria}`,
                            }}
                        >
                            {logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={
                                        logoUrl
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
                                    size={42}
                                />
                            )}
                        </div>

                        <div
                            style={{
                                minWidth:
                                    0,

                                flex:
                                    1,
                            }}
                        >
                            <div
                                style={{
                                    display:
                                        "flex",

                                    gap:
                                        8,

                                    alignItems:
                                        "center",

                                    flexWrap:
                                        "wrap",

                                    marginBottom:
                                        8,
                                }}
                            >
                                <Badge color="success">
                                    Parceiro ativo
                                </Badge>

                                <span
                                    style={{
                                        fontSize:
                                            12,

                                        color:
                                        corSecundaria,
                                    }}
                                >
                                    {
                                        parceiro.codigo
                                    }
                                </span>
                            </div>

                            <h1
                                style={{
                                    margin:
                                        0,

                                    fontSize:
                                        30,

                                    lineHeight:
                                        1.15,
                                }}
                            >
                                {
                                    parceiro.nome
                                }
                            </h1>

                            {parceiro.descricao ? (
                                <p
                                    style={{
                                        margin:
                                            "10px 0 0",

                                        maxWidth:
                                            700,

                                        lineHeight:
                                            1.6,

                                        color:
                                        corSecundaria,
                                    }}
                                >
                                    {
                                        parceiro.descricao
                                    }
                                </p>
                            ) : null}

                            <div
                                style={{
                                    marginTop:
                                        16,

                                    display:
                                        "flex",

                                    gap:
                                        8,

                                    alignItems:
                                        "center",

                                    flexWrap:
                                        "wrap",
                                }}
                            >
                                <span
                                    style={{
                                        fontSize:
                                            13,

                                        color:
                                        corSecundaria,
                                    }}
                                >
                                    Cardápio público:
                                </span>

                                <AppLink
                                    href={
                                        `/cardapio/${parceiro.slug}`
                                    }
                                    color="secondary"
                                    variant="ghost"
                                >
                                    /cardapio/{parceiro.slug}
                                </AppLink>
                            </div>
                        </div>
                    </div>
                </section>


                <section
                    style={{
                        marginTop:
                            28,
                    }}
                >
                    <div
                        style={{
                            marginBottom:
                                16,
                        }}
                    >
                        <h2 className="bp-section-title">
                            Configuração do estabelecimento
                        </h2>

                        <p className="bp-section-subtitle">
                            Dados, identidade visual e pessoas que administram este parceiro.
                        </p>
                    </div>

                    <div className="bp-admin-option-grid">
                        {configuracoes.map(
                            renderOption,
                        )}
                    </div>
                </section>


                <section
                    style={{
                        marginTop:
                            28,

                        marginBottom:
                            24,
                    }}
                >
                    <div
                        style={{
                            marginBottom:
                                16,
                        }}
                    >
                        <h2 className="bp-section-title">
                            Operação
                        </h2>

                        <p className="bp-section-subtitle">
                            Recursos usados no dia a dia do estabelecimento.
                        </p>
                    </div>

                    <div className="bp-admin-option-grid">
                        {operacao.map(
                            renderOption,
                        )}
                    </div>
                </section>
            </AppShell>
        </EntityThemeScope>
    );
}
