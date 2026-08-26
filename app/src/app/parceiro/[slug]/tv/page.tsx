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
    TvProgramacaoManager,
} from "@/components/tv/TvProgramacaoManager";

import {
    requireParceiroPageAccess,
} from "@/lib/par/require-parceiro-access";

import {
    canManageParceiroByTipo,
} from "@/lib/par/parceiro-operacao-permissions";

import {
    tvProgramacaoService,
} from "@/lib/tv/tv-programacao-service";


type PageProps = {
    params: Promise<{
        slug: string;
    }>;
};


export default async function ParceiroTvPage({
    params,
}: PageProps) {
    const {
        slug,
    } =
        await params;

    const {
        parceiro,
        vinculo,
    } =
        await requireParceiroPageAccess(
            `/parceiro/${slug}/tv`,
            slug,
        );

    const data =
        await tvProgramacaoService
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

                <TvProgramacaoManager
                    mode="parceiro"
                    apiBase={
                        `/api/parceiro/${parceiro.id}/tv`
                    }
                    parceiro={{
                        id:
                            parceiro.id,

                        slug:
                            parceiro.slug,

                        nome:
                            parceiro.nome,
                    }}
                    canManage={
                        canManageParceiroByTipo(
                            vinculo
                                .tipo
                                .codigo,
                        )
                    }
                    roleLabel={
                        vinculo
                            .tipo
                            .nome
                    }
                    initialData={
                        data
                    }
                />
            </AppShell>
        </EntityThemeScope>
    );
}
