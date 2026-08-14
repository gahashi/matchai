import { prisma } from "@/lib/prisma";

type StatusCodigo = "pendente" | "ativo" | "expirado" | "cancelado" | "bloqueado";

type CriarManualInput = {
    sysUsuarioId: number;
    socPlanoId: number;
    socSocioStatusId: number;
    inicioAt: Date;
    fimAt: Date;
    observacao?: string | null;
};

type AtualizarInput = {
    id: number;
    socPlanoId: number;
    socSocioStatusId: number;
    inicioAt: Date;
    fimAt: Date;
    observacao?: string | null;
};

const socioSelect = {
    id: true,
    sys_usuario_id: true,
    soc_plano_id: true,
    soc_socio_status_id: true,
    soc_socio_origem_id: true,
    origem_vnd_pedido_item_id: true,
    inicio_at: true,
    fim_at: true,
    observacao: true,
    created_at: true,
    updated_at: true,
    sys_usuario: {
        select: {
            id: true,
            nome: true,
            nickname: true,
            email: true,
            telefone: true,
            ativo: true,
        },
    },
    soc_plano: {
        select: {
            id: true,
            codigo: true,
            nome: true,
            duracao_dias: true,
            ativo: true,
        },
    },
    soc_socio_status: {
        select: {
            id: true,
            codigo: true,
            descricao: true,
            color: true,
            icon: true,
            ativo: true,
        },
    },
    soc_socio_origem: {
        select: {
            id: true,
            codigo: true,
            descricao: true,
            ativo: true,
        },
    },
};

function normalizeOptional(value?: string | null) {
    const v = value?.trim();
    return v ? v : null;
}

function validateInterval(inicioAt: Date, fimAt: Date) {
    if (Number.isNaN(inicioAt.getTime()) || Number.isNaN(fimAt.getTime())) {
        throw new Error("Período da associação inválido.");
    }
    if (fimAt < inicioAt) {
        throw new Error("A validade final não pode ser anterior ao início.");
    }
}

function statusEfetivo(codigo: string, fimAt: Date): StatusCodigo {
    if (codigo === "ativo" && fimAt < new Date()) return "expirado";
    if (
        codigo === "pendente" ||
        codigo === "ativo" ||
        codigo === "expirado" ||
        codigo === "cancelado" ||
        codigo === "bloqueado"
    ) {
        return codigo;
    }
    return "pendente";
}

function serializeSocio(socio: any) {
    return {
        id: socio.id,
        sys_usuario_id: socio.sys_usuario_id,
        soc_plano_id: socio.soc_plano_id,
        soc_socio_status_id: socio.soc_socio_status_id,
        soc_socio_origem_id: socio.soc_socio_origem_id,
        origem_vnd_pedido_item_id: socio.origem_vnd_pedido_item_id,
        inicio_at: socio.inicio_at,
        fim_at: socio.fim_at,
        observacao: socio.observacao,
        created_at: socio.created_at,
        updated_at: socio.updated_at,
        status_efetivo: statusEfetivo(socio.soc_socio_status.codigo, socio.fim_at),
        usuario: {
            id: socio.sys_usuario.id,
            nome: socio.sys_usuario.nome,
            nickname: socio.sys_usuario.nickname,
            email: socio.sys_usuario.email,
            telefone: socio.sys_usuario.telefone,
            ativo: socio.sys_usuario.ativo,
        },
        plano: {
            id: socio.soc_plano.id,
            codigo: socio.soc_plano.codigo,
            nome: socio.soc_plano.nome,
            duracao_dias: socio.soc_plano.duracao_dias,
            ativo: socio.soc_plano.ativo,
        },
        status: {
            id: socio.soc_socio_status.id,
            codigo: socio.soc_socio_status.codigo,
            descricao: socio.soc_socio_status.descricao,
            color: socio.soc_socio_status.color,
            icon: socio.soc_socio_status.icon,
        },
        origem: {
            id: socio.soc_socio_origem.id,
            codigo: socio.soc_socio_origem.codigo,
            descricao: socio.soc_socio_origem.descricao,
        },
    };
}

class SocioService {
    async listAdminData() {
        const [socios, planos, statuses] = await Promise.all([
            prisma.socSocio.findMany({
                select: socioSelect,
                orderBy: [{ fim_at: "desc" }, { id: "desc" }],
            }),
            prisma.socPlano.findMany({
                where: { deleted_at: null },
                select: {
                    id: true,
                    codigo: true,
                    nome: true,
                    duracao_dias: true,
                    ativo: true,
                },
                orderBy: [{ ativo: "desc" }, { nome: "asc" }],
            }),
            prisma.socSocioStatus.findMany({
                where: { ativo: 1 },
                select: {
                    id: true,
                    codigo: true,
                    descricao: true,
                    color: true,
                    icon: true,
                },
                orderBy: { id: "asc" },
            }),
        ]);

        return {
            socios: socios.map(serializeSocio),
            planos,
            statuses,
        };
    }

    async findById(id: number) {
        const socio = await prisma.socSocio.findUnique({
            where: { id },
            select: socioSelect,
        });
        return socio ? serializeSocio(socio) : null;
    }

    async createManual(input: CriarManualInput) {
        validateInterval(input.inicioAt, input.fimAt);
        await this.ensureUsuario(input.sysUsuarioId);
        await this.ensurePlano(input.socPlanoId);
        const status = await this.ensureStatus(input.socSocioStatusId);

        const origem = await prisma.socSocioOrigem.findUnique({
            where: { codigo: "manual" },
            select: { id: true, ativo: true },
        });
        if (!origem?.ativo) {
            throw new Error('Origem "manual" não está disponível.');
        }

        if (status.codigo === "ativo" || status.codigo === "pendente") {
            await this.ensureSemAssociacaoAberta(input.sysUsuarioId, input.inicioAt);
        }

        const created = await prisma.socSocio.create({
            data: {
                sys_usuario_id: input.sysUsuarioId,
                soc_plano_id: input.socPlanoId,
                soc_socio_status_id: input.socSocioStatusId,
                soc_socio_origem_id: origem.id,
                origem_vnd_pedido_item_id: null,
                inicio_at: input.inicioAt,
                fim_at: input.fimAt,
                observacao: normalizeOptional(input.observacao),
                created_at: new Date(),
                updated_at: new Date(),
            },
            select: { id: true },
        });

        return this.findById(created.id);
    }

    async update(input: AtualizarInput) {
        validateInterval(input.inicioAt, input.fimAt);

        const atual = await prisma.socSocio.findUnique({
            where: { id: input.id },
            select: { id: true, sys_usuario_id: true },
        });
        if (!atual) throw new Error("Associação não encontrada.");

        await this.ensurePlano(input.socPlanoId);
        const status = await this.ensureStatus(input.socSocioStatusId);

        if (status.codigo === "ativo" || status.codigo === "pendente") {
            await this.ensureSemAssociacaoAberta(
                atual.sys_usuario_id,
                input.inicioAt,
                input.id,
            );
        }

        await prisma.socSocio.update({
            where: { id: input.id },
            data: {
                soc_plano_id: input.socPlanoId,
                soc_socio_status_id: input.socSocioStatusId,
                inicio_at: input.inicioAt,
                fim_at: input.fimAt,
                observacao: normalizeOptional(input.observacao),
                updated_at: new Date(),
            },
        });

        return this.findById(input.id);
    }

    async setStatus(id: number, statusId: number) {
        const atual = await prisma.socSocio.findUnique({
            where: { id },
            select: {
                id: true,
                sys_usuario_id: true,
                inicio_at: true,
            },
        });
        if (!atual) throw new Error("Associação não encontrada.");

        const status = await this.ensureStatus(statusId);
        if (status.codigo === "ativo" || status.codigo === "pendente") {
            await this.ensureSemAssociacaoAberta(
                atual.sys_usuario_id,
                atual.inicio_at,
                id,
            );
        }

        await prisma.socSocio.update({
            where: { id },
            data: {
                soc_socio_status_id: statusId,
                updated_at: new Date(),
            },
        });
        return this.findById(id);
    }

    async setStatusByCodigo(id: number, codigo: "cancelado" | "bloqueado") {
        const status = await prisma.socSocioStatus.findUnique({
            where: { codigo },
            select: { id: true, ativo: true },
        });
        if (!status?.ativo) {
            throw new Error(`Status "${codigo}" não está disponível.`);
        }
        return this.setStatus(id, status.id);
    }

    async renovar(id: number) {
        const atual = await prisma.socSocio.findUnique({
            where: { id },
            select: {
                id: true,
                fim_at: true,
                soc_plano: {
                    select: { duracao_dias: true },
                },
            },
        });
        if (!atual) throw new Error("Associação não encontrada.");

        const statusAtivo = await prisma.socSocioStatus.findUnique({
            where: { codigo: "ativo" },
            select: { id: true, ativo: true },
        });
        if (!statusAtivo?.ativo) {
            throw new Error('Status "ativo" não está disponível.');
        }

        const now = new Date();
        const vigente = atual.fim_at > now;
        const base = vigente ? new Date(atual.fim_at) : now;
        const novoFim = new Date(base);
        novoFim.setDate(novoFim.getDate() + atual.soc_plano.duracao_dias);

        await prisma.socSocio.update({
            where: { id },
            data: {
                ...(vigente ? {} : { inicio_at: now }),
                fim_at: novoFim,
                soc_socio_status_id: statusAtivo.id,
                updated_at: new Date(),
            },
        });

        return this.findById(id);
    }

    private async ensureUsuario(id: number) {
        const usuario = await prisma.sysUsuario.findFirst({
            where: { id, ativo: 1, deleted_at: null },
            select: { id: true },
        });
        if (!usuario) throw new Error("Usuário inválido ou inativo.");
    }

    private async ensurePlano(id: number) {
        const plano = await prisma.socPlano.findFirst({
            where: { id, deleted_at: null },
            select: { id: true },
        });
        if (!plano) throw new Error("Plano de sócio inválido.");
    }

    private async ensureStatus(id: number) {
        const status = await prisma.socSocioStatus.findFirst({
            where: { id, ativo: 1 },
            select: { id: true, codigo: true },
        });
        if (!status) throw new Error("Status de associação inválido.");
        return status;
    }

    private async ensureSemAssociacaoAberta(
        sysUsuarioId: number,
        inicioAt: Date,
        ignoreId?: number,
    ) {
        const existente = await prisma.socSocio.findFirst({
            where: {
                sys_usuario_id: sysUsuarioId,
                fim_at: { gte: inicioAt },
                soc_socio_status: {
                    codigo: { in: ["ativo", "pendente"] },
                },
                ...(ignoreId ? { id: { not: ignoreId } } : {}),
            },
            select: { id: true },
        });

        if (existente) {
            throw new Error(
                "Este usuário já possui uma associação ativa ou pendente neste período.",
            );
        }
    }
}

export const socioService = new SocioService();
