import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { auth } from "@/lib/auth/auth";

const adapter = new PrismaMariaDb({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "userBravaPass",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "brava_pass_produtos_dev",
    connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

const now = () => new Date();

async function upsertByCodigo<T extends { id: number }>(
    model: {
        findUnique: (args: any) => Promise<T | null>;
        create: (args: any) => Promise<T>;
        update: (args: any) => Promise<T>;
    },
    codigo: string,
    data: Record<string, any>,
): Promise<T> {
    const existente = await model.findUnique({ where: { codigo } });

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
    const existente = await prisma.user.findUnique({
        where: { email: params.email },
    });

    if (existente) {
        await prisma.user.update({
            where: { id: existente.id },
            data: {
                name: params.nome,
                emailVerified: true,
                sysUsuarioId: params.sysUsuarioId,
                updatedAt: now(),
            },
        });

        return;
    }

    await auth.api.signUpEmail({
        body: {
            name: params.nome,
            email: params.email,
            password: params.senha,
            sysUsuarioId: params.sysUsuarioId,
        },
    });

    await prisma.user.update({
        where: { email: params.email },
        data: {
            emailVerified: true,
            sysUsuarioId: params.sysUsuarioId,
            updatedAt: now(),
        },
    });
}

async function main() {
    console.log("Iniciando seed do Brava Pass Produtos...");

    // =====================================================
    // SYS — TIPOS DE USUÁRIO
    // =====================================================

    const tipoAdmin = await upsertByCodigo(prisma.sysUsuarioTipo, "admin", {
        nome: "Administrador",
        descricao: "Administrador do sistema.",
        ativo: 1,
    });

    await upsertByCodigo(prisma.sysUsuarioTipo, "cliente", {
        nome: "Cliente",
        descricao: "Cliente da loja da AAACCU.",
        ativo: 1,
    });

    // =====================================================
    // PAR — TIPOS DE ACESSO DO PARCEIRO
    // =====================================================

    await upsertByCodigo(prisma.parParceiroUsuarioTipo, "proprietario", {
        nome: "Proprietário",
        descricao:
            "Responsável principal pelo parceiro e pela gestão de acessos.",
        ativo: 1,
    });

    await upsertByCodigo(prisma.parParceiroUsuarioTipo, "administrador", {
        nome: "Administrador",
        descricao:
            "Pode operar o parceiro e gerenciar membros comuns.",
        ativo: 1,
    });

    await upsertByCodigo(prisma.parParceiroUsuarioTipo, "membro", {
        nome: "Membro",
        descricao:
            "Pode acessar os recursos operacionais liberados para o parceiro.",
        ativo: 1,
    });


    // =====================================================
    // SYS — STORAGE
    // =====================================================

    await upsertByCodigo(prisma.sysArquivoDisco, "s3", {
        nome: "S3 / MinIO",
        ativo: 1,
    });

    await upsertByCodigo(prisma.sysArquivoVisibilidade, "public", {
        nome: "Público",
        ativo: 1,
    });

    await upsertByCodigo(prisma.sysArquivoVisibilidade, "private", {
        nome: "Privado",
        ativo: 1,
    });

    await upsertByCodigo(prisma.sysArquivoTipo, "avatar_usuario", {
        nome: "Avatar de usuário",
        ativo: 1,
    });

    await upsertByCodigo(prisma.sysArquivoTipo, "produto_imagem", {
        nome: "Imagem de produto",
        ativo: 1,
    });

    await upsertByCodigo(prisma.sysArquivoTipo, "evento_banner", {
        nome: "Banner de evento",
        ativo: 1,
    });

    await upsertByCodigo(prisma.sysArquivoTipo, "plano_socio_banner", {
        nome: "Banner de plano de sócio",
        ativo: 1,
    });

    await upsertByCodigo(prisma.sysArquivoTipo, "parceiro_logo", {
        nome: "Logo de parceiro",
        ativo: 1,
    });

    await upsertByCodigo(prisma.sysArquivoTipo, "parceiro_banner", {
        nome: "Banner de parceiro",
        ativo: 1,
    });

    await upsertByCodigo(prisma.sysArquivoTipo, "cardapio_item_imagem", {
        nome: "Imagem de item do cardápio",
        ativo: 1,
    });

    // =====================================================
    // PRD — TIPOS DE PRODUTO
    // =====================================================

    await upsertByCodigo(prisma.prdProdutoTipo, "fisico", {
        nome: "Produto físico",
        descricao: "Produto físico vendido pela AAACCU.",
        ativo: 1,
    });

    await upsertByCodigo(prisma.prdProdutoTipo, "ingresso", {
        nome: "Ingresso",
        descricao: "Ingresso ou acesso para evento.",
        ativo: 1,
    });

    await upsertByCodigo(prisma.prdProdutoTipo, "associacao", {
        nome: "Associação",
        descricao: "Produto que representa um plano de sócio.",
        ativo: 1,
    });

    // =====================================================
    // VND — CAMPANHAS
    // =====================================================

    const campanhaStatus = [
        ["rascunho", "Rascunho", "secondary", "file-edit"],
        ["agendada", "Agendada", "info", "calendar"],
        ["aberta", "Aberta", "success", "shopping-cart"],
        ["encerrada", "Encerrada", "secondary", "lock"],
        ["cancelada", "Cancelada", "danger", "x-circle"],
    ] as const;

    for (const [codigo, descricao, color, icon] of campanhaStatus) {
        await upsertByCodigo(prisma.vndCampanhaStatus, codigo, {
            descricao,
            color,
            icon,
            ativo: 1,
        });
    }

    // =====================================================
    // VND — PEDIDOS
    // =====================================================

    const pedidoStatus = [
        ["recebido", "Pedido recebido", "info", "clipboard-check"],
        ["aguardando_pagamento", "Aguardando pagamento", "warning", "clock"],
        ["confirmado", "Pedido confirmado", "success", "check-circle"],
        ["em_preparacao", "Em preparação", "info", "package"],
        ["pronto_retirada", "Pronto para retirada", "success", "package-check"],
        ["enviado", "Enviado", "info", "truck"],
        ["entregue", "Entregue", "success", "check-check"],
        ["cancelado", "Cancelado", "danger", "x-circle"],
    ] as const;

    for (const [codigo, descricao, color, icon] of pedidoStatus) {
        await upsertByCodigo(prisma.vndPedidoStatus, codigo, {
            descricao,
            color,
            icon,
            ativo: 1,
        });
    }

    await upsertByCodigo(prisma.vndEntregaTipo, "retirada", {
        descricao: "Retirada com a Atlética",
        ativo: 1,
    });

    await upsertByCodigo(prisma.vndEntregaTipo, "entrega", {
        descricao: "Entrega",
        ativo: 1,
    });

    // =====================================================
    // SOC — SÓCIOS
    // =====================================================

    const socioStatus = [
        ["pendente", "Pendente", "warning", "clock"],
        ["ativo", "Ativo", "success", "check-circle"],
        ["expirado", "Expirado", "secondary", "clock-alert"],
        ["cancelado", "Cancelado", "danger", "x-circle"],
        ["bloqueado", "Bloqueado", "danger", "ban"],
    ] as const;

    for (const [codigo, descricao, color, icon] of socioStatus) {
        await upsertByCodigo(prisma.socSocioStatus, codigo, {
            descricao,
            color,
            icon,
            ativo: 1,
        });
    }

    await upsertByCodigo(prisma.socSocioOrigem, "compra", {
        descricao: "Compra realizada pelo sistema",
        ativo: 1,
    });

    await upsertByCodigo(prisma.socSocioOrigem, "manual", {
        descricao: "Cadastro manual pelo administrador",
        ativo: 1,
    });

    await upsertByCodigo(prisma.socSocioOrigem, "importacao", {
        descricao: "Importação de associação existente",
        ativo: 1,
    });

    // =====================================================
    // FIN — PAGAMENTOS
    // =====================================================

    const pagamentoStatus = [
        ["pendente", "Pendente", "warning", "clock"],
        ["aprovado", "Aprovado", "success", "check-circle"],
        ["recusado", "Recusado", "danger", "x-circle"],
        ["cancelado", "Cancelado", "secondary", "ban"],
        ["estornado", "Estornado", "warning", "rotate-ccw"],
        ["expirado", "Expirado", "secondary", "clock-alert"],
    ] as const;

    for (const [codigo, descricao, color, icon] of pagamentoStatus) {
        await upsertByCodigo(prisma.finPagamentoStatus, codigo, {
            descricao,
            color,
            icon,
            ativo: 1,
        });
    }

    await upsertByCodigo(prisma.finPagamentoMetodo, "pix_manual", {
        descricao: "PIX confirmado manualmente",
        ativo: 1,
    });

    await upsertByCodigo(prisma.finPagamentoMetodo, "pix", {
        descricao: "PIX",
        ativo: 1,
    });

    await upsertByCodigo(prisma.finPagamentoMetodo, "cartao", {
        descricao: "Cartão",
        ativo: 1,
    });

    await upsertByCodigo(prisma.finPagamentoMetodo, "dinheiro", {
        descricao: "Dinheiro",
        ativo: 1,
    });

    // =====================================================
    // SYS — ADMIN DEV
    // =====================================================

    const emailAdmin = "admin@bravapass.dev";

    let usuarioAdmin = await prisma.sysUsuario.findUnique({
        where: { email: emailAdmin },
    });

    if (!usuarioAdmin) {
        usuarioAdmin = await prisma.sysUsuario.create({
            data: {
                sys_usuario_tipo_id: tipoAdmin.id,
                nome: "Admin Dev",
                nickname: "admin_dev",
                email: emailAdmin,
                ativo: 1,
                perfil_completo: 1,
                email_verificado_at: now(),
                created_at: now(),
                updated_at: now(),
            },
        });
    } else {
        usuarioAdmin = await prisma.sysUsuario.update({
            where: { id: usuarioAdmin.id },
            data: {
                sys_usuario_tipo_id: tipoAdmin.id,
                ativo: 1,
                updated_at: now(),
            },
        });
    }

    await ensureBetterAuthUser({
        sysUsuarioId: usuarioAdmin.id,
        nome: usuarioAdmin.nome,
        email: usuarioAdmin.email,
        senha: "admin123",
    });

    console.log("Seed do Brava Pass Produtos concluído.");
    console.log(`Admin: ${emailAdmin}`);
}

main()
    .catch((error) => {
        console.error("[seed] Falha ao executar seed:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
