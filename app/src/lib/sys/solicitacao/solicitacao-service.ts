import { prisma } from "@/lib/prisma";
import { solicitacaoHistoryService } from "@/lib/sys/solicitacao/solicitacao-history-service";
import {
    AprovarSolicitacaoInput,
    CancelarSolicitacaoInput,
    ColocarEmAnaliseInput,
    ConcluirSolicitacaoInput,
    CriarRascunhoSolicitacaoInput,
    EnviarSolicitacaoInput,
    JsonLike,
    ListarSolicitacoesInput,
    RecusarSolicitacaoInput,
    SolicitarAjusteInput,
    SolicitacaoStatusCodigo,
    SolicitacaoTipoCodigo,
} from "@/lib/sys/solicitacao/solicitacao-types";

function normalizarPage(page?: number) {
    if (!page || page < 1) return 1;
    return Math.floor(page);
}

function normalizarPageSize(pageSize?: number) {
    if (!pageSize) return 20;
    if (pageSize < 5) return 5;
    if (pageSize > 50) return 50;
    return Math.floor(pageSize);
}

function serializarJson(value?: JsonLike) {
    if (value === undefined || value === null) {
        return null;
    }

    return JSON.stringify(value);
}

function parseJsonSafe(value?: string | null) {
    if (!value) {
        return null;
    }

    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

async function getTipoId(codigo: SolicitacaoTipoCodigo) {
    const tipo = await prisma.sysSolicitacaoTipo.findUnique({
        where: { codigo },
        select: { id: true },
    });

    if (!tipo) {
        throw new Error(`Tipo de solicitação não encontrado: ${codigo}`);
    }

    return tipo.id;
}

async function getStatus(codigo: SolicitacaoStatusCodigo) {
    const status = await prisma.sysSolicitacaoStatus.findUnique({
        where: { codigo },
        select: {
            id: true,
            codigo: true,
        },
    });

    if (!status) {
        throw new Error(`Status de solicitação não encontrado: ${codigo}`);
    }

    return status;
}

async function getStatusId(codigo: SolicitacaoStatusCodigo) {
    const status = await getStatus(codigo);

    return status.id;
}

function mapSolicitacao(item: any) {
    return {
        ...item,
        payload: parseJsonSafe(item.payload_text),
        metadata: parseJsonSafe(item.metadata_text),
    };
}

async function getSolicitacaoBase(solicitacaoId: number) {
    return prisma.sysSolicitacao.findFirst({
        where: {
            id: solicitacaoId,
            ativo: 1,
            deleted_at: null,
        },
        select: {
            id: true,
            sys_solicitacao_status_id: true,
            solicitado_por_usuario_id: true,
            responsavel_sys_usuario_id: true,
            sys_solicitacao_tipo: {
                select: {
                    codigo: true,
                },
            },
            sys_solicitacao_status: {
                select: {
                    codigo: true,
                },
            },
        },
    });
}

function assertStatusAtualPermitido(
    statusAtual: string,
    statusPermitidos: string[],
    acao: string
) {
    if (!statusPermitidos.includes(statusAtual)) {
        throw new Error(
            `Não é possível executar a ação "${acao}" em uma solicitação com status "${statusAtual}".`
        );
    }
}

export const solicitacaoService = {
    async criarRascunho({
                            tipoCodigo,
                            solicitadoPorUsuarioId,
                            titulo,
                            descricao = null,
                            entidadeTipo = null,
                            entidadeId = null,
                            payload = null,
                            metadata = null,
                        }: CriarRascunhoSolicitacaoInput) {
        const [tipoId, statusRascunho] = await Promise.all([
            getTipoId(tipoCodigo),
            getStatus("rascunho"),
        ]);

        const now = new Date();

        const solicitacao = await prisma.sysSolicitacao.create({
            data: {
                sys_solicitacao_tipo_id: tipoId,
                sys_solicitacao_status_id: statusRascunho.id,
                solicitado_por_usuario_id: solicitadoPorUsuarioId,
                responsavel_sys_usuario_id: null,
                titulo,
                descricao,
                entidade_tipo: entidadeTipo,
                entidade_id: entidadeId,
                payload_text: serializarJson(payload),
                metadata_text: serializarJson(metadata),
                enviado_at: null,
                finalizado_at: null,
                ativo: 1,
                created_at: now,
                updated_at: now,
            },
        });

        await solicitacaoHistoryService.registrar({
            sysSolicitacaoId: solicitacao.id,
            sysUsuarioId: solicitadoPorUsuarioId,
            statusAnteriorId: null,
            statusNovoId: statusRascunho.id,
            acao: "criada",
            descricao: "Solicitação criada como rascunho.",
        });

        return solicitacao;
    },

    async enviar({
                     solicitacaoId,
                     sysUsuarioId,
                     descricaoHistorico = null,
                 }: EnviarSolicitacaoInput) {
        const solicitacao = await getSolicitacaoBase(solicitacaoId);

        if (!solicitacao) {
            throw new Error("Solicitação não encontrada.");
        }

        if (solicitacao.solicitado_por_usuario_id !== sysUsuarioId) {
            throw new Error("Somente o solicitante pode enviar esta solicitação.");
        }

        assertStatusAtualPermitido(
            solicitacao.sys_solicitacao_status.codigo,
            ["rascunho", "ajuste_solicitado"],
            "enviar"
        );

        const statusEnviadaId = await getStatusId("enviada");
        const now = new Date();

        const solicitacaoAtualizada = await prisma.sysSolicitacao.update({
            where: { id: solicitacao.id },
            data: {
                sys_solicitacao_status_id: statusEnviadaId,
                enviado_at: now,
                updated_at: now,
            },
        });

        await solicitacaoHistoryService.registrar({
            sysSolicitacaoId: solicitacao.id,
            sysUsuarioId,
            statusAnteriorId: solicitacao.sys_solicitacao_status_id,
            statusNovoId: statusEnviadaId,
            acao: "enviada",
            descricao:
                descricaoHistorico ??
                "Solicitação enviada para análise.",
        });

        return solicitacaoAtualizada;
    },

    async colocarEmAnalise({
                               solicitacaoId,
                               sysUsuarioId,
                               responsavelSysUsuarioId = null,
                               descricaoHistorico = null,
                           }: ColocarEmAnaliseInput) {
        const solicitacao = await getSolicitacaoBase(solicitacaoId);

        if (!solicitacao) {
            throw new Error("Solicitação não encontrada.");
        }

        assertStatusAtualPermitido(
            solicitacao.sys_solicitacao_status.codigo,
            ["enviada"],
            "colocar em análise"
        );

        const statusEmAnaliseId = await getStatusId("em_analise");
        const now = new Date();

        const solicitacaoAtualizada = await prisma.sysSolicitacao.update({
            where: { id: solicitacao.id },
            data: {
                sys_solicitacao_status_id: statusEmAnaliseId,
                responsavel_sys_usuario_id: responsavelSysUsuarioId ?? sysUsuarioId,
                updated_at: now,
            },
        });

        await solicitacaoHistoryService.registrar({
            sysSolicitacaoId: solicitacao.id,
            sysUsuarioId,
            statusAnteriorId: solicitacao.sys_solicitacao_status_id,
            statusNovoId: statusEmAnaliseId,
            acao: "em_analise",
            descricao:
                descricaoHistorico ??
                "Solicitação colocada em análise.",
        });

        return solicitacaoAtualizada;
    },

    async solicitarAjuste({
                              solicitacaoId,
                              sysUsuarioId,
                              descricao,
                              metadata = null,
                          }: SolicitarAjusteInput) {
        const solicitacao = await getSolicitacaoBase(solicitacaoId);

        if (!solicitacao) {
            throw new Error("Solicitação não encontrada.");
        }

        assertStatusAtualPermitido(
            solicitacao.sys_solicitacao_status.codigo,
            ["enviada", "em_analise"],
            "solicitar ajuste"
        );

        const statusAjusteId = await getStatusId("ajuste_solicitado");
        const now = new Date();

        const solicitacaoAtualizada = await prisma.sysSolicitacao.update({
            where: { id: solicitacao.id },
            data: {
                sys_solicitacao_status_id: statusAjusteId,
                responsavel_sys_usuario_id:
                    solicitacao.responsavel_sys_usuario_id ?? sysUsuarioId,
                updated_at: now,
            },
        });

        await solicitacaoHistoryService.registrar({
            sysSolicitacaoId: solicitacao.id,
            sysUsuarioId,
            statusAnteriorId: solicitacao.sys_solicitacao_status_id,
            statusNovoId: statusAjusteId,
            acao: "ajuste_solicitado",
            descricao,
            metadata,
        });

        return solicitacaoAtualizada;
    },

    async recusar({
                      solicitacaoId,
                      sysUsuarioId,
                      descricao,
                      metadata = null,
                  }: RecusarSolicitacaoInput) {
        const solicitacao = await getSolicitacaoBase(solicitacaoId);

        if (!solicitacao) {
            throw new Error("Solicitação não encontrada.");
        }

        assertStatusAtualPermitido(
            solicitacao.sys_solicitacao_status.codigo,
            ["enviada", "em_analise", "ajuste_solicitado"],
            "recusar"
        );

        const statusRecusadaId = await getStatusId("recusada");
        const now = new Date();

        const solicitacaoAtualizada = await prisma.sysSolicitacao.update({
            where: { id: solicitacao.id },
            data: {
                sys_solicitacao_status_id: statusRecusadaId,
                responsavel_sys_usuario_id:
                    solicitacao.responsavel_sys_usuario_id ?? sysUsuarioId,
                finalizado_at: now,
                updated_at: now,
            },
        });

        await solicitacaoHistoryService.registrar({
            sysSolicitacaoId: solicitacao.id,
            sysUsuarioId,
            statusAnteriorId: solicitacao.sys_solicitacao_status_id,
            statusNovoId: statusRecusadaId,
            acao: "recusada",
            descricao,
            metadata,
        });

        return solicitacaoAtualizada;
    },

    async aprovar({
                      solicitacaoId,
                      sysUsuarioId,
                      descricao = null,
                      metadata = null,
                  }: AprovarSolicitacaoInput) {
        const solicitacao = await getSolicitacaoBase(solicitacaoId);

        if (!solicitacao) {
            throw new Error("Solicitação não encontrada.");
        }

        assertStatusAtualPermitido(
            solicitacao.sys_solicitacao_status.codigo,
            ["enviada", "em_analise"],
            "aprovar"
        );

        const statusAprovadaId = await getStatusId("aprovada");
        const now = new Date();

        const solicitacaoAtualizada = await prisma.sysSolicitacao.update({
            where: { id: solicitacao.id },
            data: {
                sys_solicitacao_status_id: statusAprovadaId,
                responsavel_sys_usuario_id:
                    solicitacao.responsavel_sys_usuario_id ?? sysUsuarioId,
                updated_at: now,
            },
        });

        await solicitacaoHistoryService.registrar({
            sysSolicitacaoId: solicitacao.id,
            sysUsuarioId,
            statusAnteriorId: solicitacao.sys_solicitacao_status_id,
            statusNovoId: statusAprovadaId,
            acao: "aprovada",
            descricao:
                descricao ??
                "Solicitação aprovada. A ação específica ainda será aplicada pelo service do tipo.",
            metadata,
        });

        return solicitacaoAtualizada;
    },

    async concluir({
                       solicitacaoId,
                       sysUsuarioId,
                       descricao = null,
                       metadata = null,
                   }: ConcluirSolicitacaoInput) {
        const solicitacao = await getSolicitacaoBase(solicitacaoId);

        if (!solicitacao) {
            throw new Error("Solicitação não encontrada.");
        }

        assertStatusAtualPermitido(
            solicitacao.sys_solicitacao_status.codigo,
            ["aprovada"],
            "concluir"
        );

        const statusConcluidaId = await getStatusId("concluida");
        const now = new Date();

        const solicitacaoAtualizada = await prisma.sysSolicitacao.update({
            where: { id: solicitacao.id },
            data: {
                sys_solicitacao_status_id: statusConcluidaId,
                finalizado_at: now,
                updated_at: now,
            },
        });

        await solicitacaoHistoryService.registrar({
            sysSolicitacaoId: solicitacao.id,
            sysUsuarioId,
            statusAnteriorId: solicitacao.sys_solicitacao_status_id,
            statusNovoId: statusConcluidaId,
            acao: "concluida",
            descricao:
                descricao ??
                "Solicitação concluída.",
            metadata,
        });

        return solicitacaoAtualizada;
    },

    async cancelar({
                       solicitacaoId,
                       sysUsuarioId,
                       descricao = null,
                   }: CancelarSolicitacaoInput) {
        const solicitacao = await getSolicitacaoBase(solicitacaoId);

        if (!solicitacao) {
            throw new Error("Solicitação não encontrada.");
        }

        if (solicitacao.solicitado_por_usuario_id !== sysUsuarioId) {
            throw new Error("Somente o solicitante pode cancelar esta solicitação.");
        }

        assertStatusAtualPermitido(
            solicitacao.sys_solicitacao_status.codigo,
            ["rascunho", "enviada", "ajuste_solicitado"],
            "cancelar"
        );

        const statusCanceladaId = await getStatusId("cancelada");
        const now = new Date();

        const solicitacaoAtualizada = await prisma.sysSolicitacao.update({
            where: { id: solicitacao.id },
            data: {
                sys_solicitacao_status_id: statusCanceladaId,
                finalizado_at: now,
                updated_at: now,
            },
        });

        await solicitacaoHistoryService.registrar({
            sysSolicitacaoId: solicitacao.id,
            sysUsuarioId,
            statusAnteriorId: solicitacao.sys_solicitacao_status_id,
            statusNovoId: statusCanceladaId,
            acao: "cancelada",
            descricao:
                descricao ??
                "Solicitação cancelada pelo solicitante.",
        });

        return solicitacaoAtualizada;
    },

    async detalhar(solicitacaoId: number) {
        const solicitacao = await prisma.sysSolicitacao.findFirst({
            where: {
                id: solicitacaoId,
                ativo: 1,
                deleted_at: null,
            },
            include: {
                sys_solicitacao_tipo: true,
                sys_solicitacao_status: true,
                solicitado_por_usuario: {
                    select: {
                        id: true,
                        nome: true,
                        nickname: true,
                        email: true,
                        avatar_url: true,
                    },
                },
                responsavel_usuario: {
                    select: {
                        id: true,
                        nome: true,
                        nickname: true,
                        email: true,
                        avatar_url: true,
                    },
                },
                sys_solicitacao_documento: {
                    where: {
                        deleted_at: null,
                    },
                    include: {
                        sys_solicitacao_documento_tipo: true,
                        sys_solicitacao_documento_status: true,
                        sys_arquivo: true,
                    },
                    orderBy: {
                        created_at: "desc",
                    },
                },
                sys_solicitacao_historico: {
                    include: {
                        sys_usuario: {
                            select: {
                                id: true,
                                nome: true,
                                nickname: true,
                                email: true,
                            },
                        },
                        sys_solicitacao_status_anterior: true,
                        sys_solicitacao_status_novo: true,
                    },
                    orderBy: {
                        created_at: "desc",
                    },
                },
            },
        });

        if (!solicitacao) {
            return null;
        }

        return mapSolicitacao(solicitacao);
    },

    async listar({
                     sysUsuarioId,
                     scope = "minhas",
                     statusCodigo,
                     tipoCodigo,
                     page,
                     pageSize,
                     sort = "recent",
                 }: ListarSolicitacoesInput) {
        const resolvedPage = normalizarPage(page);
        const resolvedPageSize = normalizarPageSize(pageSize);
        const skip = (resolvedPage - 1) * resolvedPageSize;

        const where: any = {
            ativo: 1,
            deleted_at: null,
        };

        if (scope === "minhas") {
            where.solicitado_por_usuario_id = sysUsuarioId;
        }

        if (scope === "analise") {
            where.sys_solicitacao_status = {
                codigo: {
                    in: ["enviada", "em_analise"],
                },
            };
        }

        if (statusCodigo) {
            where.sys_solicitacao_status = {
                codigo: statusCodigo,
            };
        }

        if (tipoCodigo) {
            where.sys_solicitacao_tipo = {
                codigo: tipoCodigo,
            };
        }

        const orderBy =
            sort === "oldest"
                ? [{ created_at: "asc" as const }]
                : [{ created_at: "desc" as const }];

        const [total, items] = await Promise.all([
            prisma.sysSolicitacao.count({ where }),
            prisma.sysSolicitacao.findMany({
                where,
                select: {
                    id: true,
                    titulo: true,
                    descricao: true,
                    entidade_tipo: true,
                    entidade_id: true,
                    enviado_at: true,
                    finalizado_at: true,
                    created_at: true,
                    updated_at: true,
                    sys_solicitacao_tipo: {
                        select: {
                            codigo: true,
                            nome: true,
                            color: true,
                            icon: true,
                        },
                    },
                    sys_solicitacao_status: {
                        select: {
                            codigo: true,
                            nome: true,
                            color: true,
                            icon: true,
                        },
                    },
                    solicitado_por_usuario: {
                        select: {
                            id: true,
                            nome: true,
                            nickname: true,
                            email: true,
                            avatar_url: true,
                        },
                    },
                    responsavel_usuario: {
                        select: {
                            id: true,
                            nome: true,
                            nickname: true,
                            email: true,
                            avatar_url: true,
                        },
                    },
                },
                orderBy,
                skip,
                take: resolvedPageSize,
            }),
        ]);

        const totalPages = Math.max(1, Math.ceil(total / resolvedPageSize));

        return {
            items,
            pagination: {
                page: resolvedPage,
                pageSize: resolvedPageSize,
                total,
                totalPages,
                hasPreviousPage: resolvedPage > 1,
                hasNextPage: resolvedPage < totalPages,
            },
        };
    },
};