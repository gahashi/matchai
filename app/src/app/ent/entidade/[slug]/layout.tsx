import { ReactNode } from "react";

import {
    AppShell,
} from "@/components/layout/AppShell";
import {
    EntidadeContextHeader,
} from "@/components/layout/EntidadeContextHeader";
import {
    EntidadeContextNav,
} from "@/components/layout/EntidadeContextNav";
import {
    Alert,
} from "@/components/ui/Alert";
import {
    requireEntidadeContexto,
} from "@/lib/ent/require-entidade-contexto";

type EntidadeLayoutProps = {
    children: ReactNode;

    params: Promise<{
        slug: string;
    }>;
};

export default async function EntidadeLayout({
                                                 children,
                                                 params,
                                             }: EntidadeLayoutProps) {
    const { slug } = await params;

    const { entidade } =
        await requireEntidadeContexto({
            slug,
        });

    const entidadeDisponivel =
        entidade.ativo &&
        entidade.status.codigo ===
        "ativa";

    return (
        <AppShell>
            <EntidadeContextHeader
                entidade={entidade}
            />

            <EntidadeContextNav
                slug={entidade.slug}
            />

            {!entidadeDisponivel ? (
                <Alert
                    color="warning"
                    variant="soft"
                    title="Entidade com acesso limitado"
                >
                    A entidade está com status
                    “{entidade.status.nome}”.
                    Algumas ações administrativas
                    poderão permanecer indisponíveis
                    até que a situação seja
                    regularizada.
                </Alert>
            ) : null}

            <div
                className={
                    !entidadeDisponivel
                        ? "bp-mt-5"
                        : undefined
                }
            >
                {children}
            </div>
        </AppShell>
    );
}