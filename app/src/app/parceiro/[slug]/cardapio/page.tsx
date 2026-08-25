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

import ParceiroCardapioClient from "./ParceiroCardapioClient";


type PageProps = {
    params: Promise<{
        slug: string;
    }>;
};


export default async function ParceiroCardapioPage({
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
            `/parceiro/${slug}/cardapio`,
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

                <ParceiroCardapioClient
                    parceiro={{
                        id:
                        parceiro.id,

                        slug:
                        parceiro.slug,

                        nome:
                        parceiro.nome,

                        descricao:
                        parceiro.descricao,

                        tema: {
                            cor_primaria:
                                parceiro
                                    .par_parceiro_tema
                                    ?.cor_primaria ??
                                null,

                            cor_secundaria:
                                parceiro
                                    .par_parceiro_tema
                                    ?.cor_secundaria ??
                                null,

                            cor_fundo:
                                parceiro
                                    .par_parceiro_tema
                                    ?.cor_fundo ??
                                null,

                            cor_texto:
                                parceiro
                                    .par_parceiro_tema
                                    ?.cor_texto ??
                                null,

                            logo_url:
                                parceiro
                                    .par_parceiro_tema
                                    ?.logo_sys_arquivo
                                    ?.public_url ??
                                null,

                            banner_url:
                                parceiro
                                    .par_parceiro_tema
                                    ?.banner_sys_arquivo
                                    ?.public_url ??
                                null,
                        },
                    }}
                    initialData={
                        data
                    }
                />
            </AppShell>
        </EntityThemeScope>
    );
}