import { requireAuthPageAccess } from "@/lib/auth/require-access";
import { solicitacaoService } from "@/lib/sys/solicitacao/solicitacao-service";
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

    const result = await solicitacaoService.listar({
        sysUsuarioId: session.user.id,
        scope,
        statusCodigo,
        tipoCodigo,
        sort,
        page,
        pageSize: 12,
    });

    return (
        <SolicitacaoClient
            initialItems={result.items}
            pagination={result.pagination}
            filters={{
                scope,
                statusCodigo,
                tipoCodigo,
                sort,
            }}
        />
    );
}