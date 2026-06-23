import "dotenv/config";
import crypto from "node:crypto";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { auth } from "../src/lib/auth/auth";

const adapter = new PrismaMariaDb({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "userBravaPass",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "brava_pass",
    connectionLimit: 5,
});

const prisma = new PrismaClient({
    adapter,
});


const now = () => new Date();

function gerarSenhaHashDev(senha: string): string {
    // Hash simples apenas para seed/dev inicial.
    // Depois, na autenticação real, trocamos para bcrypt/argon2.
    return crypto.createHash("sha256").update(senha).digest("hex");
}

async function upsertByCodigo<T extends { id: number }>(
    model: {
        findUnique: (args: any) => Promise<T | null>;
        create: (args: any) => Promise<T>;
        update: (args: any) => Promise<T>;
    },
    codigo: string,
    data: Record<string, any>
): Promise<T> {
    const existente = await model.findUnique({
        where: { codigo },
    });

    if (existente) {
        return model.update({
            where: { id: existente.id },
            data: {
                ...data,
                updated_at: now(),
            },
        });
    }

    return model.create({
        data: {
            codigo,
            ...data,
            created_at: now(),
            updated_at: now(),
        },
    });
}

async function ensureBetterAuthUser(params: {
    sysUsuarioId: number;
    nome: string;
    email: string;
    senha: string;
}) {
    const authUserExistente = await prisma.user.findUnique({
        where: {
            email: params.email,
        },
    });

    if (authUserExistente) {
        await prisma.user.update({
            where: {
                id: authUserExistente.id,
            },
            data: {
                name: params.nome,
                emailVerified: true,
                sysUsuarioId: params.sysUsuarioId,
                updatedAt: now(),
            },
        });

        console.log(`Auth user já existia: ${params.email}`);
        return authUserExistente;
    }

    const authUserCriado = await auth.api.signUpEmail({
        body: {
            name: params.nome,
            email: params.email,
            password: params.senha,
            sysUsuarioId: params.sysUsuarioId,
        },
    });

    await prisma.user.update({
        where: {
            email: params.email,
        },
        data: {
            emailVerified: true,
            sysUsuarioId: params.sysUsuarioId,
            updatedAt: now(),
        },
    });

    console.log(`Auth user criado: ${params.email}`);

    return authUserCriado;
}

async function main() {
    console.log("Iniciando seed do Brava Pass...");

    /**
     * SYS - Escopos de role
     */
    const sysRoleEscopoGlobal = await upsertByCodigo(prisma.sysRoleEscopo, "global", {
        nome: "Global",
        descricao: "Permissões administrativas globais do sistema.",
        ativo: 1,
    });

    const sysRoleEscopoAtletica = await upsertByCodigo(prisma.sysRoleEscopo, "atletica", {
        nome: "Atlética",
        descricao: "Permissões dentro do contexto de uma atlética.",
        ativo: 1,
    });

    await upsertByCodigo(prisma.sysRoleEscopo, "parceiro", {
        nome: "Parceiro",
        descricao: "Permissões para parceiros externos futuros.",
        ativo: 1,
    });

    /**
     * SYS - Tipo de permissão direta do usuário
     */
    await upsertByCodigo(prisma.sysUsuarioPermissionTipo, "allow", {
        nome: "Permitir",
        descricao: "Permissão extra liberada diretamente para o usuário.",
        ativo: 1,
    });

    await upsertByCodigo(prisma.sysUsuarioPermissionTipo, "deny", {
        nome: "Negar",
        descricao: "Permissão bloqueada diretamente para o usuário.",
        ativo: 1,
    });

    /**
     * ATL - Tipos de cargo
     */
    const atlCargoTipoPadrao = await upsertByCodigo(prisma.atlCargoTipo, "padrao", {
        nome: "Padrão",
        descricao: "Cargo padrão disponível para qualquer atlética.",
        ativo: 1,
    });

    await upsertByCodigo(prisma.atlCargoTipo, "personalizado", {
        nome: "Personalizado",
        descricao: "Cargo criado ou personalizado por uma atlética.",
        ativo: 1,
    });

    /**
     * ATL - Tipos de membro
     */
    const atlMembroTipoDiretor = await upsertByCodigo(prisma.atlAtleticaMembroTipo, "diretor", {
        nome: "Diretor",
        descricao: "Membro que faz parte da diretoria da atlética.",
        ativo: 1,
    });

    await upsertByCodigo(prisma.atlAtleticaMembroTipo, "colaborador", {
        nome: "Colaborador",
        descricao: "Pessoa que colabora com a atlética sem necessariamente fazer parte da diretoria.",
        ativo: 1,
    });

    await upsertByCodigo(prisma.atlAtleticaMembroTipo, "conselheiro", {
        nome: "Conselheiro",
        descricao: "Pessoa vinculada ao conselho da atlética.",
        ativo: 1,
    });

    await upsertByCodigo(prisma.atlAtleticaMembroTipo, "membro", {
        nome: "Membro",
        descricao: "Membro comum vinculado à atlética.",
        ativo: 1,
    });

    /**
     * ATL - Status de membro
     */
    const atlMembroStatusAtivo = await upsertByCodigo(prisma.atlAtleticaMembroStatus, "ativo", {
        nome: "Ativo",
        color: "success",
        icon: "bi-check-circle",
        ativo: 1,
    });

    await upsertByCodigo(prisma.atlAtleticaMembroStatus, "inativo", {
        nome: "Inativo",
        color: "secondary",
        icon: "bi-dash-circle",
        ativo: 1,
    });

    await upsertByCodigo(prisma.atlAtleticaMembroStatus, "afastado", {
        nome: "Afastado",
        color: "warning",
        icon: "bi-exclamation-circle",
        ativo: 1,
    });

    await upsertByCodigo(prisma.atlAtleticaMembroStatus, "convidado", {
        nome: "Convidado",
        color: "info",
        icon: "bi-person-plus",
        ativo: 1,
    });

    /**
     * SYS - Periodicidade de assinatura
     */
    const periodicidadeDev = await upsertByCodigo(
        prisma.sysAssinaturaPlanoPeriodicidade,
        "dev",
        {
            nome: "Desenvolvimento",
            descricao: "Plano interno para desenvolvimento e testes.",
            ativo: 1,
        }
    );

    await upsertByCodigo(prisma.sysAssinaturaPlanoPeriodicidade, "mensal", {
        nome: "Mensal",
        descricao: "Cobrança mensal.",
        ativo: 1,
    });

    await upsertByCodigo(prisma.sysAssinaturaPlanoPeriodicidade, "semestral", {
        nome: "Semestral",
        descricao: "Cobrança semestral.",
        ativo: 1,
    });

    await upsertByCodigo(prisma.sysAssinaturaPlanoPeriodicidade, "anual", {
        nome: "Anual",
        descricao: "Cobrança anual.",
        ativo: 1,
    });

    /**
     * ATL - Status de assinatura
     */
    const assinaturaStatusDev = await upsertByCodigo(
        prisma.atlAtleticaAssinaturaStatus,
        "dev",
        {
            nome: "Dev",
            color: "info",
            icon: "bi-code-slash",
            ativo: 1,
        }
    );

    await upsertByCodigo(prisma.atlAtleticaAssinaturaStatus, "ativa", {
        nome: "Ativa",
        color: "success",
        icon: "bi-check-circle",
        ativo: 1,
    });

    await upsertByCodigo(prisma.atlAtleticaAssinaturaStatus, "inativa", {
        nome: "Inativa",
        color: "secondary",
        icon: "bi-dash-circle",
        ativo: 1,
    });

    await upsertByCodigo(prisma.atlAtleticaAssinaturaStatus, "expirada", {
        nome: "Expirada",
        color: "warning",
        icon: "bi-clock-history",
        ativo: 1,
    });

    await upsertByCodigo(prisma.atlAtleticaAssinaturaStatus, "cancelada", {
        nome: "Cancelada",
        color: "danger",
        icon: "bi-x-circle",
        ativo: 1,
    });

    /**
     * SYS - Permissões iniciais
     */
    const permissions = [
        {
            codigo: "atletica.visualizar",
            nome: "Visualizar atlética",
            modulo: "atletica",
            descricao: "Permite visualizar dados da atlética.",
        },
        {
            codigo: "atletica.editar",
            nome: "Editar atlética",
            modulo: "atletica",
            descricao: "Permite editar dados principais da atlética.",
        },
        {
            codigo: "tema.visualizar",
            nome: "Visualizar tema",
            modulo: "tema",
            descricao: "Permite visualizar tema da atlética.",
        },
        {
            codigo: "tema.editar",
            nome: "Editar tema",
            modulo: "tema",
            descricao: "Permite editar identidade visual da atlética.",
        },
        {
            codigo: "membro.visualizar",
            nome: "Visualizar membros",
            modulo: "membro",
            descricao: "Permite visualizar membros da atlética.",
        },
        {
            codigo: "membro.criar",
            nome: "Criar membro",
            modulo: "membro",
            descricao: "Permite adicionar membros à atlética.",
        },
        {
            codigo: "membro.editar",
            nome: "Editar membro",
            modulo: "membro",
            descricao: "Permite editar membros da atlética.",
        },
        {
            codigo: "membro.remover",
            nome: "Remover membro",
            modulo: "membro",
            descricao: "Permite remover ou desativar membros da atlética.",
        },
        {
            codigo: "cargo.visualizar",
            nome: "Visualizar cargos",
            modulo: "cargo",
            descricao: "Permite visualizar cargos da atlética.",
        },
        {
            codigo: "cargo.criar",
            nome: "Criar cargo",
            modulo: "cargo",
            descricao: "Permite criar cargos personalizados.",
        },
        {
            codigo: "cargo.editar",
            nome: "Editar cargo",
            modulo: "cargo",
            descricao: "Permite editar cargos da atlética.",
        },
        {
            codigo: "cargo.remover",
            nome: "Remover cargo",
            modulo: "cargo",
            descricao: "Permite desativar cargos da atlética.",
        },
        {
            codigo: "regimento.visualizar",
            nome: "Visualizar regimento",
            modulo: "regimento",
            descricao: "Permite visualizar regimento interno.",
        },
        {
            codigo: "regimento.editar",
            nome: "Editar regimento",
            modulo: "regimento",
            descricao: "Permite editar regimento interno.",
        },
        {
            codigo: "dashboard.visualizar",
            nome: "Visualizar dashboard",
            modulo: "dashboard",
            descricao: "Permite acessar dashboard da atlética.",
        },
    ];

    for (const permission of permissions) {
        await upsertByCodigo(prisma.sysPermission, permission.codigo, {
            nome: permission.nome,
            modulo: permission.modulo,
            descricao: permission.descricao,
            ativo: 1,
        });
    }

    /**
     * SYS - Roles iniciais
     */
    const roleAdminGlobal = await upsertByCodigo(prisma.sysRole, "admin_global", {
        nome: "Administrador Global",
        descricao: "Acesso administrativo global do sistema.",
        sys_role_escopo_id: sysRoleEscopoGlobal.id,
        ativo: 1,
    });

    const roleAdminAtletica = await upsertByCodigo(prisma.sysRole, "admin_atletica", {
        nome: "Administrador da Atlética",
        descricao: "Acesso administrativo dentro de uma atlética.",
        sys_role_escopo_id: sysRoleEscopoAtletica.id,
        ativo: 1,
    });

    const rolePresidenciaAtletica = await upsertByCodigo(
        prisma.sysRole,
        "presidencia_atletica",
        {
            nome: "Presidência da Atlética",
            descricao: "Acesso destinado à presidência da atlética.",
            sys_role_escopo_id: sysRoleEscopoAtletica.id,
            ativo: 1,
        }
    );

    await upsertByCodigo(prisma.sysRole, "financeiro_atletica", {
        nome: "Financeiro da Atlética",
        descricao: "Acesso destinado à diretoria financeira.",
        sys_role_escopo_id: sysRoleEscopoAtletica.id,
        ativo: 1,
    });

    await upsertByCodigo(prisma.sysRole, "membro_colaborador", {
        nome: "Membro Colaborador",
        descricao: "Acesso básico para colaborador da atlética.",
        sys_role_escopo_id: sysRoleEscopoAtletica.id,
        ativo: 1,
    });

    /**
     * SYS - Vincular permissões às roles principais
     */
    const todasPermissoes = await prisma.sysPermission.findMany({
        where: { ativo: 1 },
    });

    for (const permission of todasPermissoes) {
        await prisma.sysRolePermission.upsert({
            where: {
                sys_role_id_sys_permission_id: {
                    sys_role_id: roleAdminGlobal.id,
                    sys_permission_id: permission.id,
                },
            },
            update: {
                ativo: 1,
                updated_at: now(),
            },
            create: {
                sys_role_id: roleAdminGlobal.id,
                sys_permission_id: permission.id,
                ativo: 1,
                created_at: now(),
                updated_at: now(),
            },
        });

        await prisma.sysRolePermission.upsert({
            where: {
                sys_role_id_sys_permission_id: {
                    sys_role_id: roleAdminAtletica.id,
                    sys_permission_id: permission.id,
                },
            },
            update: {
                ativo: 1,
                updated_at: now(),
            },
            create: {
                sys_role_id: roleAdminAtletica.id,
                sys_permission_id: permission.id,
                ativo: 1,
                created_at: now(),
                updated_at: now(),
            },
        });
    }

    const permissoesPresidenciaCodigos = [
        "atletica.visualizar",
        "atletica.editar",
        "tema.visualizar",
        "tema.editar",
        "membro.visualizar",
        "membro.criar",
        "membro.editar",
        "cargo.visualizar",
        "cargo.criar",
        "cargo.editar",
        "regimento.visualizar",
        "regimento.editar",
        "dashboard.visualizar",
    ];

    const permissoesPresidencia = await prisma.sysPermission.findMany({
        where: {
            codigo: {
                in: permissoesPresidenciaCodigos,
            },
        },
    });

    for (const permission of permissoesPresidencia) {
        await prisma.sysRolePermission.upsert({
            where: {
                sys_role_id_sys_permission_id: {
                    sys_role_id: rolePresidenciaAtletica.id,
                    sys_permission_id: permission.id,
                },
            },
            update: {
                ativo: 1,
                updated_at: now(),
            },
            create: {
                sys_role_id: rolePresidenciaAtletica.id,
                sys_permission_id: permission.id,
                ativo: 1,
                created_at: now(),
                updated_at: now(),
            },
        });
    }

    /**
     * SYS - Usuário dev inicial
     */
    const usuarioDevExistente = await prisma.sysUsuario.findUnique({
        where: { email: "admin@bravapass.dev" },
    });

    const usuarioDev =
        usuarioDevExistente ??
        (await prisma.sysUsuario.create({
            data: {
                nome: "Admin Dev",
                nickname: "admin_dev",
                email: "admin@bravapass.dev",
                senha_hash: gerarSenhaHashDev("admin123"),
                ativo: 1,
                created_at: now(),
                updated_at: now(),
            },
        }));


    await ensureBetterAuthUser({
        sysUsuarioId: usuarioDev.id,
        nome: usuarioDev.nome,
        email: usuarioDev.email,
        senha: "admin123",
    });
    /**
     * ATL - Cargos padrão
     */
    const cargosPadrao = [
        {
            codigo: "presidente",
            nome: "Presidente",
            descricao: "Responsável principal pela gestão e representação da atlética.",
        },
        {
            codigo: "vice_presidente",
            nome: "Vice-presidente",
            descricao: "Auxilia a presidência e substitui quando necessário.",
        },
        {
            codigo: "diretor_financeiro",
            nome: "Diretor financeiro",
            descricao: "Responsável pelo financeiro da atlética.",
        },
        {
            codigo: "diretor_marketing",
            nome: "Diretor de marketing",
            descricao: "Responsável pela comunicação, identidade e divulgação.",
        },
        {
            codigo: "diretor_eventos",
            nome: "Diretor de eventos",
            descricao: "Responsável pela organização de eventos.",
        },
        {
            codigo: "diretor_esportes",
            nome: "Diretor de esportes",
            descricao: "Responsável por equipes, treinos e competições.",
        },
        {
            codigo: "conselheiro",
            nome: "Conselheiro",
            descricao: "Pessoa vinculada ao conselho da atlética.",
        },
        {
            codigo: "colaborador",
            nome: "Colaborador",
            descricao: "Pessoa que auxilia a atlética em atividades gerais.",
        },
    ];

    const cargosCriados = [];

    for (const cargo of cargosPadrao) {
        const cargoExistente = await prisma.atlCargo.findFirst({
            where: {
                codigo: cargo.codigo,
                atl_atletica_id: null,
            },
        });

        if (cargoExistente) {
            cargosCriados.push(
                await prisma.atlCargo.update({
                    where: { id: cargoExistente.id },
                    data: {
                        nome: cargo.nome,
                        descricao: cargo.descricao,
                        atl_cargo_tipo_id: atlCargoTipoPadrao.id,
                        ativo: 1,
                        updated_at: now(),
                    },
                })
            );
        } else {
            cargosCriados.push(
                await prisma.atlCargo.create({
                    data: {
                        codigo: cargo.codigo,
                        nome: cargo.nome,
                        descricao: cargo.descricao,
                        atl_cargo_tipo_id: atlCargoTipoPadrao.id,
                        atl_atletica_id: null,
                        ativo: 1,
                        created_at: now(),
                        updated_at: now(),
                    },
                })
            );
        }
    }

    /**
     * EDU - Instituição inicial
     */
    let instituicao = await prisma.eduInstituicao.findFirst({
        where: { abreviacao: "UNIVALI" },
    });

    if (!instituicao) {
        instituicao = await prisma.eduInstituicao.create({
            data: {
                nome: "Universidade do Vale do Itajaí",
                abreviacao: "UNIVALI",
                cidade: "Itajaí",
                estado: "SC",
                ativo: 1,
                created_at: now(),
                updated_at: now(),
            },
        });
    }

    /**
     * EDU - Cursos iniciais
     */
    const cursosBase = [
        {
            nome: "Ciência da Computação",
            abreviacao: "CC",
            periodos: 8,
        },
        {
            nome: "Sistemas para Internet",
            abreviacao: "SISNET",
            periodos: 6,
        },
        {
            nome: "Análise e Desenvolvimento de Sistemas",
            abreviacao: "ADS",
            periodos: 6,
        },
        {
            nome: "Inteligência Artificial",
            abreviacao: "IA",
            periodos: 8,
        },
    ];

    const cursosCriados = [];

    for (const cursoBase of cursosBase) {
        let curso = await prisma.eduCurso.findFirst({
            where: { abreviacao: cursoBase.abreviacao },
        });

        if (!curso) {
            curso = await prisma.eduCurso.create({
                data: {
                    nome: cursoBase.nome,
                    abreviacao: cursoBase.abreviacao,
                    periodos: cursoBase.periodos,
                    ativo: 1,
                    created_at: now(),
                    updated_at: now(),
                },
            });
        }

        cursosCriados.push(curso);

        await prisma.eduInstituicaoCurso.upsert({
            where: {
                edu_instituicao_id_edu_curso_id: {
                    edu_instituicao_id: instituicao.id,
                    edu_curso_id: curso.id,
                },
            },
            update: {
                ativo: 1,
                updated_at: now(),
            },
            create: {
                edu_instituicao_id: instituicao.id,
                edu_curso_id: curso.id,
                ativo: 1,
                created_at: now(),
                updated_at: now(),
            },
        });
    }

    /**
     * ATL - Atlética inicial de teste
     */
    const atletica = await prisma.atlAtletica.upsert({
        where: { slug: "computaria" },
        update: {
            nome: "Associação Atlética Acadêmica dos Cursos de Computação",
            sigla: "AAACCU",
            mascote:'Alien',
            descricao: "Atlética acadêmica dos cursos de computação da UNIVALI.",
            edu_instituicao_id: instituicao.id,
            ativo: 1,
            updated_at: now(),
        },
        create: {
            edu_instituicao_id: instituicao.id,
            nome: "Associação Atlética Acadêmica dos Cursos de Computação",
            sigla: "AAACCU",
            mascote:'Alien',
            slug: "computaria",
            descricao: "Atlética acadêmica dos cursos de computação da UNIVALI.",
            ativo: 1,
            created_at: now(),
            updated_at: now(),
        },
    });

    /**
     * ATL - Vincular cursos à atlética
     */
    for (const [index, curso] of cursosCriados.entries()) {
        await prisma.atlAtleticaCurso.upsert({
            where: {
                atl_atletica_id_edu_curso_id: {
                    atl_atletica_id: atletica.id,
                    edu_curso_id: curso.id,
                },
            },
            update: {
                principal: index === 0 ? 1 : 0,
                ativo: 1,
                updated_at: now(),
            },
            create: {
                atl_atletica_id: atletica.id,
                edu_curso_id: curso.id,
                principal: index === 0 ? 1 : 0,
                ativo: 1,
                created_at: now(),
                updated_at: now(),
            },
        });
    }

    /**
     * ATL - Ativar cargos padrão para a atlética
     */
    for (const [index, cargo] of cargosCriados.entries()) {
        await prisma.atlAtleticaCargo.upsert({
            where: {
                atl_atletica_id_atl_cargo_id: {
                    atl_atletica_id: atletica.id,
                    atl_cargo_id: cargo.id,
                },
            },
            update: {
                ordem: index + 1,
                ativo: 1,
                updated_at: now(),
            },
            create: {
                atl_atletica_id: atletica.id,
                atl_cargo_id: cargo.id,
                ordem: index + 1,
                ativo: 1,
                created_at: now(),
                updated_at: now(),
            },
        });
    }

    /**
     * ATL - Tema inicial da atlética
     */
    await prisma.atlAtleticaTema.upsert({
        where: { atl_atletica_id: atletica.id },
        update: {
            cor_primaria: "#39FF14",
            cor_secundaria: "#131313",
            cor_fundo: "#FFFFFF",
            cor_texto: "#111111",
            ativo: 1,
            updated_at: now(),
        },
        create: {
            atl_atletica_id: atletica.id,
            cor_primaria: "#39FF14",
            cor_secundaria: "#131313",
            cor_fundo: "#FFFFFF",
            cor_texto: "#111111",
            ativo: 1,
            created_at: now(),
            updated_at: now(),
        },
    });

    /**
     * ATL - Regimento inicial
     */
    await prisma.atlAtleticaRegimento.upsert({
        where: {
            atl_atletica_id_versao: {
                atl_atletica_id: atletica.id,
                versao: "1.0",
            },
        },
        update: {
            titulo: "Regimento interno inicial",
            conteudo:
                "Regimento interno inicial criado para estruturação da atlética no Brava Pass.",
            ativo: 1,
            updated_at: now(),
        },
        create: {
            atl_atletica_id: atletica.id,
            titulo: "Regimento interno inicial",
            versao: "1.0",
            conteudo:
                "Regimento interno inicial criado para estruturação da atlética no Brava Pass.",
            ativo: 1,
            created_at: now(),
            updated_at: now(),
        },
    });

    /**
     * SYS - Plano DEV
     */
    const planoDev = await prisma.sysAssinaturaPlano.upsert({
        where: { codigo: "dev" },
        update: {
            nome: "Dev",
            descricao: "Plano de desenvolvimento para testes internos.",
            valor: 0,
            sys_assinatura_plano_periodicidade_id: periodicidadeDev.id,
            limite_membros: null,
            limite_eventos: null,
            ativo: 1,
            updated_at: now(),
        },
        create: {
            nome: "Dev",
            codigo: "dev",
            descricao: "Plano de desenvolvimento para testes internos.",
            valor: 0,
            sys_assinatura_plano_periodicidade_id: periodicidadeDev.id,
            limite_membros: null,
            limite_eventos: null,
            ativo: 1,
            created_at: now(),
            updated_at: now(),
        },
    });

    /**
     * ATL - Assinatura DEV da atlética
     */
    const assinaturaExistente = await prisma.atlAtleticaAssinatura.findFirst({
        where: {
            atl_atletica_id: atletica.id,
            sys_assinatura_plano_id: planoDev.id,
            deleted_at: null,
        },
    });

    if (assinaturaExistente) {
        await prisma.atlAtleticaAssinatura.update({
            where: { id: assinaturaExistente.id },
            data: {
                atl_atletica_assinatura_status_id: assinaturaStatusDev.id,
                ativo: 1,
                updated_at: now(),
            },
        });
    } else {
        await prisma.atlAtleticaAssinatura.create({
            data: {
                atl_atletica_id: atletica.id,
                sys_assinatura_plano_id: planoDev.id,
                atl_atletica_assinatura_status_id: assinaturaStatusDev.id,
                inicio_at: now(),
                observacao: "Assinatura DEV criada para testes iniciais.",
                ativo: 1,
                created_at: now(),
                updated_at: now(),
            },
        });
    }

    /**
     * ATL - Vincular usuário dev como membro da atlética
     */
    const membroDev = await prisma.atlAtleticaMembro.upsert({
        where: {
            atl_atletica_id_sys_usuario_id: {
                atl_atletica_id: atletica.id,
                sys_usuario_id: usuarioDev.id,
            },
        },
        update: {
            atl_atletica_membro_tipo_id: atlMembroTipoDiretor.id,
            atl_atletica_membro_status_id: atlMembroStatusAtivo.id,
            ativo: 1,
            updated_at: now(),
        },
        create: {
            atl_atletica_id: atletica.id,
            sys_usuario_id: usuarioDev.id,
            atl_atletica_membro_tipo_id: atlMembroTipoDiretor.id,
            atl_atletica_membro_status_id: atlMembroStatusAtivo.id,
            entrou_at: now(),
            ativo: 1,
            created_at: now(),
            updated_at: now(),
        },
    });

    /**
     * ATL - Dar cargo de presidente para usuário dev
     */
    const cargoPresidente = cargosCriados.find((cargo) => cargo.codigo === "presidente");

    if (cargoPresidente) {
        const cargoAtualExistente = await prisma.atlAtleticaMembroCargo.findFirst({
            where: {
                atl_atletica_membro_id: membroDev.id,
                atl_cargo_id: cargoPresidente.id,
                atual: 1,
                deleted_at: null,
            },
        });

        if (!cargoAtualExistente) {
            await prisma.atlAtleticaMembroCargo.create({
                data: {
                    atl_atletica_membro_id: membroDev.id,
                    atl_cargo_id: cargoPresidente.id,
                    inicio_at: now(),
                    atual: 1,
                    created_at: now(),
                    updated_at: now(),
                },
            });
        }
    }

    /**
     * SYS - Dar role admin da atlética para usuário dev
     */
    await prisma.sysUsuarioRole.upsert({
        where: {
            sys_usuario_id_sys_role_id_atl_atletica_id: {
                sys_usuario_id: usuarioDev.id,
                sys_role_id: roleAdminAtletica.id,
                atl_atletica_id: atletica.id,
            },
        },
        update: {
            ativo: 1,
            updated_at: now(),
        },
        create: {
            sys_usuario_id: usuarioDev.id,
            sys_role_id: roleAdminAtletica.id,
            atl_atletica_id: atletica.id,
            ativo: 1,
            created_at: now(),
            updated_at: now(),
        },
    });

    console.log("Seed executado com sucesso.");
    console.log("Usuário dev:");
    console.log("Email: admin@bravapass.dev");
    console.log("Nickname: admin_dev");
    console.log("Senha dev: admin123");
    console.log("Auth real criado no Better Auth.");
    console.log("Atenção: sys_usuario.senha_hash ainda é legado/dev e não será usado para login real.");

}

main()
    .catch((error) => {
        console.error("Erro ao executar seed:");
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });