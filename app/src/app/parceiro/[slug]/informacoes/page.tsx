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

import ParceiroInformacoesClient from "./ParceiroInformacoesClient";


type PageProps = {
    params: Promise<{
        slug: string;
    }>;
};


export default async function ParceiroInformacoesPage({
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
            `/parceiro/${slug}/informacoes`,
            slug,
        );

    return (
        <EntityThemeScope
            tema={
                parceiro
                    .par_parceiro_tema
            }
        >
            <AppShell>
                <ParceiroContextNav
                    slug={
                        parceiro.slug
                    }
                />

                <ParceiroInformacoesClient
                    parceiro={{
                        id:
                        parceiro.id,

                        codigo:
                        parceiro.codigo,

                        slug:
                        parceiro.slug,

                        nome:
                        parceiro.nome,

                        descricao:
                        parceiro.descricao,
                    }}
                />
            </AppShell>
        </EntityThemeScope>
    );
}