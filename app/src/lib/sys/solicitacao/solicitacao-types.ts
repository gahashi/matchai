export type SolicitacaoTipoCodigo =
    | "criar_atletica"
    | "agendar_assembleia"
    | "validar_posse"
    | "alterar_diretoria"
    | "alterar_regimento"
    | "solicitar_acesso"
    | "solicitar_reuniao";

export type SolicitacaoStatusCodigo =
    | "rascunho"
    | "enviada"
    | "em_analise"
    | "ajuste_solicitado"
    | "aprovada"
    | "recusada"
    | "cancelada"
    | "concluida";

export type SolicitacaoHistoricoAcao =
    | "criada"
    | "enviada"
    | "em_analise"
    | "ajuste_solicitado"
    | "aprovada"
    | "recusada"
    | "cancelada"
    | "concluida"
    | "documento_anexado"
    | "documento_removido"
    | "acao_aplicada";

export type SolicitacaoListScope = "minhas" | "analise" | "todas";

export type SolicitacaoListSort = "recent" | "oldest";

export type JsonLike = Record<string, unknown> | unknown[] | null;

export type CriarRascunhoSolicitacaoInput = {
    tipoCodigo: SolicitacaoTipoCodigo;
    solicitadoPorUsuarioId: number;
    titulo: string;
    descricao?: string | null;
    entidadeTipo?: string | null;
    entidadeId?: number | null;
    payload?: JsonLike;
    metadata?: JsonLike;
};

export type ListarSolicitacoesInput = {
    sysUsuarioId: number;
    scope?: SolicitacaoListScope;
    statusCodigo?: SolicitacaoStatusCodigo;
    tipoCodigo?: SolicitacaoTipoCodigo;
    page?: number;
    pageSize?: number;
    sort?: SolicitacaoListSort;
};

export type EnviarSolicitacaoInput = {
    solicitacaoId: number;
    sysUsuarioId: number;
    descricaoHistorico?: string | null;
};

export type ColocarEmAnaliseInput = {
    solicitacaoId: number;
    sysUsuarioId: number;
    responsavelSysUsuarioId?: number | null;
    descricaoHistorico?: string | null;
};

export type SolicitarAjusteInput = {
    solicitacaoId: number;
    sysUsuarioId: number;
    descricao: string;
    metadata?: JsonLike;
};

export type RecusarSolicitacaoInput = {
    solicitacaoId: number;
    sysUsuarioId: number;
    descricao: string;
    metadata?: JsonLike;
};

export type AprovarSolicitacaoInput = {
    solicitacaoId: number;
    sysUsuarioId: number;
    descricao?: string | null;
    metadata?: JsonLike;
};

export type CancelarSolicitacaoInput = {
    solicitacaoId: number;
    sysUsuarioId: number;
    descricao?: string | null;
};

export type ConcluirSolicitacaoInput = {
    solicitacaoId: number;
    sysUsuarioId: number;
    descricao?: string | null;
    metadata?: JsonLike;
};