import { prisma } from "@/lib/prisma";
import {
    JsonLike,
    SolicitacaoHistoricoAcao,
} from "@/lib/sys/solicitacao/solicitacao-types";

type RegistrarHistoricoInput = {
    sysSolicitacaoId: number;
    sysUsuarioId?: number | null;
    statusAnteriorId?: number | null;
    statusNovoId?: number | null;
    acao: SolicitacaoHistoricoAcao;
    descricao?: string | null;
    metadata?: JsonLike;
};

function serializarJson(value?: JsonLike) {
    if (value === undefined || value === null) {
        return null;
    }

    return JSON.stringify(value);
}

export const solicitacaoHistoryService = {
    async registrar({
                        sysSolicitacaoId,
                        sysUsuarioId = null,
                        statusAnteriorId = null,
                        statusNovoId = null,
                        acao,
                        descricao = null,
                        metadata = null,
                    }: RegistrarHistoricoInput) {
        return prisma.sysSolicitacaoHistorico.create({
            data: {
                sys_solicitacao_id: sysSolicitacaoId,
                sys_usuario_id: sysUsuarioId,
                sys_solicitacao_status_anterior_id: statusAnteriorId,
                sys_solicitacao_status_novo_id: statusNovoId,
                acao,
                descricao,
                metadata_text: serializarJson(metadata),
                created_at: new Date(),
            },
        });
    },
};