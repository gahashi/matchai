import {prisma} from "@/lib/prisma";
import { inboxService } from "@/lib/sys/inbox/inbox-service";

import {
    userHasGlobalPermissionByUserId,
} from "@/lib/auth/permissions";
import {solicitacaoHistoryService} from "@/lib/sys/solicitacao/solicitacao-history-service";
import {
    solicitacaoCriarAtleticaDetalheService,
} from "@/lib/ent/atletica/solicitacao-criar-atletica-detalhe";

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
    AtualizarPayloadSolicitacaoInput,
} from "@/lib/sys/solicitacao/solicitacao-types";

import {
    validarCriarAtleticaPayload,
} from "@/lib/ent/atletica/solicitacao-criar-atletica-payload";

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


export class SolicitacaoForbiddenError extends Error {
    readonly statusCode = 403;

    constructor(message = "Sem permissão para acessar esta solicitação.") {
        super(message);
        this.name = "SolicitacaoForbiddenError";
    }
}

export function getSolicitacaoErrorStatus(error: unknown) {
    if (error instanceof SolicitacaoForbiddenError) {
        return error.statusCode;
    }

    return 400;
}

async function assertGlobalPermission(
    sysUsuarioId: number,
    permissionCode: string,
    message: string
) {
    const allowed = await userHasGlobalPermissionByUserId(
        sysUsuarioId,
        permissionCode
    );

    if (!allowed) {
        throw new SolicitacaoForbiddenError(message);
    }
}

async function canAccessSolicitacaoDetail({
                                              sysUsuarioId,
                                              solicitanteId,
                                              responsavelId,
                                          }: {
    sysUsuarioId: number;
    solicitanteId: number;
    responsavelId: number | null;
}) {
    if (
        solicitanteId === sysUsuarioId ||
        responsavelId === sysUsuarioId
    ) {
        return true;
    }

    const [canAnalyze, canViewAll] = await Promise.all([
        userHasGlobalPermissionByUserId(
            sysUsuarioId,
            "solicitacao.analisar"
        ),
        userHasGlobalPermissionByUserId(
            sysUsuarioId,
            "solicitacao.visualizar_todas"
        ),
    ]);

    return canAnalyze || canViewAll;
}

async function getTipoId(codigo: SolicitacaoTipoCodigo) {
    const tipo = await prisma.sysSolicitacaoTipo.findUnique({
        where: {codigo},
        select: {id: true},
    });

    if (!tipo) {
        throw new Error(`Tipo de solicitação não encontrado: ${codigo}`);
    }

    return tipo.id;
}

async function getStatus(codigo: SolicitacaoStatusCodigo) {
    const status = await prisma.sysSolicitacaoStatus.findUnique({
        where: {codigo},
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

function validarPayloadPorTipo({
                                   tipoCodigo,
                                   payload,
                               }: {
    tipoCodigo: string;
    payload: JsonLike;
}) {
    switch (tipoCodigo) {
        case "criar_atletica": {
            const resultado =
                validarCriarAtleticaPayload(payload);

            return resultado.payload;
        }

        default:
            throw new Error(
                `O tipo de solicitação "${tipoCodigo}" ainda não permite atualização de dados.`
            );
    }
}

type CreateInboxItemParams = Parameters<typeof inboxService.createItem>[0];

async function criarInboxSeguro(input: CreateInboxItemParams) {
    try {
        await inboxService.createItem(input);
    } catch (error) {
        console.error("[SOLICITACAO_INBOX] Erro ao criar item no Inbox:", error);
    }
}

async function getUsuariosComPermissaoAnaliseIds() {
    const [porRole, porAllowDireto] = await Promise.all([
        prisma.sysUsuarioRole.findMany({
            where: {
                ativo: 1,
                deleted_at: null,
                sys_role: {
                    ativo: 1,
                    deleted_at: null,
                    sys_role_permission: {
                        some: {
                            ativo: 1,
                            sys_permission: {
                                codigo: "solicitacao.analisar",
                                ativo: 1,
                            },
                        },
                    },
                },
            },
            select: {
                sys_usuario_id: true,
            },
        }),

        prisma.sysUsuarioPermission.findMany({
            where: {
                ativo: 1,
                deleted_at: null,
                sys_permission: {
                    codigo: "solicitacao.analisar",
                    ativo: 1,
                },
                sys_usuario_permission_tipo: {
                    codigo: "allow",
                    ativo: 1,
                },
            },
            select: {
                sys_usuario_id: true,
            },
        }),
    ]);

    const candidatosIds = Array.from(
        new Set([
            ...porRole.map((item) => item.sys_usuario_id),
            ...porAllowDireto.map((item) => item.sys_usuario_id),
        ])
    );

    if (candidatosIds.length === 0) {
        return [];
    }

    const denies = await prisma.sysUsuarioPermission.findMany({
        where: {
            sys_usuario_id: {
                in: candidatosIds,
            },
            ativo: 1,
            deleted_at: null,
            sys_permission: {
                codigo: "solicitacao.analisar",
                ativo: 1,
            },
            sys_usuario_permission_tipo: {
                codigo: "deny",
                ativo: 1,
            },
        },
        select: {
            sys_usuario_id: true,
        },
    });

    const deniesIds = new Set(denies.map((item) => item.sys_usuario_id));

    const usuariosAtivos = await prisma.sysUsuario.findMany({
        where: {
            id: {
                in: candidatosIds.filter((id) => !deniesIds.has(id)),
            },
            ativo: 1,
            deleted_at: null,
        },
        select: {
            id: true,
        },
    });

    return usuariosAtivos.map((usuario) => usuario.id);
}

async function notificarAnalistasSolicitacaoEnviada({
                                                        solicitacaoId,
                                                        solicitanteId,
                                                        titulo,
                                                        tipoCodigo,
                                                    }: {
    solicitacaoId: number;
    solicitanteId: number;
    titulo: string;
    tipoCodigo: string;
}) {
    const analistasIds = await getUsuariosComPermissaoAnaliseIds();

    await Promise.all(
        analistasIds
            .filter((sysUsuarioId) => sysUsuarioId !== solicitanteId)
            .map((sysUsuarioId) =>
                criarInboxSeguro({
                    sysUsuarioId,
                    tipoCodigo: "request",
                    statusCodigo: "pending",
                    titulo: "Nova solicitação para análise",
                    mensagem: `A solicitação "${titulo}" foi enviada e aguarda análise.`,
                    contextoTitulo: `Solicitação #${solicitacaoId}`,
                    contextoDescricao: titulo,
                    actionUrl: `/sys/solicitacao/${solicitacaoId}`,
                    entidadeTipo: "sys_solicitacao",
                    entidadeId: solicitacaoId,
                    metadataText: JSON.stringify({
                        sys_solicitacao_id: solicitacaoId,
                        tipo_codigo: tipoCodigo,
                    }),
                })
            )
    );
}

async function notificarSolicitanteEmAnalise({
                                                 solicitacaoId,
                                                 solicitanteId,
                                                 titulo,
                                             }: {
    solicitacaoId: number;
    solicitanteId: number;
    titulo: string;
}) {
    await criarInboxSeguro({
        sysUsuarioId: solicitanteId,
        tipoCodigo: "info",
        statusCodigo: "unread",
        titulo: "Solicitação em análise",
        mensagem: `Sua solicitação "${titulo}" foi colocada em análise.`,
        contextoTitulo: `Solicitação #${solicitacaoId}`,
        contextoDescricao: titulo,
        actionUrl: `/sys/solicitacao/${solicitacaoId}`,
        entidadeTipo: "sys_solicitacao",
        entidadeId: solicitacaoId,
        metadataText: JSON.stringify({
            sys_solicitacao_id: solicitacaoId,
        }),
    });
}

async function notificarSolicitanteAjusteSolicitado({
                                                        solicitacaoId,
                                                        solicitanteId,
                                                        titulo,
                                                        descricao,
                                                    }: {
    solicitacaoId: number;
    solicitanteId: number;
    titulo: string;
    descricao: string;
}) {
    await criarInboxSeguro({
        sysUsuarioId: solicitanteId,
        tipoCodigo: "request",
        statusCodigo: "pending",
        titulo: "Ajuste solicitado",
        mensagem: `Foi solicitado um ajuste na sua solicitação "${titulo}". ${descricao}`,
        contextoTitulo: `Solicitação #${solicitacaoId}`,
        contextoDescricao: titulo,
        actionUrl: `/sys/solicitacao/${solicitacaoId}`,
        entidadeTipo: "sys_solicitacao",
        entidadeId: solicitacaoId,
        metadataText: JSON.stringify({
            sys_solicitacao_id: solicitacaoId,
        }),
    });
}

async function notificarSolicitanteRecusa({
                                              solicitacaoId,
                                              solicitanteId,
                                              titulo,
                                              descricao,
                                          }: {
    solicitacaoId: number;
    solicitanteId: number;
    titulo: string;
    descricao: string;
}) {
    await criarInboxSeguro({
        sysUsuarioId: solicitanteId,
        tipoCodigo: "result",
        statusCodigo: "rejected",
        titulo: "Solicitação recusada",
        mensagem: `Sua solicitação "${titulo}" foi recusada. Motivo: ${descricao}`,
        contextoTitulo: `Solicitação #${solicitacaoId}`,
        contextoDescricao: titulo,
        actionUrl: `/sys/solicitacao/${solicitacaoId}`,
        entidadeTipo: "sys_solicitacao",
        entidadeId: solicitacaoId,
        metadataText: JSON.stringify({
            sys_solicitacao_id: solicitacaoId,
        }),
    });
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

    async atualizarPayload({
                               solicitacaoId,
                               sysUsuarioId,
                               titulo,
                               descricao,
                               payload,
                               metadata,
                           }: AtualizarPayloadSolicitacaoInput) {
        const solicitacao =
            await prisma.sysSolicitacao.findFirst({
                where: {
                    id: solicitacaoId,
                    ativo: 1,
                    deleted_at: null,
                },
                select: {
                    id: true,
                    titulo: true,
                    descricao: true,
                    payload_text: true,
                    metadata_text: true,
                    solicitado_por_usuario_id: true,
                    sys_solicitacao_status_id: true,
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

        if (!solicitacao) {
            throw new Error(
                "Solicitação não encontrada."
            );
        }

        if (
            solicitacao.solicitado_por_usuario_id !==
            sysUsuarioId
        ) {
            throw new SolicitacaoForbiddenError(
                "Somente o solicitante pode editar esta solicitação."
            );
        }

        assertStatusAtualPermitido(
            solicitacao.sys_solicitacao_status.codigo,
            ["rascunho", "ajuste_solicitado"],
            "editar"
        );

        const payloadValidado =
            validarPayloadPorTipo({
                tipoCodigo:
                solicitacao.sys_solicitacao_tipo.codigo,
                payload,
            });

        const tituloNormalizado =
            titulo !== undefined
                ? titulo.trim()
                : solicitacao.titulo;

        if (!tituloNormalizado) {
            throw new Error(
                "O título da solicitação é obrigatório."
            );
        }

        const descricaoNormalizada =
            descricao !== undefined
                ? descricao?.trim() || null
                : solicitacao.descricao;

        const metadataAtual =
            parseJsonSafe(
                solicitacao.metadata_text
            );

        const metadataAtualizada =
            metadata === undefined
                ? metadataAtual
                : metadata;

        const now = new Date();

        return prisma.$transaction(async (tx) => {
            const solicitacaoAtualizada =
                await tx.sysSolicitacao.update({
                    where: {
                        id: solicitacao.id,
                    },
                    data: {
                        titulo: tituloNormalizado,
                        descricao:
                        descricaoNormalizada,
                        payload_text:
                            serializarJson(
                                payloadValidado
                            ),
                        metadata_text:
                            serializarJson(
                                metadataAtualizada
                            ),
                        updated_at: now,
                    },
                });

            await tx.sysSolicitacaoHistorico.create({
                data: {
                    sys_solicitacao_id:
                    solicitacao.id,
                    sys_usuario_id:
                    sysUsuarioId,
                    sys_solicitacao_status_anterior_id:
                    solicitacao.sys_solicitacao_status_id,
                    sys_solicitacao_status_novo_id:
                    solicitacao.sys_solicitacao_status_id,
                    acao: "dados_atualizados",
                    descricao:
                        solicitacao
                            .sys_solicitacao_status
                            .codigo ===
                        "ajuste_solicitado"
                            ? "Dados da solicitação atualizados após solicitação de ajuste."
                            : "Dados da solicitação atualizados.",
                    metadata_text:
                        JSON.stringify({
                            tipo_codigo:
                            solicitacao
                                .sys_solicitacao_tipo
                                .codigo,
                            status_mantido:
                            solicitacao
                                .sys_solicitacao_status
                                .codigo,
                        }),
                    created_at: now,
                },
            });

            return solicitacaoAtualizada;
        });
    },


    async enviar({
                     solicitacaoId,
                     sysUsuarioId,
                     descricaoHistorico = null,
                 }: EnviarSolicitacaoInput) {
        const solicitacao =
            await getSolicitacaoBase(solicitacaoId);

        if (!solicitacao) {
            throw new Error(
                "Solicitação não encontrada."
            );
        }

        if (
            solicitacao.solicitado_por_usuario_id !==
            sysUsuarioId
        ) {
            throw new SolicitacaoForbiddenError(
                "Somente o solicitante pode enviar esta solicitação."
            );
        }

        assertStatusAtualPermitido(
            solicitacao.sys_solicitacao_status.codigo,
            ["rascunho", "ajuste_solicitado"],
            "enviar"
        );

        const isCriarAtletica =
            solicitacao.sys_solicitacao_tipo.codigo ===
            "criar_atletica";

        const isReenvio =
            solicitacao.sys_solicitacao_status.codigo ===
            "ajuste_solicitado";

        const [statusEnviada, statusEmAnalise] =
            await Promise.all([
                getStatus("enviada"),
                isCriarAtletica
                    ? getStatus("em_analise")
                    : Promise.resolve(null),
            ]);

        const now = new Date();

        const solicitacaoAtualizada =
            await prisma.$transaction(async (tx) => {
                const statusFinalId =
                    isCriarAtletica &&
                    statusEmAnalise
                        ? statusEmAnalise.id
                        : statusEnviada.id;

                const atualizada =
                    await tx.sysSolicitacao.update({
                        where: {
                            id: solicitacao.id,
                        },
                        data: {
                            sys_solicitacao_status_id:
                            statusFinalId,
                            enviado_at: now,
                            updated_at: now,
                        },
                    });

                await tx.sysSolicitacaoHistorico.create({
                    data: {
                        sys_solicitacao_id:
                        solicitacao.id,
                        sys_usuario_id: sysUsuarioId,
                        sys_solicitacao_status_anterior_id:
                        solicitacao.sys_solicitacao_status_id,
                        sys_solicitacao_status_novo_id:
                        statusEnviada.id,
                        acao: isReenvio
                            ? "reenviada"
                            : "enviada",
                        descricao:
                            descricaoHistorico ??
                            (isReenvio
                                ? "Solicitação ajustada e reenviada para análise."
                                : "Solicitação enviada para análise."),
                        metadata_text: null,
                        created_at: now,
                    },
                });

                if (
                    isCriarAtletica &&
                    statusEmAnalise
                ) {
                    await tx.sysSolicitacaoHistorico.create({
                        data: {
                            sys_solicitacao_id:
                            solicitacao.id,
                            sys_usuario_id:
                            sysUsuarioId,
                            sys_solicitacao_status_anterior_id:
                            statusEnviada.id,
                            sys_solicitacao_status_novo_id:
                            statusEmAnalise.id,
                            acao: "em_analise",
                            descricao: isReenvio
                                ? "Solicitação de criação de atlética retornou automaticamente para análise após os ajustes."
                                : "Solicitação de criação de atlética entrou automaticamente em análise.",
                            metadata_text: JSON.stringify({
                                fluxo_automatico: true,
                                tipo_codigo:
                                    "criar_atletica",
                            }),
                            created_at: now,
                        },
                    });
                }

                return atualizada;
            });

        await notificarAnalistasSolicitacaoEnviada({
            solicitacaoId: solicitacao.id,
            solicitanteId: sysUsuarioId,
            titulo: solicitacaoAtualizada.titulo,
            tipoCodigo:
            solicitacao.sys_solicitacao_tipo.codigo,
        });

        return solicitacaoAtualizada;
    },

    async colocarEmAnalise({
                               solicitacaoId,
                               sysUsuarioId,
                               responsavelSysUsuarioId = null,
                               descricaoHistorico = null,
                           }: ColocarEmAnaliseInput) {
        await assertGlobalPermission(
            sysUsuarioId,
            "solicitacao.analisar",
            "Sem permissão para colocar solicitações em análise."
        );

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
            where: {id: solicitacao.id},
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

        if (solicitacao.solicitado_por_usuario_id !== sysUsuarioId) {
            await notificarSolicitanteEmAnalise({
                solicitacaoId: solicitacao.id,
                solicitanteId: solicitacao.solicitado_por_usuario_id,
                titulo: solicitacaoAtualizada.titulo,
            });
        }

        return solicitacaoAtualizada;
    },

    async solicitarAjuste({
                              solicitacaoId,
                              sysUsuarioId,
                              descricao,
                              metadata = null,
                          }: SolicitarAjusteInput) {
        await assertGlobalPermission(
            sysUsuarioId,
            "solicitacao.solicitar_ajuste",
            "Sem permissão para solicitar ajustes."
        );

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
            where: {id: solicitacao.id},
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

        if (solicitacao.solicitado_por_usuario_id !== sysUsuarioId) {
            await notificarSolicitanteAjusteSolicitado({
                solicitacaoId: solicitacao.id,
                solicitanteId: solicitacao.solicitado_por_usuario_id,
                titulo: solicitacaoAtualizada.titulo,
                descricao,
            });
        }

        return solicitacaoAtualizada;
    },

    async recusar({
                      solicitacaoId,
                      sysUsuarioId,
                      descricao,
                      metadata = null,
                  }: RecusarSolicitacaoInput) {
        await assertGlobalPermission(
            sysUsuarioId,
            "solicitacao.recusar",
            "Sem permissão para recusar solicitações."
        );

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
            where: {id: solicitacao.id},
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

        if (solicitacao.solicitado_por_usuario_id !== sysUsuarioId) {
            await notificarSolicitanteRecusa({
                solicitacaoId: solicitacao.id,
                solicitanteId: solicitacao.solicitado_por_usuario_id,
                titulo: solicitacaoAtualizada.titulo,
                descricao,
            });
        }

        return solicitacaoAtualizada;
    },

    async aprovar({
                      solicitacaoId,
                      sysUsuarioId,
                      descricao = null,
                      metadata = null,
                  }: AprovarSolicitacaoInput) {
        await assertGlobalPermission(
            sysUsuarioId,
            "solicitacao.aprovar",
            "Sem permissão para aprovar solicitações."
        );

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
            where: {id: solicitacao.id},
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
            where: {id: solicitacao.id},
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
            throw new SolicitacaoForbiddenError("Somente o solicitante pode cancelar esta solicitação.");
        }

        assertStatusAtualPermitido(
            solicitacao.sys_solicitacao_status.codigo,
            ["rascunho", "enviada", "ajuste_solicitado"],
            "cancelar"
        );

        const statusCanceladaId = await getStatusId("cancelada");
        const now = new Date();

        const solicitacaoAtualizada = await prisma.sysSolicitacao.update({
            where: {id: solicitacao.id},
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

    async detalhar({
                       solicitacaoId,
                       sysUsuarioId,
                   }: {
        solicitacaoId: number;
        sysUsuarioId: number;
    }) {
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

        const allowed = await canAccessSolicitacaoDetail({
            sysUsuarioId,
            solicitanteId: solicitacao.solicitado_por_usuario_id,
            responsavelId: solicitacao.responsavel_sys_usuario_id,
        });

        if (!allowed) {
            throw new SolicitacaoForbiddenError();
        }

        const solicitacaoMapeada =
            mapSolicitacao(solicitacao);

        const detalheEspecifico =
            solicitacao.sys_solicitacao_tipo.codigo ===
            "criar_atletica"
                ? await solicitacaoCriarAtleticaDetalheService.resolver({
                    payload: solicitacaoMapeada.payload,
                })
                : null;

        return {
            ...solicitacaoMapeada,
            detalheEspecifico,
        };
    },

    async listar({
                     sysUsuarioId,
                     scope = "minhas",
                     statusCodigos,
                     tipoCodigo,
                     page,
                     pageSize,
                     sort = "recent",
                 }: ListarSolicitacoesInput) {
        if (scope === "analise") {
            await assertGlobalPermission(
                sysUsuarioId,
                "solicitacao.analisar",
                "Sem permissão para visualizar solicitações em análise."
            );
        }

        if (scope === "todas") {
            await assertGlobalPermission(
                sysUsuarioId,
                "solicitacao.visualizar_todas",
                "Sem permissão para visualizar todas as solicitações."
            );
        }

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

        if (statusCodigos && statusCodigos.length > 0) {
            where.sys_solicitacao_status = {
                codigo: {
                    in: statusCodigos,
                },
            };
        }
        if (statusCodigos?.length) {
            where.sys_solicitacao_status = {
                codigo: {
                    in: statusCodigos,
                },
            };
        }

        const orderBy =
            sort === "oldest"
                ? [{created_at: "asc" as const}]
                : [{created_at: "desc" as const}];

        const [total, items] = await Promise.all([
            prisma.sysSolicitacao.count({where}),
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