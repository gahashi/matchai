import {
    redirect,
} from "next/navigation";

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

import {
    parceiroMembroService,
    podeGerenciarMembros,
} from "@/lib/par/parceiro-membro-service";

import ParceiroMembrosClient from "./ParceiroMembrosClient";


type PageProps = {
    params: Promise<{
        slug: string;
    }>;
};


export default async function ParceiroMembrosPage({
    params,
}: PageProps) {
    const {
        slug,
    } =
        await params;

    const {
        session,
        vinculo,
        parceiro,
    } =
        await requireParceiroPageAccess(
            `/parceiro/${slug}/membros`,
            slug,
        );

    if (
        !podeGerenciarMembros(
            vinculo.tipo.codigo,
        )
    ) {
        redirect(
            "/sem-permissao",
        );
    }

    const data =
        await parceiroMembroService
            .listParceiroMembrosData(
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

                <ParceiroMembrosClient
                    parceiro={{
                        id:
                            parceiro.id,

                        nome:
                            parceiro.nome,
                    }}
                    currentUserId={
                        session.user.id
                    }
                    actorTipoCodigo={
                        vinculo
                            .tipo
                            .codigo
                    }
                    initialData={
                        data
                    }
                />
            </AppShell>
        </EntityThemeScope>
    );
}
