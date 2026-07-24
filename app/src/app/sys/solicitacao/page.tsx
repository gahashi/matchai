import { redirect } from "next/navigation";
import { requireAuthPageAccess } from "@/lib/auth/require-access";
import {
    userHasGlobalPermission,
} from "@/lib/auth/permissions";
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
import {AppShell} from "@/components/layout/AppShell";

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

export default async function SolicitacaoPage({
                                                  searchParams,
                                              }: SolicitacaoPageProps) {

    const { session } = await requireAuthPageAccess("/sys/solicitacao");
    const params = await searchParams;

    const scope = (params.scope as SolicitacaoListScope | undefined) ?? "minhas";
    const statusCodigo = params.status as SolicitacaoStatusCodigo | undefined;
    const tipoCodigo = params.tipo as SolicitacaoTipoCodigo | undefined;
    const sort = (params.sort as SolicitacaoListSort | undefined) ?? "recent";
    const page = toNumber(params.page) ?? 1;

    const [canAnalyze, canViewAll] = await Promise.all([
        userHasGlobalPermission(
            session,
            "solicitacao.analisar"
        ),
        userHasGlobalPermission(
            session,
            "solicitacao.visualizar_todas"
        ),
    ]);

    let result;

    try {
        result = await solicitacaoService.listar({
            sysUsuarioId: session.user.id,
            scope,
            statusCodigo,
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
            filters={{
                scope,
                statusCodigo,
                tipoCodigo,
                sort,
            }}
            allowedScopes={{
                analise: canAnalyze,
                todas: canViewAll,
            }}
        />
        </AppShell>
    );
}