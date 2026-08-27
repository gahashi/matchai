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

                        email_contato:
                        parceiro.email_contato,

                        telefone:
                        parceiro.telefone,

                        whatsapp:
                        parceiro.whatsapp,

                        endereco:
                        parceiro.endereco,

                        google_maps_url:
                        parceiro.google_maps_url,

                        instagram_url:
                        parceiro.instagram_url,

                        site_url:
                        parceiro.site_url,

                        horario_funcionamento:
                        parceiro
                            .horario_funcionamento,
                    }}
                />
            </AppShell>
        </EntityThemeScope>
    );
}