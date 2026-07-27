//solicitacao/page.tsx
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import {
    userHasGlobalPermission,
} from "@/lib/auth/permissions";
import { requireAuthPageAccess } from "@/lib/auth/require-access";
import {
    SolicitacaoForbiddenError,
    solicitacaoService,
} from "@/lib/sys/solicitacao/solicitacao-service";
import {
    SolicitacaoListScope,
    SolicitacaoListSort,
    SolicitacaoStatusCodigo,
    SolicitacaoTipoCodigo,
} from "@/lib/sys/solicitacao/solicitacao-types";
import { SolicitacaoClient } from "./SolicitacaoClient";

type SolicitacaoPageProps = {
    searchParams: Promise<{
        scope?: string;
        status?: string;
        tipo?: string;
        page?: string;
        sort?: string;
    }>;
};

function toNumber(value?: string) {
    if (!value) return undefined;

    const numberValue = Number(value);

    if (!Number.isInteger(numberValue)) {
        return undefined;
    }

    return numberValue;
}

const solicitacaoStatusCodigos: SolicitacaoStatusCodigo[] = [
    "rascunho",
    "enviada",
    "em_analise",
    "ajuste_solicitado",
    "aprovada",
    "recusada",
    "cancelada",
    "concluida",
];

function resolveStatusCodigos(
    value?: string
): SolicitacaoStatusCodigo[] {
    if (!value) {
        return [];
    }

    const codigos = value
        .split(",")
        .map((codigo) => codigo.trim())
        .filter(Boolean);

    return codigos.filter(
        (
            codigo
        ): codigo is SolicitacaoStatusCodigo =>
            solicitacaoStatusCodigos.includes(
                codigo as SolicitacaoStatusCodigo
            )
    );
}

export default async function SolicitacaoPage({
                                                  searchParams,
                                              }: SolicitacaoPageProps) {
    const { session } =
        await requireAuthPageAccess("/sys/solicitacao");

    const params = await searchParams;

    const scope =
        (params.scope as SolicitacaoListScope | undefined) ??
        "minhas";

    const statusCodigos =
        resolveStatusCodigos(params.status);

    const tipoCodigo =
        params.tipo as SolicitacaoTipoCodigo | undefined;

    const sort =
        (params.sort as SolicitacaoListSort | undefined) ??
        "recent";

    const page = toNumber(params.page) ?? 1;

    const [
        canAnalyze,
        canViewAll,
        canApprove,
        canReject,
    ] = await Promise.all([
        userHasGlobalPermission(
            session,
            "solicitacao.analisar"
        ),
        userHasGlobalPermission(
            session,
            "solicitacao.visualizar_todas"
        ),
        userHasGlobalPermission(
            session,
            "solicitacao.aprovar"
        ),
        userHasGlobalPermission(
            session,
            "solicitacao.recusar"
        ),
    ]);

    let result;

    try {
        result = await solicitacaoService.listar({
            sysUsuarioId: session.user.id,
            scope,
            statusCodigos,
            tipoCodigo,
            sort,
            page,
            pageSize: 12,
        });
    } catch (error) {
        if (error instanceof SolicitacaoForbiddenError) {
            redirect("/sem-permissao");
        }

        throw error;
    }

    return (
        <AppShell>
            <SolicitacaoClient
                initialItems={result.items}
                pagination={result.pagination}
                currentUserId={session.user.id}
                filters={{
                    scope,
                    statusCodigos,
                    tipoCodigo,
                    sort,
                }}
                allowedScopes={{
                    analise: canAnalyze,
                    todas: canViewAll,
                }}
                allowedActions={{
                    aprovar: canApprove,
                    recusar: canReject,
                }}
            />
        </AppShell>
    );
}