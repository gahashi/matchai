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
    cardapioService,
} from "@/lib/crd/cardapio-service";

import {
    requireParceiroPageAccess,
} from "@/lib/par/require-parceiro-access";

import {
    ParceiroPromocoesSection,
} from "@/app/parceiro/[slug]/cardapio/ParceiroPromocoesSection";


type PageProps = {
    params: Promise<{
        slug: string;
    }>;
};


export default async function ParceiroPromocoesPage({
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
            `/parceiro/${slug}/promocoes`,
            slug,
        );


    const data =
        await cardapioService
            .listParceiroData(
                parceiro.id,
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

                <ParceiroPromocoesSection
                    parceiroId={
                        parceiro.id
                    }
                    itens={
                        data.itens
                    }
                    initialPromocoes={
                        data.promocoes
                    }
                    standalone
                />
            </AppShell>
        </EntityThemeScope>
    );
}
