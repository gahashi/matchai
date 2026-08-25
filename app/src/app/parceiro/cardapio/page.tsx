import {
    AppShell,
} from "@/components/layout/AppShell";

import {
    cardapioService,
} from "@/lib/crd/cardapio-service";

import {
    requireParceiroPageAccess,
} from "@/lib/par/require-parceiro-access";

import ParceiroCardapioClient from "./ParceiroCardapioClient";


export default async function ParceiroCardapioPage() {
    const {
        parceiro,
    } =
        await requireParceiroPageAccess(
            "/parceiro/cardapio",
        );

    const data =
        await cardapioService
            .listParceiroData(
                parceiro.id,
            );

    return (
        <AppShell>
            <ParceiroCardapioClient
                parceiro={{
                    id:
                    parceiro.id,

                    nome:
                    parceiro.nome,
                }}
                initialData={
                    data
                }
            />
        </AppShell>
    );
}