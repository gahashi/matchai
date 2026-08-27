-- CreateTable
CREATE TABLE `sys_usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(150) NOT NULL,
    `nickname` VARCHAR(50) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `telefone` VARCHAR(30) NULL,
    `senha_hash` VARCHAR(255) NULL,
    `codigo_aluno` VARCHAR(50) NULL,
    `documento` VARCHAR(30) NULL,
    `avatar_sys_arquivo_id` INTEGER NULL,
    `avatar_file_key` VARCHAR(500) NULL,
    `avatar_url` VARCHAR(1000) NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `perfil_completo` INTEGER NOT NULL DEFAULT 0,
    `email_verificado_at` DATETIME(0) NULL,
    `ultimo_login_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    UNIQUE INDEX `sys_usuario_nickname_key`(`nickname`),
    UNIQUE INDEX `sys_usuario_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_role_escopo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(100) NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `descricao` TEXT NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `sys_role_escopo_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_role` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(100) NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `descricao` TEXT NULL,
    `sys_role_escopo_id` INTEGER NOT NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    UNIQUE INDEX `sys_role_codigo_key`(`codigo`),
    INDEX `sys_role_fk1`(`sys_role_escopo_id`),
    INDEX `sys_role_ativo_idx`(`ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_permission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(100) NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `descricao` TEXT NULL,
    `modulo` VARCHAR(100) NOT NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `sys_permission_codigo_key`(`codigo`),
    INDEX `sys_permission_ativo_idx`(`ativo`),
    INDEX `sys_permission_modulo_idx`(`modulo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_role_permission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sys_role_id` INTEGER NOT NULL,
    `sys_permission_id` INTEGER NOT NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    INDEX `sys_role_permission_fk1`(`sys_role_id`),
    INDEX `sys_role_permission_fk2`(`sys_permission_id`),
    UNIQUE INDEX `uk_sys_role_permission`(`sys_role_id`, `sys_permission_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_usuario_role` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sys_usuario_id` INTEGER NOT NULL,
    `sys_role_id` INTEGER NOT NULL,
    `ent_entidade_id` INTEGER NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `sys_usuario_role_fk1`(`sys_usuario_id`),
    INDEX `sys_usuario_role_fk2`(`sys_role_id`),
    INDEX `sys_usuario_role_fk3`(`ent_entidade_id`),
    UNIQUE INDEX `uk_sys_usuario_role_contexto`(`sys_usuario_id`, `sys_role_id`, `ent_entidade_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_usuario_permission_tipo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(100) NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `descricao` TEXT NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `sys_usuario_permission_tipo_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_usuario_permission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sys_usuario_id` INTEGER NOT NULL,
    `sys_permission_id` INTEGER NOT NULL,
    `sys_usuario_permission_tipo_id` INTEGER NOT NULL,
    `ent_entidade_id` INTEGER NULL,
    `motivo` VARCHAR(255) NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `sys_usuario_permission_fk1`(`sys_usuario_id`),
    INDEX `sys_usuario_permission_fk2`(`sys_permission_id`),
    INDEX `sys_usuario_permission_fk3`(`sys_usuario_permission_tipo_id`),
    INDEX `sys_usuario_permission_fk4`(`ent_entidade_id`),
    UNIQUE INDEX `uk_sys_usuario_permission_contexto`(`sys_usuario_id`, `sys_permission_id`, `ent_entidade_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `edu_instituicao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(150) NOT NULL,
    `abreviacao` VARCHAR(30) NOT NULL,
    `cidade` VARCHAR(100) NULL,
    `estado` VARCHAR(2) NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `edu_instituicao_abreviacao_idx`(`abreviacao`),
    INDEX `edu_instituicao_ativo_idx`(`ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `edu_curso` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(150) NOT NULL,
    `abreviacao` VARCHAR(30) NOT NULL,
    `periodos` INTEGER NULL,
    `fundado_at` DATE NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `edu_curso_abreviacao_idx`(`abreviacao`),
    INDEX `edu_curso_ativo_idx`(`ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `edu_instituicao_curso` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `edu_instituicao_id` INTEGER NOT NULL,
    `edu_curso_id` INTEGER NOT NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `edu_instituicao_curso_fk1`(`edu_instituicao_id`),
    INDEX `edu_instituicao_curso_fk2`(`edu_curso_id`),
    UNIQUE INDEX `uk_edu_instituicao_curso`(`edu_instituicao_id`, `edu_curso_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `edu_polo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `edu_instituicao_id` INTEGER NOT NULL,
    `codigo` VARCHAR(100) NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `cidade` VARCHAR(100) NULL,
    `estado` VARCHAR(2) NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `edu_polo_fk1`(`edu_instituicao_id`),
    INDEX `edu_polo_ativo_idx`(`ativo`),
    UNIQUE INDEX `uk_edu_polo_instituicao_codigo`(`edu_instituicao_id`, `codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_usuario_polo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sys_usuario_id` INTEGER NOT NULL,
    `edu_polo_id` INTEGER NOT NULL,
    `principal` INTEGER NOT NULL DEFAULT 0,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `sys_usuario_polo_fk1`(`sys_usuario_id`),
    INDEX `sys_usuario_polo_fk2`(`edu_polo_id`),
    INDEX `sys_usuario_polo_principal_idx`(`principal`),
    UNIQUE INDEX `uk_sys_usuario_polo`(`sys_usuario_id`, `edu_polo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ent_entidade_tipo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(100) NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `descricao` TEXT NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `ent_entidade_tipo_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ent_entidade_status` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(100) NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `descricao` TEXT NULL,
    `color` VARCHAR(50) NULL,
    `icon` VARCHAR(100) NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `ent_entidade_status_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ent_entidade` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ent_entidade_tipo_id` INTEGER NOT NULL,
    `ent_entidade_status_id` INTEGER NOT NULL,
    `edu_instituicao_id` INTEGER NOT NULL,
    `criado_por_sys_usuario_id` INTEGER NULL,
    `nome` VARCHAR(150) NOT NULL,
    `apelido` VARCHAR(120) NULL,
    `sigla` VARCHAR(30) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `mascote` VARCHAR(100) NOT NULL,
    `descricao` TEXT NULL,
    `fundado_at` DATE NULL,
    `logo_url` VARCHAR(255) NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    UNIQUE INDEX `ent_entidade_slug_key`(`slug`),
    INDEX `ent_entidade_fk1`(`ent_entidade_tipo_id`),
    INDEX `ent_entidade_fk2`(`ent_entidade_status_id`),
    INDEX `ent_entidade_fk3`(`edu_instituicao_id`),
    INDEX `ent_entidade_fk4`(`criado_por_sys_usuario_id`),
    INDEX `ent_entidade_ativo_idx`(`ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ent_entidade_curso` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ent_entidade_id` INTEGER NOT NULL,
    `edu_curso_id` INTEGER NOT NULL,
    `principal` INTEGER NOT NULL DEFAULT 0,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `ent_entidade_curso_fk1`(`ent_entidade_id`),
    INDEX `ent_entidade_curso_fk2`(`edu_curso_id`),
    UNIQUE INDEX `uk_ent_entidade_curso`(`ent_entidade_id`, `edu_curso_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ent_entidade_polo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ent_entidade_id` INTEGER NOT NULL,
    `edu_polo_id` INTEGER NOT NULL,
    `principal` INTEGER NOT NULL DEFAULT 0,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `ent_entidade_polo_fk1`(`ent_entidade_id`),
    INDEX `ent_entidade_polo_fk2`(`edu_polo_id`),
    INDEX `ent_entidade_polo_principal_idx`(`principal`),
    UNIQUE INDEX `uk_ent_entidade_polo`(`ent_entidade_id`, `edu_polo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ent_entidade_gestao_status` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(100) NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `descricao` TEXT NULL,
    `color` VARCHAR(50) NULL,
    `icon` VARCHAR(100) NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `ent_entidade_gestao_status_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ent_entidade_gestao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ent_entidade_id` INTEGER NOT NULL,
    `ent_entidade_gestao_status_id` INTEGER NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `inicio_at` DATE NULL,
    `fim_at` DATE NULL,
    `observacao` TEXT NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `ent_entidade_gestao_fk1`(`ent_entidade_id`),
    INDEX `ent_entidade_gestao_fk2`(`ent_entidade_gestao_status_id`),
    INDEX `ent_entidade_gestao_ativo_idx`(`ativo`),
    UNIQUE INDEX `uk_ent_entidade_gestao_nome`(`ent_entidade_id`, `nome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ent_cargo_tipo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(100) NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `descricao` TEXT NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `ent_cargo_tipo_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ent_cargo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `codigo` VARCHAR(100) NOT NULL,
    `descricao` VARCHAR(255) NULL,
    `ent_cargo_tipo_id` INTEGER NOT NULL,
    `ent_entidade_id` INTEGER NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `ent_cargo_fk1`(`ent_cargo_tipo_id`),
    INDEX `ent_cargo_fk2`(`ent_entidade_id`),
    INDEX `ent_cargo_ativo_idx`(`ativo`),
    UNIQUE INDEX `uk_ent_cargo_codigo_contexto`(`codigo`, `ent_entidade_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ent_entidade_cargo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ent_entidade_id` INTEGER NOT NULL,
    `ent_cargo_id` INTEGER NOT NULL,
    `nome_exibicao` VARCHAR(100) NULL,
    `descricao_customizada` VARCHAR(255) NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `ent_entidade_cargo_fk1`(`ent_entidade_id`),
    INDEX `ent_entidade_cargo_fk2`(`ent_cargo_id`),
    INDEX `ent_entidade_cargo_ordem_idx`(`ordem`),
    UNIQUE INDEX `uk_ent_entidade_cargo`(`ent_entidade_id`, `ent_cargo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ent_entidade_membro_tipo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(100) NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `descricao` TEXT NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `ent_entidade_membro_tipo_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ent_entidade_membro_status` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(100) NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `color` VARCHAR(50) NULL,
    `icon` VARCHAR(100) NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `ent_entidade_membro_status_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ent_entidade_membro` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ent_entidade_id` INTEGER NOT NULL,
    `sys_usuario_id` INTEGER NOT NULL,
    `ent_entidade_membro_tipo_id` INTEGER NOT NULL,
    `ent_entidade_membro_status_id` INTEGER NOT NULL,
    `entrou_at` DATE NULL,
    `saiu_at` DATE NULL,
    `observacao` TEXT NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `ent_entidade_membro_fk1`(`ent_entidade_id`),
    INDEX `ent_entidade_membro_fk2`(`sys_usuario_id`),
    INDEX `ent_entidade_membro_fk3`(`ent_entidade_membro_tipo_id`),
    INDEX `ent_entidade_membro_fk4`(`ent_entidade_membro_status_id`),
    UNIQUE INDEX `uk_ent_entidade_membro`(`ent_entidade_id`, `sys_usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ent_entidade_membro_cargo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ent_entidade_membro_id` INTEGER NOT NULL,
    `ent_cargo_id` INTEGER NOT NULL,
    `inicio_at` DATE NOT NULL,
    `fim_at` DATE NULL,
    `atual` INTEGER NOT NULL DEFAULT 1,
    `observacao` TEXT NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `ent_entidade_membro_cargo_fk1`(`ent_entidade_membro_id`),
    INDEX `ent_entidade_membro_cargo_fk2`(`ent_cargo_id`),
    INDEX `ent_entidade_membro_cargo_atual_idx`(`atual`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ent_entidade_tema` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ent_entidade_id` INTEGER NOT NULL,
    `cor_primaria` VARCHAR(20) NOT NULL,
    `cor_secundaria` VARCHAR(20) NOT NULL,
    `cor_fundo` VARCHAR(20) NULL,
    `cor_texto` VARCHAR(20) NULL,
    `logo_url` VARCHAR(255) NULL,
    `banner_url` VARCHAR(255) NULL,
    `custom_css` TEXT NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `ent_entidade_tema_ent_entidade_id_key`(`ent_entidade_id`),
    INDEX `ent_entidade_tema_fk1`(`ent_entidade_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ent_entidade_regimento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ent_entidade_id` INTEGER NOT NULL,
    `titulo` VARCHAR(150) NOT NULL,
    `versao` VARCHAR(30) NOT NULL,
    `conteudo` TEXT NOT NULL,
    `arquivo_url` VARCHAR(255) NULL,
    `aprovado_at` DATE NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `ent_entidade_regimento_fk1`(`ent_entidade_id`),
    UNIQUE INDEX `uk_ent_entidade_regimento_versao`(`ent_entidade_id`, `versao`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_assinatura_plano_periodicidade` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(100) NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `descricao` TEXT NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `sys_assinatura_plano_periodicidade_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_assinatura_plano` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `codigo` VARCHAR(100) NOT NULL,
    `descricao` TEXT NULL,
    `valor` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `sys_assinatura_plano_periodicidade_id` INTEGER NOT NULL,
    `limite_membros` INTEGER NULL,
    `limite_eventos` INTEGER NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    UNIQUE INDEX `sys_assinatura_plano_codigo_key`(`codigo`),
    INDEX `sys_assinatura_plano_fk1`(`sys_assinatura_plano_periodicidade_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ent_entidade_assinatura_status` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(100) NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `color` VARCHAR(50) NULL,
    `icon` VARCHAR(100) NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `ent_entidade_assinatura_status_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ent_entidade_assinatura` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ent_entidade_id` INTEGER NOT NULL,
    `sys_assinatura_plano_id` INTEGER NOT NULL,
    `ent_entidade_assinatura_status_id` INTEGER NOT NULL,
    `inicio_at` DATE NOT NULL,
    `fim_at` DATE NULL,
    `observacao` TEXT NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `ent_entidade_assinatura_fk1`(`ent_entidade_id`),
    INDEX `ent_entidade_assinatura_fk2`(`sys_assinatura_plano_id`),
    INDEX `ent_entidade_assinatura_fk3`(`ent_entidade_assinatura_status_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_auth_user` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    `image` VARCHAR(255) NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL,
    `sys_usuario_id` INTEGER NOT NULL,

    UNIQUE INDEX `sys_auth_user_email_key`(`email`),
    UNIQUE INDEX `sys_auth_user_sys_usuario_id_key`(`sys_usuario_id`),
    INDEX `sys_auth_user_fk1`(`sys_usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_auth_session` (
    `id` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(0) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL,
    `ipAddress` VARCHAR(45) NULL,
    `userAgent` TEXT NULL,
    `user_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `sys_auth_session_token_key`(`token`),
    INDEX `sys_auth_session_fk1`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_auth_account` (
    `id` VARCHAR(191) NOT NULL,
    `account_id` VARCHAR(191) NOT NULL,
    `provider_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `access_token` TEXT NULL,
    `refresh_token` TEXT NULL,
    `id_token` TEXT NULL,
    `access_token_expires_at` DATETIME(0) NULL,
    `refresh_token_expires_at` DATETIME(0) NULL,
    `scope` TEXT NULL,
    `password` TEXT NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL,

    INDEX `sys_auth_account_fk1`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_auth_verification` (
    `id` VARCHAR(191) NOT NULL,
    `identifier` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `expiresAt` DATETIME(0) NOT NULL,
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NULL,

    INDEX `sys_auth_verification_identifier_idx`(`identifier`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_email_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sys_usuario_id` INTEGER NULL,
    `email_to` VARCHAR(180) NOT NULL,
    `email_from` VARCHAR(180) NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `template` VARCHAR(100) NULL,
    `provider` VARCHAR(50) NOT NULL DEFAULT 'smtp',
    `status` VARCHAR(50) NOT NULL DEFAULT 'sent',
    `message_id` VARCHAR(255) NULL,
    `error_message` TEXT NULL,
    `metadata_text` TEXT NULL,
    `sent_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    INDEX `sys_email_log_fk1`(`sys_usuario_id`),
    INDEX `sys_email_log_email_to_idx`(`email_to`),
    INDEX `sys_email_log_status_idx`(`status`),
    INDEX `sys_email_log_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_email_verification_code` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sys_usuario_id` INTEGER NULL,
    `email` VARCHAR(180) NOT NULL,
    `tipo` VARCHAR(80) NOT NULL DEFAULT 'email_verification',
    `codigo_hash` VARCHAR(255) NOT NULL,
    `tentativas` INTEGER NOT NULL DEFAULT 0,
    `max_tentativas` INTEGER NOT NULL DEFAULT 5,
    `expires_at` DATETIME(0) NOT NULL,
    `used_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `sys_email_verification_code_fk1`(`sys_usuario_id`),
    INDEX `sys_email_verification_code_email_idx`(`email`),
    INDEX `sys_email_verification_code_tipo_idx`(`tipo`),
    INDEX `sys_email_verification_code_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_auth_login_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sys_usuario_id` INTEGER NULL,
    `email` VARCHAR(150) NULL,
    `evento` VARCHAR(80) NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `device_text` VARCHAR(255) NULL,
    `location_text` VARCHAR(255) NULL,
    `error_message` TEXT NULL,
    `metadata_text` TEXT NULL,
    `created_at` DATETIME(0) NULL,

    INDEX `sys_auth_login_log_fk1`(`sys_usuario_id`),
    INDEX `sys_auth_login_log_email_idx`(`email`),
    INDEX `sys_auth_login_log_evento_idx`(`evento`),
    INDEX `sys_auth_login_log_status_idx`(`status`),
    INDEX `sys_auth_login_log_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_arquivo_disco` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(40) NOT NULL,
    `nome` VARCHAR(80) NOT NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `sys_arquivo_disco_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_arquivo_visibilidade` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(40) NOT NULL,
    `nome` VARCHAR(80) NOT NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `sys_arquivo_visibilidade_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_arquivo_tipo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(60) NOT NULL,
    `nome` VARCHAR(120) NOT NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `sys_arquivo_tipo_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_arquivo_entidade_tipo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(60) NOT NULL,
    `nome` VARCHAR(120) NOT NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `sys_arquivo_entidade_tipo_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_arquivo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sys_arquivo_disco_id` INTEGER NOT NULL,
    `sys_arquivo_visibilidade_id` INTEGER NOT NULL,
    `sys_arquivo_tipo_id` INTEGER NULL,
    `sys_arquivo_entidade_tipo_id` INTEGER NULL,
    `entidade_id` INTEGER NULL,
    `bucket` VARCHAR(120) NULL,
    `file_key` VARCHAR(500) NOT NULL,
    `public_url` VARCHAR(1000) NULL,
    `original_name` VARCHAR(255) NOT NULL,
    `mime_type` VARCHAR(120) NOT NULL,
    `size_bytes` INTEGER NOT NULL,
    `content_hash` VARCHAR(128) NULL,
    `created_by_usuario_id` INTEGER NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,
    `storage_deleted_at` DATETIME(0) NULL,

    INDEX `sys_arquivo_sys_arquivo_disco_id_idx`(`sys_arquivo_disco_id`),
    INDEX `sys_arquivo_sys_arquivo_visibilidade_id_idx`(`sys_arquivo_visibilidade_id`),
    INDEX `sys_arquivo_sys_arquivo_tipo_id_idx`(`sys_arquivo_tipo_id`),
    INDEX `sys_arquivo_sys_arquivo_entidade_tipo_id_entidade_id_idx`(`sys_arquivo_entidade_tipo_id`, `entidade_id`),
    INDEX `sys_arquivo_file_key_idx`(`file_key`),
    INDEX `sys_arquivo_content_hash_idx`(`content_hash`),
    INDEX `sys_arquivo_created_by_usuario_id_idx`(`created_by_usuario_id`),
    INDEX `sys_arquivo_deleted_at_idx`(`deleted_at`),
    INDEX `sys_arquivo_storage_deleted_at_idx`(`storage_deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_inbox_item_tipo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(60) NOT NULL,
    `nome` VARCHAR(120) NOT NULL,
    `descricao` TEXT NULL,
    `color` VARCHAR(40) NULL,
    `icon` VARCHAR(80) NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `sys_inbox_item_tipo_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_inbox_item_status` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(60) NOT NULL,
    `nome` VARCHAR(120) NOT NULL,
    `descricao` TEXT NULL,
    `color` VARCHAR(40) NULL,
    `icon` VARCHAR(80) NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `sys_inbox_item_status_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_inbox_item` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sys_usuario_id` INTEGER NOT NULL,
    `sys_inbox_item_tipo_id` INTEGER NOT NULL,
    `sys_inbox_item_status_id` INTEGER NOT NULL,
    `titulo` VARCHAR(180) NOT NULL,
    `mensagem` TEXT NOT NULL,
    `action_url` VARCHAR(1000) NULL,
    `entidade_tipo` VARCHAR(80) NULL,
    `entidade_id` INTEGER NULL,
    `metadata_text` TEXT NULL,
    `read_at` DATETIME(0) NULL,
    `archived_at` DATETIME(0) NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `sys_inbox_item_sys_usuario_id_idx`(`sys_usuario_id`),
    INDEX `sys_inbox_item_sys_inbox_item_tipo_id_idx`(`sys_inbox_item_tipo_id`),
    INDEX `sys_inbox_item_sys_inbox_item_status_id_idx`(`sys_inbox_item_status_id`),
    INDEX `sys_inbox_item_entidade_tipo_entidade_id_idx`(`entidade_tipo`, `entidade_id`),
    INDEX `sys_inbox_item_read_at_idx`(`read_at`),
    INDEX `sys_inbox_item_archived_at_idx`(`archived_at`),
    INDEX `sys_inbox_item_created_at_idx`(`created_at`),
    INDEX `sys_inbox_item_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_solicitacao_tipo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(100) NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `descricao` TEXT NULL,
    `color` VARCHAR(50) NULL,
    `icon` VARCHAR(100) NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `sys_solicitacao_tipo_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_solicitacao_status` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(100) NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `descricao` TEXT NULL,
    `color` VARCHAR(50) NULL,
    `icon` VARCHAR(100) NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `sys_solicitacao_status_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_solicitacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sys_solicitacao_tipo_id` INTEGER NOT NULL,
    `sys_solicitacao_status_id` INTEGER NOT NULL,
    `solicitado_por_usuario_id` INTEGER NOT NULL,
    `responsavel_sys_usuario_id` INTEGER NULL,
    `edu_instituicao_id` INTEGER NULL,
    `edu_polo_id` INTEGER NULL,
    `ent_entidade_id` INTEGER NULL,
    `titulo` VARCHAR(180) NOT NULL,
    `descricao` TEXT NULL,
    `entidade_tipo` VARCHAR(100) NULL,
    `entidade_id` INTEGER NULL,
    `payload_text` LONGTEXT NULL,
    `metadata_text` LONGTEXT NULL,
    `enviado_at` DATETIME(0) NULL,
    `finalizado_at` DATETIME(0) NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `sys_solicitacao_fk1`(`sys_solicitacao_tipo_id`),
    INDEX `sys_solicitacao_fk2`(`sys_solicitacao_status_id`),
    INDEX `sys_solicitacao_fk3`(`solicitado_por_usuario_id`),
    INDEX `sys_solicitacao_fk4`(`responsavel_sys_usuario_id`),
    INDEX `sys_solicitacao_fk5`(`edu_instituicao_id`),
    INDEX `sys_solicitacao_fk6`(`edu_polo_id`),
    INDEX `sys_solicitacao_fk7`(`ent_entidade_id`),
    INDEX `sys_solicitacao_entidade_idx`(`entidade_tipo`, `entidade_id`),
    INDEX `sys_solicitacao_ativo_idx`(`ativo`),
    INDEX `sys_solicitacao_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_solicitacao_historico` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sys_solicitacao_id` INTEGER NOT NULL,
    `sys_usuario_id` INTEGER NULL,
    `sys_solicitacao_status_anterior_id` INTEGER NULL,
    `sys_solicitacao_status_novo_id` INTEGER NULL,
    `acao` VARCHAR(100) NOT NULL,
    `descricao` TEXT NULL,
    `metadata_text` LONGTEXT NULL,
    `created_at` DATETIME(0) NULL,

    INDEX `sys_solicitacao_historico_fk1`(`sys_solicitacao_id`),
    INDEX `sys_solicitacao_historico_fk2`(`sys_usuario_id`),
    INDEX `sys_solicitacao_historico_fk3`(`sys_solicitacao_status_anterior_id`),
    INDEX `sys_solicitacao_historico_fk4`(`sys_solicitacao_status_novo_id`),
    INDEX `sys_solicitacao_historico_acao_idx`(`acao`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_solicitacao_documento_tipo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(100) NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `descricao` TEXT NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `sys_solicitacao_documento_tipo_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_solicitacao_documento_status` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(100) NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `descricao` TEXT NULL,
    `color` VARCHAR(50) NULL,
    `icon` VARCHAR(100) NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `sys_solicitacao_documento_status_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_solicitacao_documento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sys_solicitacao_id` INTEGER NOT NULL,
    `sys_solicitacao_documento_tipo_id` INTEGER NOT NULL,
    `sys_solicitacao_documento_status_id` INTEGER NOT NULL,
    `sys_arquivo_id` INTEGER NULL,
    `titulo` VARCHAR(180) NULL,
    `descricao` TEXT NULL,
    `observacao` TEXT NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `sys_solicitacao_documento_fk1`(`sys_solicitacao_id`),
    INDEX `sys_solicitacao_documento_fk2`(`sys_solicitacao_documento_tipo_id`),
    INDEX `sys_solicitacao_documento_fk3`(`sys_solicitacao_documento_status_id`),
    INDEX `sys_solicitacao_documento_fk4`(`sys_arquivo_id`),
    INDEX `sys_solicitacao_documento_ativo_idx`(`ativo`),
    INDEX `sys_solicitacao_documento_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sys_role` ADD CONSTRAINT `sys_role_sys_role_escopo_id_fkey` FOREIGN KEY (`sys_role_escopo_id`) REFERENCES `sys_role_escopo`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_role_permission` ADD CONSTRAINT `sys_role_permission_sys_role_id_fkey` FOREIGN KEY (`sys_role_id`) REFERENCES `sys_role`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_role_permission` ADD CONSTRAINT `sys_role_permission_sys_permission_id_fkey` FOREIGN KEY (`sys_permission_id`) REFERENCES `sys_permission`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_usuario_role` ADD CONSTRAINT `sys_usuario_role_sys_usuario_id_fkey` FOREIGN KEY (`sys_usuario_id`) REFERENCES `sys_usuario`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_usuario_role` ADD CONSTRAINT `sys_usuario_role_sys_role_id_fkey` FOREIGN KEY (`sys_role_id`) REFERENCES `sys_role`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_usuario_role` ADD CONSTRAINT `sys_usuario_role_ent_entidade_id_fkey` FOREIGN KEY (`ent_entidade_id`) REFERENCES `ent_entidade`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_usuario_permission` ADD CONSTRAINT `sys_usuario_permission_sys_usuario_id_fkey` FOREIGN KEY (`sys_usuario_id`) REFERENCES `sys_usuario`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_usuario_permission` ADD CONSTRAINT `sys_usuario_permission_sys_permission_id_fkey` FOREIGN KEY (`sys_permission_id`) REFERENCES `sys_permission`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_usuario_permission` ADD CONSTRAINT `sys_usuario_permission_sys_usuario_permission_tipo_id_fkey` FOREIGN KEY (`sys_usuario_permission_tipo_id`) REFERENCES `sys_usuario_permission_tipo`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_usuario_permission` ADD CONSTRAINT `sys_usuario_permission_ent_entidade_id_fkey` FOREIGN KEY (`ent_entidade_id`) REFERENCES `ent_entidade`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `edu_instituicao_curso` ADD CONSTRAINT `edu_instituicao_curso_edu_instituicao_id_fkey` FOREIGN KEY (`edu_instituicao_id`) REFERENCES `edu_instituicao`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `edu_instituicao_curso` ADD CONSTRAINT `edu_instituicao_curso_edu_curso_id_fkey` FOREIGN KEY (`edu_curso_id`) REFERENCES `edu_curso`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `edu_polo` ADD CONSTRAINT `edu_polo_edu_instituicao_id_fkey` FOREIGN KEY (`edu_instituicao_id`) REFERENCES `edu_instituicao`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_usuario_polo` ADD CONSTRAINT `sys_usuario_polo_sys_usuario_id_fkey` FOREIGN KEY (`sys_usuario_id`) REFERENCES `sys_usuario`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_usuario_polo` ADD CONSTRAINT `sys_usuario_polo_edu_polo_id_fkey` FOREIGN KEY (`edu_polo_id`) REFERENCES `edu_polo`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ent_entidade` ADD CONSTRAINT `ent_entidade_ent_entidade_tipo_id_fkey` FOREIGN KEY (`ent_entidade_tipo_id`) REFERENCES `ent_entidade_tipo`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ent_entidade` ADD CONSTRAINT `ent_entidade_ent_entidade_status_id_fkey` FOREIGN KEY (`ent_entidade_status_id`) REFERENCES `ent_entidade_status`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ent_entidade` ADD CONSTRAINT `ent_entidade_criado_por_sys_usuario_id_fkey` FOREIGN KEY (`criado_por_sys_usuario_id`) REFERENCES `sys_usuario`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ent_entidade` ADD CONSTRAINT `ent_entidade_edu_instituicao_id_fkey` FOREIGN KEY (`edu_instituicao_id`) REFERENCES `edu_instituicao`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ent_entidade_curso` ADD CONSTRAINT `ent_entidade_curso_ent_entidade_id_fkey` FOREIGN KEY (`ent_entidade_id`) REFERENCES `ent_entidade`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ent_entidade_curso` ADD CONSTRAINT `ent_entidade_curso_edu_curso_id_fkey` FOREIGN KEY (`edu_curso_id`) REFERENCES `edu_curso`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ent_entidade_polo` ADD CONSTRAINT `ent_entidade_polo_ent_entidade_id_fkey` FOREIGN KEY (`ent_entidade_id`) REFERENCES `ent_entidade`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ent_entidade_polo` ADD CONSTRAINT `ent_entidade_polo_edu_polo_id_fkey` FOREIGN KEY (`edu_polo_id`) REFERENCES `edu_polo`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ent_entidade_gestao` ADD CONSTRAINT `ent_entidade_gestao_ent_entidade_id_fkey` FOREIGN KEY (`ent_entidade_id`) REFERENCES `ent_entidade`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ent_entidade_gestao` ADD CONSTRAINT `ent_entidade_gestao_ent_entidade_gestao_status_id_fkey` FOREIGN KEY (`ent_entidade_gestao_status_id`) REFERENCES `ent_entidade_gestao_status`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ent_cargo` ADD CONSTRAINT `ent_cargo_ent_cargo_tipo_id_fkey` FOREIGN KEY (`ent_cargo_tipo_id`) REFERENCES `ent_cargo_tipo`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ent_cargo` ADD CONSTRAINT `ent_cargo_ent_entidade_id_fkey` FOREIGN KEY (`ent_entidade_id`) REFERENCES `ent_entidade`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ent_entidade_cargo` ADD CONSTRAINT `ent_entidade_cargo_ent_entidade_id_fkey` FOREIGN KEY (`ent_entidade_id`) REFERENCES `ent_entidade`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ent_entidade_cargo` ADD CONSTRAINT `ent_entidade_cargo_ent_cargo_id_fkey` FOREIGN KEY (`ent_cargo_id`) REFERENCES `ent_cargo`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ent_entidade_membro` ADD CONSTRAINT `ent_entidade_membro_ent_entidade_id_fkey` FOREIGN KEY (`ent_entidade_id`) REFERENCES `ent_entidade`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ent_entidade_membro` ADD CONSTRAINT `ent_entidade_membro_sys_usuario_id_fkey` FOREIGN KEY (`sys_usuario_id`) REFERENCES `sys_usuario`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ent_entidade_membro` ADD CONSTRAINT `ent_entidade_membro_ent_entidade_membro_tipo_id_fkey` FOREIGN KEY (`ent_entidade_membro_tipo_id`) REFERENCES `ent_entidade_membro_tipo`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ent_entidade_membro` ADD CONSTRAINT `ent_entidade_membro_ent_entidade_membro_status_id_fkey` FOREIGN KEY (`ent_entidade_membro_status_id`) REFERENCES `ent_entidade_membro_status`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ent_entidade_membro_cargo` ADD CONSTRAINT `ent_entidade_membro_cargo_ent_entidade_membro_id_fkey` FOREIGN KEY (`ent_entidade_membro_id`) REFERENCES `ent_entidade_membro`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ent_entidade_membro_cargo` ADD CONSTRAINT `ent_entidade_membro_cargo_ent_cargo_id_fkey` FOREIGN KEY (`ent_cargo_id`) REFERENCES `ent_cargo`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ent_entidade_tema` ADD CONSTRAINT `ent_entidade_tema_ent_entidade_id_fkey` FOREIGN KEY (`ent_entidade_id`) REFERENCES `ent_entidade`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ent_entidade_regimento` ADD CONSTRAINT `ent_entidade_regimento_ent_entidade_id_fkey` FOREIGN KEY (`ent_entidade_id`) REFERENCES `ent_entidade`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_assinatura_plano` ADD CONSTRAINT `sys_assinatura_plano_sys_assinatura_plano_periodicidade_id_fkey` FOREIGN KEY (`sys_assinatura_plano_periodicidade_id`) REFERENCES `sys_assinatura_plano_periodicidade`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ent_entidade_assinatura` ADD CONSTRAINT `ent_entidade_assinatura_ent_entidade_id_fkey` FOREIGN KEY (`ent_entidade_id`) REFERENCES `ent_entidade`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ent_entidade_assinatura` ADD CONSTRAINT `ent_entidade_assinatura_sys_assinatura_plano_id_fkey` FOREIGN KEY (`sys_assinatura_plano_id`) REFERENCES `sys_assinatura_plano`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ent_entidade_assinatura` ADD CONSTRAINT `ent_entidade_assinatura_ent_entidade_assinatura_status_id_fkey` FOREIGN KEY (`ent_entidade_assinatura_status_id`) REFERENCES `ent_entidade_assinatura_status`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_auth_user` ADD CONSTRAINT `sys_auth_user_sys_usuario_id_fkey` FOREIGN KEY (`sys_usuario_id`) REFERENCES `sys_usuario`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_auth_session` ADD CONSTRAINT `sys_auth_session_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `sys_auth_user`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_auth_account` ADD CONSTRAINT `sys_auth_account_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `sys_auth_user`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_email_log` ADD CONSTRAINT `sys_email_log_sys_usuario_id_fkey` FOREIGN KEY (`sys_usuario_id`) REFERENCES `sys_usuario`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_email_verification_code` ADD CONSTRAINT `sys_email_verification_code_sys_usuario_id_fkey` FOREIGN KEY (`sys_usuario_id`) REFERENCES `sys_usuario`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_auth_login_log` ADD CONSTRAINT `sys_auth_login_log_sys_usuario_id_fkey` FOREIGN KEY (`sys_usuario_id`) REFERENCES `sys_usuario`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_arquivo` ADD CONSTRAINT `sys_arquivo_sys_arquivo_disco_id_fkey` FOREIGN KEY (`sys_arquivo_disco_id`) REFERENCES `sys_arquivo_disco`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_arquivo` ADD CONSTRAINT `sys_arquivo_sys_arquivo_visibilidade_id_fkey` FOREIGN KEY (`sys_arquivo_visibilidade_id`) REFERENCES `sys_arquivo_visibilidade`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_arquivo` ADD CONSTRAINT `sys_arquivo_sys_arquivo_tipo_id_fkey` FOREIGN KEY (`sys_arquivo_tipo_id`) REFERENCES `sys_arquivo_tipo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_arquivo` ADD CONSTRAINT `sys_arquivo_sys_arquivo_entidade_tipo_id_fkey` FOREIGN KEY (`sys_arquivo_entidade_tipo_id`) REFERENCES `sys_arquivo_entidade_tipo`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sys_inbox_item` ADD CONSTRAINT `sys_inbox_item_sys_usuario_id_fkey` FOREIGN KEY (`sys_usuario_id`) REFERENCES `sys_usuario`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_inbox_item` ADD CONSTRAINT `sys_inbox_item_sys_inbox_item_tipo_id_fkey` FOREIGN KEY (`sys_inbox_item_tipo_id`) REFERENCES `sys_inbox_item_tipo`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_inbox_item` ADD CONSTRAINT `sys_inbox_item_sys_inbox_item_status_id_fkey` FOREIGN KEY (`sys_inbox_item_status_id`) REFERENCES `sys_inbox_item_status`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_solicitacao` ADD CONSTRAINT `sys_solicitacao_sys_solicitacao_tipo_id_fkey` FOREIGN KEY (`sys_solicitacao_tipo_id`) REFERENCES `sys_solicitacao_tipo`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_solicitacao` ADD CONSTRAINT `sys_solicitacao_sys_solicitacao_status_id_fkey` FOREIGN KEY (`sys_solicitacao_status_id`) REFERENCES `sys_solicitacao_status`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_solicitacao` ADD CONSTRAINT `sys_solicitacao_solicitado_por_usuario_id_fkey` FOREIGN KEY (`solicitado_por_usuario_id`) REFERENCES `sys_usuario`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_solicitacao` ADD CONSTRAINT `sys_solicitacao_responsavel_sys_usuario_id_fkey` FOREIGN KEY (`responsavel_sys_usuario_id`) REFERENCES `sys_usuario`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_solicitacao` ADD CONSTRAINT `sys_solicitacao_edu_instituicao_id_fkey` FOREIGN KEY (`edu_instituicao_id`) REFERENCES `edu_instituicao`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_solicitacao` ADD CONSTRAINT `sys_solicitacao_edu_polo_id_fkey` FOREIGN KEY (`edu_polo_id`) REFERENCES `edu_polo`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_solicitacao` ADD CONSTRAINT `sys_solicitacao_ent_entidade_id_fkey` FOREIGN KEY (`ent_entidade_id`) REFERENCES `ent_entidade`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_solicitacao_historico` ADD CONSTRAINT `sys_solicitacao_historico_sys_solicitacao_id_fkey` FOREIGN KEY (`sys_solicitacao_id`) REFERENCES `sys_solicitacao`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_solicitacao_historico` ADD CONSTRAINT `sys_solicitacao_historico_sys_usuario_id_fkey` FOREIGN KEY (`sys_usuario_id`) REFERENCES `sys_usuario`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_solicitacao_historico` ADD CONSTRAINT `sys_solicitacao_historico_sys_solicitacao_status_anterior_i_fkey` FOREIGN KEY (`sys_solicitacao_status_anterior_id`) REFERENCES `sys_solicitacao_status`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_solicitacao_historico` ADD CONSTRAINT `sys_solicitacao_historico_sys_solicitacao_status_novo_id_fkey` FOREIGN KEY (`sys_solicitacao_status_novo_id`) REFERENCES `sys_solicitacao_status`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_solicitacao_documento` ADD CONSTRAINT `sys_solicitacao_documento_sys_solicitacao_id_fkey` FOREIGN KEY (`sys_solicitacao_id`) REFERENCES `sys_solicitacao`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_solicitacao_documento` ADD CONSTRAINT `sys_solicitacao_documento_sys_solicitacao_documento_tipo_id_fkey` FOREIGN KEY (`sys_solicitacao_documento_tipo_id`) REFERENCES `sys_solicitacao_documento_tipo`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_solicitacao_documento` ADD CONSTRAINT `sys_solicitacao_documento_sys_solicitacao_documento_status__fkey` FOREIGN KEY (`sys_solicitacao_documento_status_id`) REFERENCES `sys_solicitacao_documento_status`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_solicitacao_documento` ADD CONSTRAINT `sys_solicitacao_documento_sys_arquivo_id_fkey` FOREIGN KEY (`sys_arquivo_id`) REFERENCES `sys_arquivo`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
