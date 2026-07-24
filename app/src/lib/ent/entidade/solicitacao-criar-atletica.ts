import { prisma } from "@/lib/prisma";
import { inboxService } from "@/lib/inbox/inbox-service";

type CriarAtleticaPayload = {
    nome?: string;
    apelido?: string;
    sigla?: string;
    slug?: string;
    mascote?: string;
    descricao?: string | null;
    eduInstituicaoId?: number;
    edu_instituicao_id?: number;
    eduPoloId?: number;
    edu_polo_id?: number;
    cursoIds?: number[];
    cursosIds?: number[];

    atletica?: {
        nome?: string;
        apelido?: string;
        sigla?: string;
        slug?: string;
        mascote?: string;
        descricao?: string | null;
        eduInstituicaoId?: number;
        edu_instituicao_id?: number;
        eduPoloId?: number;
        edu_polo_id?: number;
        cursoIds?: number[];
        cursosIds?: number[];
    };

    gestao?: {
        nome?: string;
        inicioAt?: string | Date | null;
        inicio_at?: string | Date | null;
        fimAt?: string | Date | null;
        fim_at?: string | Date | null;
        observacao?: string | null;
    };
};

type AplicarCriacaoAtleticaInput = {
    solicitacaoId: number;
    sysUsuarioId: number;
};

function parseJsonSafe(value?: string | null): CriarAtleticaPayload {
    if (!value) {
        return {};
    }

    try {
        const parsed = JSON.parse(value);

        if (!parsed || typeof parsed !== "object") {
            return {};
        }

        return parsed;
    } catch {
        return {};
    }
}

function slugify(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function getAtleticaPayload(payload: CriarAtleticaPayload) {
    return payload.atletica ?? payload;
}

function getGestaoPayload(payload: CriarAtleticaPayload) {
    return payload.gestao ?? {};
}

function normalizarDate(value?: string | Date | null) {
    if (!value) {
        return null;
    }

    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
}

function getCursoIds(payload: CriarAtleticaPayload) {
    const atleticaPayload = getAtleticaPayload(payload);

    const cursoIds =
        atleticaPayload.cursoIds ??
        atleticaPayload.cursosIds ??
        payload.cursoIds ??
        payload.cursosIds ??
        [];

    return cursoIds
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0);
}

async function getEntidadeTipoId(codigo: string) {
    const tipo = await prisma.entEntidadeTipo.findUnique({
        where: { codigo },
        select: { id: true },
    });

    if (!tipo) {
        throw new Error(`Tipo de entidade não encontrado: ${codigo}`);
    }

    return tipo.id;
}

async function getStatusId(codigo: string) {
    const status = await prisma.entEntidadeStatus.findUnique({
        where: { codigo },
        select: { id: true },
    });

    if (!status) {
        throw new Error(`Status da atlética não encontrado: ${codigo}`);
    }

    return status.id;
}

async function getGestaoStatusId(codigo: string) {
    const status = await prisma.entEntidadeGestaoStatus.findUnique({
        where: { codigo },
        select: { id: true },
    });

    if (!status) {
        throw new Error(`Status da gestão não encontrado: ${codigo}`);
    }

    return status.id;
}

async function getMembroTipoId(codigo: string) {
    const tipo = await prisma.entEntidadeMembroTipo.findUnique({
        where: { codigo },
        select: { id: true },
    });

    if (!tipo) {
        throw new Error(`Tipo de membro não encontrado: ${codigo}`);
    }

    return tipo.id;
}

async function getMembroStatusId(codigo: string) {
    const status = await prisma.entEntidadeMembroStatus.findUnique({
        where: { codigo },
        select: { id: true },
    });

    if (!status) {
        throw new Error(`Status de membro não encontrado: ${codigo}`);
    }

    return status.id;
}

async function getRoleId(codigo: string) {
    const role = await prisma.sysRole.findUnique({
        where: { codigo },
        select: { id: true },
    });

    if (!role) {
        throw new Error(`Role não encontrada: ${codigo}`);
    }

    return role.id;
}

async function getSolicitacaoStatusId(codigo: string) {
    const status = await prisma.sysSolicitacaoStatus.findUnique({
        where: { codigo },
        select: { id: true },
    });

    if (!status) {
        throw new Error(`Status de solicitação não encontrado: ${codigo}`);
    }

    return status.id;
}

async function getCargoPresidenteId() {
    const cargo = await prisma.entCargo.findFirst({
        where: {
            codigo: "presidente",
            ent_entidade_id: null,
            ativo: 1,
            deleted_at: null,
        },
        select: {
            id: true,
        },
    });

    if (!cargo) {
        throw new Error("Cargo padrão de presidente não encontrado.");
    }

    return cargo.id;
}

export const solicitacaoCriarAtleticaService = {
    async aplicarCriacaoAtletica({
                                     solicitacaoId,
                                     sysUsuarioId,
                                 }: AplicarCriacaoAtleticaInput) {
        const solicitacao = await prisma.sysSolicitacao.findFirst({
            where: {
                id: solicitacaoId,
                ativo: 1,
                deleted_at: null,
            },
            include: {
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
            throw new Error("Solicitação não encontrada.");
        }

        if (solicitacao.sys_solicitacao_tipo.codigo !== "criar_atletica") {
            throw new Error("Esta solicitação não é do tipo criar_atletica.");
        }

        if (solicitacao.sys_solicitacao_status.codigo !== "aprovada") {
            throw new Error(
                `A solicitação precisa estar aprovada para aplicar a criação da atlética. Status atual: ${solicitacao.sys_solicitacao_status.codigo}.`
            );
        }

        const payload = parseJsonSafe(solicitacao.payload_text);
        const atleticaPayload = getAtleticaPayload(payload);
        const gestaoPayload = getGestaoPayload(payload);

        const nome = atleticaPayload.nome?.trim();
        const apelido = atleticaPayload.apelido?.trim() || nome;
        const sigla = atleticaPayload.sigla?.trim();
        const mascote =
            atleticaPayload.mascote?.trim() || "Mascote não informado";
        const descricao = atleticaPayload.descricao ?? null;
        const slug = slugify(
            atleticaPayload.slug || apelido || sigla || nome || ""
        );
        const eduInstituicaoId =
            atleticaPayload.eduInstituicaoId ??
            atleticaPayload.edu_instituicao_id ??
            payload.eduInstituicaoId ??
            payload.edu_instituicao_id;

        const eduPoloId =
            atleticaPayload.eduPoloId ??
            atleticaPayload.edu_polo_id ??
            payload.eduPoloId ??
            payload.edu_polo_id ??
            solicitacao.edu_polo_id;

        if (!nome) {
            throw new Error(
                "Nome da atlética não informado no payload da solicitação."
            );
        }

        if (!apelido) {
            throw new Error(
                "Apelido da atlética não informado no payload da solicitação."
            );
        }

        if (!sigla) {
            throw new Error(
                "Sigla da atlética não informada no payload da solicitação."
            );
        }

        if (!slug) {
            throw new Error("Não foi possível gerar o slug da atlética.");
        }

        if (!eduInstituicaoId) {
            throw new Error(
                "Instituição da atlética não informada no payload da solicitação."
            );
        }

        if (!eduPoloId) {
            throw new Error(
                "Polo principal da atlética não informado no payload da solicitação."
            );
        }

        const slugExistente = await prisma.entEntidade.findFirst({
            where: {
                slug,
                deleted_at: null,
                id:
                    solicitacao.entidade_tipo === "ent_entidade" &&
                    solicitacao.entidade_id
                        ? {
                            not: solicitacao.entidade_id,
                        }
                        : undefined,
            },
            select: {
                id: true,
            },
        });

        if (slugExistente) {
            throw new Error(
                "Este endereço público já está em uso. Solicite ajuste antes de aprovar."
            );
        }

        const cursoIds = getCursoIds(payload);

        const gestaoNome =
            gestaoPayload.nome?.trim() ||
            `Gestão ${new Date().getFullYear()}`;

        const gestaoInicioAt =
            normalizarDate(gestaoPayload.inicioAt ?? gestaoPayload.inicio_at) ??
            new Date();

        const gestaoFimAt = normalizarDate(
            gestaoPayload.fimAt ?? gestaoPayload.fim_at
        );

        const now = new Date();

        const resultado = await prisma.$transaction(async (tx) => {
            const [
                entidadeTipoAtleticaId,
                atleticaStatusAtivaId,
                gestaoStatusAtivaId,
                membroTipoDiretorId,
                membroStatusAtivoId,
                rolePresidenciaAtleticaId,
                cargoPresidenteId,
                solicitacaoStatusConcluidaId,
            ] = await Promise.all([
                getEntidadeTipoId("atletica"),
                getStatusId("ativa"),
                getGestaoStatusId("ativa"),
                getMembroTipoId("diretor"),
                getMembroStatusId("ativo"),
                getRoleId("presidencia_atletica"),
                getCargoPresidenteId(),
                getSolicitacaoStatusId("concluida"),
            ]);

            let entEntidadeId = solicitacao.entidade_id;

            if (solicitacao.entidade_tipo === "ent_entidade" && entEntidadeId) {
                await tx.entEntidade.update({
                    where: {
                        id: entEntidadeId,
                    },
                    data: {
                        ent_entidade_tipo_id: entidadeTipoAtleticaId,
                        nome,
                        apelido,
                        sigla,
                        mascote,
                        slug,
                        descricao,
                        edu_instituicao_id: Number(eduInstituicaoId),
                        ent_entidade_status_id: atleticaStatusAtivaId,
                        criado_por_sys_usuario_id:
                        solicitacao.solicitado_por_usuario_id,
                        ativo: 1,
                        updated_at: now,
                    },
                });
            } else {
                const atleticaCriada = await tx.entEntidade.create({
                    data: {
                        ent_entidade_tipo_id: entidadeTipoAtleticaId,
                        edu_instituicao_id: Number(eduInstituicaoId),
                        ent_entidade_status_id: atleticaStatusAtivaId,
                        criado_por_sys_usuario_id:
                        solicitacao.solicitado_por_usuario_id,
                        nome,
                        apelido,
                        sigla,
                        mascote,
                        slug,
                        descricao,
                        ativo: 1,
                        created_at: now,
                        updated_at: now,
                    },
                });

                entEntidadeId = atleticaCriada.id;
            }

            if (!entEntidadeId) {
                throw new Error(
                    "Não foi possível criar ou localizar a atlética."
                );
            }

            await tx.entEntidadePolo.upsert({
                where: {
                    ent_entidade_id_edu_polo_id: {
                        ent_entidade_id: entEntidadeId,
                        edu_polo_id: Number(eduPoloId),
                    },
                },
                update: {
                    principal: 1,
                    ativo: 1,
                    updated_at: now,
                },
                create: {
                    ent_entidade_id: entEntidadeId,
                    edu_polo_id: Number(eduPoloId),
                    principal: 1,
                    ativo: 1,
                    created_at: now,
                    updated_at: now,
                },
            });

            await tx.entEntidadePolo.updateMany({
                where: {
                    ent_entidade_id: entEntidadeId,
                    edu_polo_id: { not: Number(eduPoloId) },
                    principal: 1,
                },
                data: {
                    principal: 0,
                    updated_at: now,
                },
            });

            for (const [index, cursoId] of cursoIds.entries()) {
                await tx.entEntidadeCurso.upsert({
                    where: {
                        ent_entidade_id_edu_curso_id: {
                            ent_entidade_id: entEntidadeId,
                            edu_curso_id: cursoId,
                        },
                    },
                    update: {
                        principal: index === 0 ? 1 : 0,
                        ativo: 1,
                        updated_at: now,
                    },
                    create: {
                        ent_entidade_id: entEntidadeId,
                        edu_curso_id: cursoId,
                        principal: index === 0 ? 1 : 0,
                        ativo: 1,
                        created_at: now,
                        updated_at: now,
                    },
                });
            }

            const gestao = await tx.entEntidadeGestao.upsert({
                where: {
                    ent_entidade_id_nome: {
                        ent_entidade_id: entEntidadeId,
                        nome: gestaoNome,
                    },
                },
                update: {
                    ent_entidade_gestao_status_id: gestaoStatusAtivaId,
                    inicio_at: gestaoInicioAt,
                    fim_at: gestaoFimAt,
                    observacao:
                        gestaoPayload.observacao ??
                        "Gestão criada a partir da solicitação de criação da atlética.",
                    ativo: 1,
                    updated_at: now,
                },
                create: {
                    ent_entidade_id: entEntidadeId,
                    ent_entidade_gestao_status_id: gestaoStatusAtivaId,
                    nome: gestaoNome,
                    inicio_at: gestaoInicioAt,
                    fim_at: gestaoFimAt,
                    observacao:
                        gestaoPayload.observacao ??
                        "Gestão criada a partir da solicitação de criação da atlética.",
                    ativo: 1,
                    created_at: now,
                    updated_at: now,
                },
            });

            const membro = await tx.entEntidadeMembro.upsert({
                where: {
                    ent_entidade_id_sys_usuario_id: {
                        ent_entidade_id: entEntidadeId,
                        sys_usuario_id: solicitacao.solicitado_por_usuario_id,
                    },
                },
                update: {
                    ent_entidade_membro_tipo_id: membroTipoDiretorId,
                    ent_entidade_membro_status_id: membroStatusAtivoId,
                    ativo: 1,
                    updated_at: now,
                },
                create: {
                    ent_entidade_id: entEntidadeId,
                    sys_usuario_id: solicitacao.solicitado_por_usuario_id,
                    ent_entidade_membro_tipo_id: membroTipoDiretorId,
                    ent_entidade_membro_status_id: membroStatusAtivoId,
                    entrou_at: now,
                    ativo: 1,
                    created_at: now,
                    updated_at: now,
                },
            });

            const cargoAtualExistente =
                await tx.entEntidadeMembroCargo.findFirst({
                    where: {
                        ent_entidade_membro_id: membro.id,
                        ent_cargo_id: cargoPresidenteId,
                        atual: 1,
                        deleted_at: null,
                    },
                    select: {
                        id: true,
                    },
                });

            if (!cargoAtualExistente) {
                await tx.entEntidadeMembroCargo.create({
                    data: {
                        ent_entidade_membro_id: membro.id,
                        ent_cargo_id: cargoPresidenteId,
                        inicio_at: now,
                        atual: 1,
                        observacao:
                            "Cargo atribuído a partir da aprovação da criação da atlética.",
                        created_at: now,
                        updated_at: now,
                    },
                });
            }

            await tx.sysUsuarioRole.upsert({
                where: {
                    sys_usuario_id_sys_role_id_ent_entidade_id: {
                        sys_usuario_id: solicitacao.solicitado_por_usuario_id,
                        sys_role_id: rolePresidenciaAtleticaId,
                        ent_entidade_id: entEntidadeId,
                    },
                },
                update: {
                    ativo: 1,
                    updated_at: now,
                },
                create: {
                    sys_usuario_id: solicitacao.solicitado_por_usuario_id,
                    sys_role_id: rolePresidenciaAtleticaId,
                    ent_entidade_id: entEntidadeId,
                    ativo: 1,
                    created_at: now,
                    updated_at: now,
                },
            });

            await tx.sysSolicitacao.update({
                where: {
                    id: solicitacao.id,
                },
                data: {
                    sys_solicitacao_status_id: solicitacaoStatusConcluidaId,
                    entidade_tipo: "ent_entidade",
                    entidade_id: entEntidadeId,
                    ent_entidade_id: entEntidadeId,
                    edu_instituicao_id: Number(eduInstituicaoId),
                    edu_polo_id: Number(eduPoloId),
                    finalizado_at: now,
                    updated_at: now,
                },
            });

            await tx.sysSolicitacaoHistorico.create({
                data: {
                    sys_solicitacao_id: solicitacao.id,
                    sys_usuario_id: sysUsuarioId,
                    sys_solicitacao_status_anterior_id:
                    solicitacao.sys_solicitacao_status_id,
                    sys_solicitacao_status_novo_id:
                    solicitacaoStatusConcluidaId,
                    acao: "acao_aplicada",
                    descricao:
                        "Criação da atlética aplicada: atlética ativada, gestão criada e solicitante vinculado como presidente.",
                    metadata_text: JSON.stringify({
                        ent_entidade_id: entEntidadeId,
                        ent_entidade_gestao_id: gestao.id,
                        sys_usuario_presidente_id:
                        solicitacao.solicitado_por_usuario_id,
                    }),
                    created_at: now,
                },
            });

            return {
                entEntidadeId,
                gestaoId: gestao.id,
                solicitanteId: solicitacao.solicitado_por_usuario_id,
                nome,
                apelido,
                sigla,
                slug,
            };
        });

        await inboxService.createItem({
            sysUsuarioId: resultado.solicitanteId,
            tipoCodigo: "result",
            statusCodigo: "approved",
            titulo: "Atlética criada com sucesso",
            mensagem: `A solicitação foi aprovada e a atlética ${resultado.apelido} (${resultado.sigla}) foi ativada no Brava Pass.`,
            actionUrl: "/ent/atletica",
            entidadeTipo: "ent_entidade",
            entidadeId: resultado.entEntidadeId,
            metadataText: JSON.stringify({
                sys_solicitacao_id: solicitacao.id,
                ent_entidade_id: resultado.entEntidadeId,
                ent_entidade_gestao_id: resultado.gestaoId,
                slug: resultado.slug,
            }),
        });

        return resultado;
    },
};