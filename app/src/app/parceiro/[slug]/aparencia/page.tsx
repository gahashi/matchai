import {
    AppShell,
} from "@/components/layout/AppShell";

import {
    ParceiroContextNav,
} from "@/components/layout/ParceiroContextNav";

import {
    EntityThemeScope,
} from "@/components/theme/EntityThemeScope";

import {
    requireParceiroPageAccess,
} from "@/lib/par/require-parceiro-access";

import ParceiroAparenciaClient from "./ParceiroAparenciaClient";


type PageProps = {
    params: Promise<{
        slug: string;
    }>;
};


export default async function ParceiroAparenciaPage({
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
            `/parceiro/${slug}/aparencia`,
            slug,
        );

    const tema =
        parceiro
            .par_parceiro_tema;


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

                <ParceiroAparenciaClient
                    parceiro={{
                        id:
                        parceiro.id,

                        nome:
                        parceiro.nome,

                        tema: {
                            cor_primaria:
                                tema
                                    ?.cor_primaria ??
                                "#9CD91A",

                            cor_secundaria:
                                tema
                                    ?.cor_secundaria ??
                                "#F5F2E8",

                            cor_fundo:
                                tema
                                    ?.cor_fundo ??
                                "#141414",

                            cor_texto:
                                tema
                                    ?.cor_texto ??
                                "#FFFFFF",

                            logo:
                                tema
                                    ?.logo_sys_arquivo
                                    ? {
                                        public_url:
                                        tema
                                            .logo_sys_arquivo
                                            .public_url,

                                        original_name:
                                        tema
                                            .logo_sys_arquivo
                                            .original_name,
                                    }
                                    : null,

                            banner:
                                tema
                                    ?.banner_sys_arquivo
                                    ? {
                                        public_url:
                                        tema
                                            .banner_sys_arquivo
                                            .public_url,

                                        original_name:
                                        tema
                                            .banner_sys_arquivo
                                            .original_name,
                                    }
                                    : null,
                        },
                    }}
                />
            </AppShell>
        </EntityThemeScope>
    );
}