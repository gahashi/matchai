import { inboxService } from "@/lib/inbox/inbox-service";
import { prisma } from "@/lib/prisma";

type CriarAtleticaPoloPayload = {
    id: number;
    principal: boolean;
};

type CriarAtleticaPayload = {
    atletica: {
        nome: string;
        apelido: string;
        sigla: string;
        slug: string;
        mascote?: string;
        descricao?: string | null;
        instituicaoId: number;
        polos: CriarAtleticaPoloPayload[];
        cursoIds: number[];
    };
    gestao: {
        nome: string;
        inicioAt: string | Date;
        fimAt?: string | Date | null;
        observacao?: string | null;
    };
};

type AplicarCriacaoAtleticaInput = {
    solicitacaoId: number;
    sysUsuarioId: number;
};

function parseJsonSafe(value?: string | null): CriarAtleticaPayload | null {
    if (!value) {
        return null;
    }

    try {
        const parsed: unknown = JSON.parse(value);

        if (!parsed || typeof parsed !== "object") {
            return null;
        }

        return parsed as CriarAtleticaPayload;
    } catch {
        return null;
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

function normalizarIds(values: number[]) {
    return Array.from(
        new Set(
            values
                .map((id) => Number(id))
                .filter((id) => Number.isInteger(id) && id > 0)
        )
    );
}

function normalizarPolos(polos: CriarAtleticaPoloPayload[]) {
    if (!Array.isArray(polos) || polos.length === 0) {
        throw new Error(
            "Informe pelo menos um polo vinculado à atlética."
        );
    }

    const polosNormalizados = polos
        .map((polo) => ({
            id: Number(polo.id),
            principal: polo.principal === true,
        }))
        .filter((polo) => Number.isInteger(polo.id) && polo.id > 0);

    if (polosNormalizados.length !== polos.length) {
        throw new Error("A lista de polos contém um identificador inválido.");
    }

    const ids = polosNormalizados.map((polo) => polo.id);

    if (new Set(ids).size !== ids.length) {
        throw new Error("A lista de polos possui registros duplicados.");
    }

    const polosPrincipais = polosNormalizados.filter(
        (polo) => polo.principal
    );

    if (polosPrincipais.length !== 1) {
        throw new Error(
            "A atlética deve possuir exatamente um polo principal."
        );
    }

    return {
        polos: polosNormalizados,
        poloPrincipalId: polosPrincipais[0].id,
        poloIds: ids,
    };
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
            throw new Error(
                "Esta solicitação não é do tipo criar_atletica."
            );
        }

        if (solicitacao.sys_solicitacao_status.codigo !== "aprovada") {
            throw new Error(
                `A solicitação precisa estar aprovada para aplicar a criação da atlética. Status atual: ${solicitacao.sys_solicitacao_status.codigo}.`
            );
        }

        const payload = parseJsonSafe(solicitacao.payload_text);

        if (!payload?.atletica || !payload.gestao) {
            throw new Error(
                "Payload da solicitação de criação da atlética inválido."
            );
        }

        const atleticaPayload = payload.atletica;
        const gestaoPayload = payload.gestao;

        const nome = atleticaPayload.nome?.trim();
        const apelido = atleticaPayload.apelido?.trim();
        const sigla = atleticaPayload.sigla?.trim().toUpperCase();
        const mascote =
            atleticaPayload.mascote?.trim() || "Mascote não informado";
        const descricao = atleticaPayload.descricao ?? null;
        const slug = slugify(
            atleticaPayload.slug || apelido || sigla || nome || ""
        );
        const instituicaoId = Number(atleticaPayload.instituicaoId);
        const cursoIds = normalizarIds(atleticaPayload.cursoIds ?? []);
        const { polos, poloPrincipalId, poloIds } = normalizarPolos(
            atleticaPayload.polos ?? []
        );

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

        if (!Number.isInteger(instituicaoId) || instituicaoId <= 0) {
            throw new Error(
                "Instituição da atlética não informada no payload da solicitação."
            );
        }

        if (cursoIds.length === 0) {
            throw new Error(
                "Informe pelo menos um curso vinculado à atlética."
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

        const [instituicao, polosValidos, cursosValidos] =
            await Promise.all([
                prisma.eduInstituicao.findFirst({
                    where: {
                        id: instituicaoId,
                        ativo: 1,
                        deleted_at: null,
                    },
                    select: {
                        id: true,
                    },
                }),
                prisma.eduPolo.findMany({
                    where: {
                        id: {
                            in: poloIds,
                        },
                        edu_instituicao_id: instituicaoId,
                        ativo: 1,
                        deleted_at: null,
                    },
                    select: {
                        id: true,
                    },
                }),
                prisma.eduInstituicaoCurso.findMany({
                    where: {
                        edu_instituicao_id: instituicaoId,
                        edu_curso_id: {
                            in: cursoIds,
                        },
                        ativo: 1,
                        deleted_at: null,
                        edu_curso: {
                            ativo: 1,
                            deleted_at: null,
                        },
                    },
                    select: {
                        edu_curso_id: true,
                    },
                }),
            ]);

        if (!instituicao) {
            throw new Error("A instituição informada não está disponível.");
        }

        const poloIdsValidos = polosValidos.map((polo) => polo.id);
        const cursoIdsValidos = cursosValidos.map(
            (curso) => curso.edu_curso_id
        );

        if (poloIdsValidos.length !== poloIds.length) {
            throw new Error(
                "Um ou mais polos selecionados não pertencem à instituição informada."
            );
        }

        if (!poloIdsValidos.includes(poloPrincipalId)) {
            throw new Error(
                "O polo principal não pertence à instituição informada."
            );
        }

        if (cursoIdsValidos.length !== cursoIds.length) {
            throw new Error(
                "Um ou mais cursos selecionados não pertencem à instituição informada."
            );
        }

        const gestaoNome =
            gestaoPayload.nome?.trim() ||
            `Gestão ${new Date().getFullYear()}`;
        const gestaoInicioAt =
            normalizarDate(gestaoPayload.inicioAt) ?? new Date();
        const gestaoFimAt = normalizarDate(gestaoPayload.fimAt);
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

            if (
                solicitacao.entidade_tipo === "ent_entidade" &&
                entEntidadeId
            ) {
                await tx.entEntidade.update({
                    where: {
                        id: entEntidadeId,
                    },
                    data: {
                        ent_entidade_tipo_id: entidadeTipoAtleticaId,
                        ent_entidade_status_id: atleticaStatusAtivaId,
                        edu_instituicao_id: instituicaoId,
                        criado_por_sys_usuario_id:
                        solicitacao.solicitado_por_usuario_id,
                        nome,
                        apelido,
                        sigla,
                        mascote,
                        slug,
                        descricao,
                        ativo: 1,
                        deleted_at: null,
                        updated_at: now,
                    },
                });
            } else {
                const atleticaCriada = await tx.entEntidade.create({
                    data: {
                        ent_entidade_tipo_id: entidadeTipoAtleticaId,
                        ent_entidade_status_id: atleticaStatusAtivaId,
                        edu_instituicao_id: instituicaoId,
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

            await tx.entEntidadePolo.updateMany({
                where: {
                    ent_entidade_id: entEntidadeId,
                    edu_polo_id: {
                        notIn: poloIdsValidos,
                    },
                    ativo: 1,
                },
                data: {
                    principal: 0,
                    ativo: 0,
                    updated_at: now,
                },
            });

            for (const polo of polos) {
                await tx.entEntidadePolo.upsert({
                    where: {
                        ent_entidade_id_edu_polo_id: {
                            ent_entidade_id: entEntidadeId,
                            edu_polo_id: polo.id,
                        },
                    },
                    update: {
                        principal: polo.principal ? 1 : 0,
                        ativo: 1,
                        deleted_at: null,
                        updated_at: now,
                    },
                    create: {
                        ent_entidade_id: entEntidadeId,
                        edu_polo_id: polo.id,
                        principal: polo.principal ? 1 : 0,
                        ativo: 1,
                        created_at: now,
                        updated_at: now,
                    },
                });
            }

            await tx.entEntidadeCurso.updateMany({
                where: {
                    ent_entidade_id: entEntidadeId,
                    edu_curso_id: {
                        notIn: cursoIdsValidos,
                    },
                    ativo: 1,
                },
                data: {
                    principal: 0,
                    ativo: 0,
                    updated_at: now,
                },
            });

            for (const [index, cursoId] of cursoIdsValidos.entries()) {
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
                        deleted_at: null,
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
                    deleted_at: null,
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
                        sys_usuario_id:
                        solicitacao.solicitado_por_usuario_id,
                    },
                },
                update: {
                    ent_entidade_membro_tipo_id: membroTipoDiretorId,
                    ent_entidade_membro_status_id:
                    membroStatusAtivoId,
                    ativo: 1,
                    deleted_at: null,
                    updated_at: now,
                },
                create: {
                    ent_entidade_id: entEntidadeId,
                    sys_usuario_id:
                    solicitacao.solicitado_por_usuario_id,
                    ent_entidade_membro_tipo_id: membroTipoDiretorId,
                    ent_entidade_membro_status_id:
                    membroStatusAtivoId,
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
                        sys_usuario_id:
                        solicitacao.solicitado_por_usuario_id,
                        sys_role_id: rolePresidenciaAtleticaId,
                        ent_entidade_id: entEntidadeId,
                    },
                },
                update: {
                    ativo: 1,
                    deleted_at: null,
                    updated_at: now,
                },
                create: {
                    sys_usuario_id:
                    solicitacao.solicitado_por_usuario_id,
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
                    sys_solicitacao_status_id:
                    solicitacaoStatusConcluidaId,
                    entidade_tipo: "ent_entidade",
                    entidade_id: entEntidadeId,
                    ent_entidade_id: entEntidadeId,
                    edu_instituicao_id: instituicaoId,
                    edu_polo_id: poloPrincipalId,
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
                        edu_instituicao_id: instituicaoId,
                        edu_polo_principal_id: poloPrincipalId,
                        edu_polo_ids: poloIdsValidos,
                        edu_curso_ids: cursoIdsValidos,
                        sys_usuario_presidente_id:
                        solicitacao.solicitado_por_usuario_id,
                    }),
                    created_at: now,
                },
            });

            return {
                entEntidadeId,
                gestaoId: gestao.id,
                solicitanteId:
                solicitacao.solicitado_por_usuario_id,
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