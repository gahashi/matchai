import {
    Building2,
    CalendarClock,
    Megaphone,
    Palette,
    Store,
    UsersRound,
} from "lucide-react";

import {
    AppShell,
} from "@/components/layout/AppShell";

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
    PageHeader,
} from "@/components/ui/PageHeader";

import {
    requireParceiroPageAccess,
} from "@/lib/par/require-parceiro-access";


export default async function ParceiroPage() {
    const {
        parceiro,
    } =
        await requireParceiroPageAccess(
            "/parceiro",
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

    const modulos = [
        {
            title:
                "Cardápio",

            description:
                "Cadastre categorias, produtos e preços exibidos aos clientes.",

            icon:
            Store,
            href:"/parceiro/cardapio"
        },

        {
            title:"Promoções",
            description:"Defina ofertas com dias e horários específicos de exibição.",
            icon:
            CalendarClock,
            href:null
        },

        {
            title:"Divulgações",
            description:"Gerencie conteúdos do parceiro que poderão aparecer nas TVs.",
            icon:Megaphone,
            href:null
        },
    ];

    return (
        <AppShell>
            <PageHeader
                title={
                    parceiro.nome
                }
                subtitle="Ambiente administrativo do parceiro."
            />

            <section
                style={{
                    overflow:
                        "hidden",

                    position:
                        "relative",

                    minHeight:
                        230,

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
                                    0.25,
                            }}
                        />

                        <div
                            style={{
                                position:
                                    "absolute",

                                inset:
                                    0,

                                background:
                                    `linear-gradient(90deg, ${corFundo} 20%, transparent 100%)`,
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
                            230,

                        display:
                            "flex",

                        alignItems:
                            "center",

                        gap:
                            20,

                        padding:
                            28,

                        flexWrap:
                            "wrap",
                    }}
                >
                    <div
                        style={{
                            width:
                                92,

                            height:
                                92,

                            borderRadius:
                                22,

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
                                size={
                                    38
                                }
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

                        <h2
                            style={{
                                margin:
                                    0,

                                fontSize:
                                    28,
                            }}
                        >
                            {
                                parceiro.nome
                            }
                        </h2>

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

                                alignItems:
                                    "center",

                                gap:
                                    7,

                                fontSize:
                                    13,

                                color:
                                corSecundaria,
                            }}
                        >
                            <Palette
                                size={
                                    15
                                }
                            />

                            Tema personalizado ativo
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
                        Gestão do estabelecimento
                    </h2>

                    <p className="bp-section-subtitle">
                        Os módulos abaixo serão disponibilizados para este parceiro.
                    </p>
                </div>

                <div className="bp-admin-option-grid">
                    {modulos.map(
                        (
                            modulo,
                        ) => {
                            const Icon =
                                modulo.icon;

                            const card = (
                                <Card
                                    variant="outline"
                                    className="bp-admin-option-card"
                                >
                                    <CardBody>
                                        <div className="bp-admin-option-content">
                                            <div className="bp-admin-option-icon">
                                                <Icon
                                                    size={
                                                        21
                                                    }
                                                />
                                            </div>

                                            <div>
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
                                                            modulo.title
                                                        }
                                                    </h2>

                                                    {!modulo.href ? (
                                                        <Badge color="secondary">
                                                            Em breve
                                                        </Badge>
                                                    ) : null}
                                                </div>

                                                <p className="bp-section-subtitle bp-admin-option-description">
                                                    {
                                                        modulo.description
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            );

                            return modulo.href ? (
                                <AppLink
                                    key={
                                        modulo.title
                                    }
                                    href={
                                        modulo.href
                                    }
                                    className="bp-admin-option-link"
                                >
                                    {card}
                                </AppLink>
                            ) : (
                                <div
                                    key={
                                        modulo.title
                                    }
                                >
                                    {card}
                                </div>
                            );
                        },
                    )}
                </div>
            </section>


            <section
                style={{
                    marginTop:
                        24,
                    marginBottom:
                        24,
                }}
            >
                <Card>
                    <CardBody>
                        <div
                            style={{
                                display:
                                    "flex",

                                gap:
                                    12,

                                alignItems:
                                    "center",
                            }}
                        >
                            <div className="bp-admin-option-icon">
                                <UsersRound
                                    size={
                                        20
                                    }
                                />
                            </div>

                            <div>
                                <h2 className="bp-section-title">
                                    Acesso do parceiro
                                </h2>

                                <p className="bp-section-subtitle">
                                    Você está acessando somente os recursos vinculados a {parceiro.nome}.
                                </p>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </section>
        </AppShell>
    );
}