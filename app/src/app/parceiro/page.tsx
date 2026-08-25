import {
    Building2,
    ChevronRight,
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
    requireParceiroListPageAccess,
} from "@/lib/par/require-parceiro-access";


export default async function ParceiroPage() {
    const {
        parceiros,
    } =
        await requireParceiroListPageAccess(
            "/parceiro",
        );

    return (
        <AppShell>
            <PageHeader
                title="Parceiros"
                subtitle="Escolha qual estabelecimento você deseja administrar."
            />

            <section
                style={{
                    marginTop:
                        24,
                }}
            >
                <div className="bp-admin-option-grid">
                    {parceiros.map(
                        (
                            parceiro,
                        ) => {
                            const tema =
                                parceiro
                                    .par_parceiro_tema;

                            const logoUrl =
                                tema
                                    ?.logo_sys_arquivo
                                    ?.public_url ??
                                null;

                            const corPrimaria =
                                tema
                                    ?.cor_primaria ??
                                "#9CD91A";

                            return (
                                <AppLink
                                    key={
                                        parceiro.id
                                    }
                                    href={
                                        `/parceiro/${parceiro.slug}`
                                    }
                                    className="bp-admin-option-link"
                                >
                                    <Card
                                        variant="outline"
                                        className="bp-admin-option-card"
                                    >
                                        <CardBody>
                                            <div
                                                style={{
                                                    display:
                                                        "flex",

                                                    alignItems:
                                                        "center",

                                                    gap:
                                                        16,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width:
                                                            58,

                                                        height:
                                                            58,

                                                        flex:
                                                            "0 0 58px",

                                                        display:
                                                            "grid",

                                                        placeItems:
                                                            "center",

                                                        overflow:
                                                            "hidden",

                                                        borderRadius:
                                                            16,

                                                        border:
                                                            "1px solid var(--color-border)",

                                                        background:
                                                            `${corPrimaria}18`,

                                                        color:
                                                        corPrimaria,
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
                                                                25
                                                            }
                                                        />
                                                    )}
                                                </div>

                                                <div
                                                    style={{
                                                        flex:
                                                            1,

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
                                                                parceiro.nome
                                                            }
                                                        </h2>

                                                        <Badge color="success">
                                                            Ativo
                                                        </Badge>
                                                    </div>

                                                    <p className="bp-section-subtitle bp-admin-option-description">
                                                        {parceiro.descricao ??
                                                            "Gerencie o cardápio e demais recursos deste estabelecimento."}
                                                    </p>

                                                    <div
                                                        style={{
                                                            marginTop:
                                                                10,

                                                            color:
                                                                "var(--color-text-soft)",

                                                            fontSize:
                                                                12,
                                                        }}
                                                    >
                                                        {
                                                            parceiro.codigo
                                                        }
                                                    </div>
                                                </div>

                                                <ChevronRight
                                                    size={
                                                        20
                                                    }
                                                />
                                            </div>
                                        </CardBody>
                                    </Card>
                                </AppLink>
                            );
                        },
                    )}
                </div>
            </section>
        </AppShell>
    );
}