-- CreateTable
CREATE TABLE `sys_usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(150) NOT NULL,
    `nickname` VARCHAR(50) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `telefone` VARCHAR(30) NULL,
    `senha_hash` VARCHAR(255) NOT NULL,
    `codigo_aluno` VARCHAR(50) NULL,
    `documento` VARCHAR(30) NULL,
    `avatar_url` VARCHAR(255) NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
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
    `atl_atletica_id` INTEGER NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `sys_usuario_role_fk1`(`sys_usuario_id`),
    INDEX `sys_usuario_role_fk2`(`sys_role_id`),
    INDEX `sys_usuario_role_fk3`(`atl_atletica_id`),
    UNIQUE INDEX `uk_sys_usuario_role_contexto`(`sys_usuario_id`, `sys_role_id`, `atl_atletica_id`),
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
    `atl_atletica_id` INTEGER NULL,
    `motivo` VARCHAR(255) NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `sys_usuario_permission_fk1`(`sys_usuario_id`),
    INDEX `sys_usuario_permission_fk2`(`sys_permission_id`),
    INDEX `sys_usuario_permission_fk3`(`sys_usuario_permission_tipo_id`),
    INDEX `sys_usuario_permission_fk4`(`atl_atletica_id`),
    UNIQUE INDEX `uk_sys_usuario_permission_contexto`(`sys_usuario_id`, `sys_permission_id`, `atl_atletica_id`),
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
CREATE TABLE `atl_atletica` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `edu_instituicao_id` INTEGER NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
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

    UNIQUE INDEX `atl_atletica_slug_key`(`slug`),
    INDEX `atl_atletica_fk1`(`edu_instituicao_id`),
    INDEX `atl_atletica_ativo_idx`(`ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `atl_atletica_curso` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `atl_atletica_id` INTEGER NOT NULL,
    `edu_curso_id` INTEGER NOT NULL,
    `principal` INTEGER NOT NULL DEFAULT 0,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `atl_atletica_curso_fk1`(`atl_atletica_id`),
    INDEX `atl_atletica_curso_fk2`(`edu_curso_id`),
    UNIQUE INDEX `uk_atl_atletica_curso`(`atl_atletica_id`, `edu_curso_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `atl_cargo_tipo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(100) NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `descricao` TEXT NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `atl_cargo_tipo_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `atl_cargo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `codigo` VARCHAR(100) NOT NULL,
    `descricao` VARCHAR(255) NULL,
    `atl_cargo_tipo_id` INTEGER NOT NULL,
    `atl_atletica_id` INTEGER NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `atl_cargo_fk1`(`atl_cargo_tipo_id`),
    INDEX `atl_cargo_fk2`(`atl_atletica_id`),
    INDEX `atl_cargo_ativo_idx`(`ativo`),
    UNIQUE INDEX `uk_atl_cargo_codigo_contexto`(`codigo`, `atl_atletica_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `atl_atletica_cargo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `atl_atletica_id` INTEGER NOT NULL,
    `atl_cargo_id` INTEGER NOT NULL,
    `nome_exibicao` VARCHAR(100) NULL,
    `descricao_customizada` VARCHAR(255) NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `atl_atletica_cargo_fk1`(`atl_atletica_id`),
    INDEX `atl_atletica_cargo_fk2`(`atl_cargo_id`),
    INDEX `atl_atletica_cargo_ordem_idx`(`ordem`),
    UNIQUE INDEX `uk_atl_atletica_cargo`(`atl_atletica_id`, `atl_cargo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `atl_atletica_membro_tipo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(100) NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `descricao` TEXT NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `atl_atletica_membro_tipo_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `atl_atletica_membro_status` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(100) NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `color` VARCHAR(50) NULL,
    `icon` VARCHAR(100) NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `atl_atletica_membro_status_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `atl_atletica_membro` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `atl_atletica_id` INTEGER NOT NULL,
    `sys_usuario_id` INTEGER NOT NULL,
    `atl_atletica_membro_tipo_id` INTEGER NOT NULL,
    `atl_atletica_membro_status_id` INTEGER NOT NULL,
    `entrou_at` DATE NULL,
    `saiu_at` DATE NULL,
    `observacao` TEXT NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `atl_atletica_membro_fk1`(`atl_atletica_id`),
    INDEX `atl_atletica_membro_fk2`(`sys_usuario_id`),
    INDEX `atl_atletica_membro_fk3`(`atl_atletica_membro_tipo_id`),
    INDEX `atl_atletica_membro_fk4`(`atl_atletica_membro_status_id`),
    UNIQUE INDEX `uk_atl_atletica_membro`(`atl_atletica_id`, `sys_usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `atl_atletica_membro_cargo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `atl_atletica_membro_id` INTEGER NOT NULL,
    `atl_cargo_id` INTEGER NOT NULL,
    `inicio_at` DATE NOT NULL,
    `fim_at` DATE NULL,
    `atual` INTEGER NOT NULL DEFAULT 1,
    `observacao` TEXT NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `atl_atletica_membro_cargo_fk1`(`atl_atletica_membro_id`),
    INDEX `atl_atletica_membro_cargo_fk2`(`atl_cargo_id`),
    INDEX `atl_atletica_membro_cargo_atual_idx`(`atual`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `atl_atletica_tema` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `atl_atletica_id` INTEGER NOT NULL,
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

    UNIQUE INDEX `atl_atletica_tema_atl_atletica_id_key`(`atl_atletica_id`),
    INDEX `atl_atletica_tema_fk1`(`atl_atletica_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `atl_atletica_regimento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `atl_atletica_id` INTEGER NOT NULL,
    `titulo` VARCHAR(150) NOT NULL,
    `versao` VARCHAR(30) NOT NULL,
    `conteudo` TEXT NOT NULL,
    `arquivo_url` VARCHAR(255) NULL,
    `aprovado_at` DATE NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `atl_atletica_regimento_fk1`(`atl_atletica_id`),
    UNIQUE INDEX `uk_atl_atletica_regimento_versao`(`atl_atletica_id`, `versao`),
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
CREATE TABLE `atl_atletica_assinatura_status` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(100) NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `color` VARCHAR(50) NULL,
    `icon` VARCHAR(100) NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `atl_atletica_assinatura_status_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `atl_atletica_assinatura` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `atl_atletica_id` INTEGER NOT NULL,
    `sys_assinatura_plano_id` INTEGER NOT NULL,
    `atl_atletica_assinatura_status_id` INTEGER NOT NULL,
    `inicio_at` DATE NOT NULL,
    `fim_at` DATE NULL,
    `observacao` TEXT NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `atl_atletica_assinatura_fk1`(`atl_atletica_id`),
    INDEX `atl_atletica_assinatura_fk2`(`sys_assinatura_plano_id`),
    INDEX `atl_atletica_assinatura_fk3`(`atl_atletica_assinatura_status_id`),
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
ALTER TABLE `sys_usuario_role` ADD CONSTRAINT `sys_usuario_role_atl_atletica_id_fkey` FOREIGN KEY (`atl_atletica_id`) REFERENCES `atl_atletica`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_usuario_permission` ADD CONSTRAINT `sys_usuario_permission_sys_usuario_id_fkey` FOREIGN KEY (`sys_usuario_id`) REFERENCES `sys_usuario`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_usuario_permission` ADD CONSTRAINT `sys_usuario_permission_sys_permission_id_fkey` FOREIGN KEY (`sys_permission_id`) REFERENCES `sys_permission`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_usuario_permission` ADD CONSTRAINT `sys_usuario_permission_sys_usuario_permission_tipo_id_fkey` FOREIGN KEY (`sys_usuario_permission_tipo_id`) REFERENCES `sys_usuario_permission_tipo`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_usuario_permission` ADD CONSTRAINT `sys_usuario_permission_atl_atletica_id_fkey` FOREIGN KEY (`atl_atletica_id`) REFERENCES `atl_atletica`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `edu_instituicao_curso` ADD CONSTRAINT `edu_instituicao_curso_edu_instituicao_id_fkey` FOREIGN KEY (`edu_instituicao_id`) REFERENCES `edu_instituicao`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `edu_instituicao_curso` ADD CONSTRAINT `edu_instituicao_curso_edu_curso_id_fkey` FOREIGN KEY (`edu_curso_id`) REFERENCES `edu_curso`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `atl_atletica` ADD CONSTRAINT `atl_atletica_edu_instituicao_id_fkey` FOREIGN KEY (`edu_instituicao_id`) REFERENCES `edu_instituicao`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `atl_atletica_curso` ADD CONSTRAINT `atl_atletica_curso_atl_atletica_id_fkey` FOREIGN KEY (`atl_atletica_id`) REFERENCES `atl_atletica`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `atl_atletica_curso` ADD CONSTRAINT `atl_atletica_curso_edu_curso_id_fkey` FOREIGN KEY (`edu_curso_id`) REFERENCES `edu_curso`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `atl_cargo` ADD CONSTRAINT `atl_cargo_atl_cargo_tipo_id_fkey` FOREIGN KEY (`atl_cargo_tipo_id`) REFERENCES `atl_cargo_tipo`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `atl_atletica_cargo` ADD CONSTRAINT `atl_atletica_cargo_atl_atletica_id_fkey` FOREIGN KEY (`atl_atletica_id`) REFERENCES `atl_atletica`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `atl_atletica_cargo` ADD CONSTRAINT `atl_atletica_cargo_atl_cargo_id_fkey` FOREIGN KEY (`atl_cargo_id`) REFERENCES `atl_cargo`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `atl_atletica_membro` ADD CONSTRAINT `atl_atletica_membro_atl_atletica_id_fkey` FOREIGN KEY (`atl_atletica_id`) REFERENCES `atl_atletica`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `atl_atletica_membro` ADD CONSTRAINT `atl_atletica_membro_sys_usuario_id_fkey` FOREIGN KEY (`sys_usuario_id`) REFERENCES `sys_usuario`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `atl_atletica_membro` ADD CONSTRAINT `atl_atletica_membro_atl_atletica_membro_tipo_id_fkey` FOREIGN KEY (`atl_atletica_membro_tipo_id`) REFERENCES `atl_atletica_membro_tipo`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `atl_atletica_membro` ADD CONSTRAINT `atl_atletica_membro_atl_atletica_membro_status_id_fkey` FOREIGN KEY (`atl_atletica_membro_status_id`) REFERENCES `atl_atletica_membro_status`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `atl_atletica_membro_cargo` ADD CONSTRAINT `atl_atletica_membro_cargo_atl_atletica_membro_id_fkey` FOREIGN KEY (`atl_atletica_membro_id`) REFERENCES `atl_atletica_membro`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `atl_atletica_membro_cargo` ADD CONSTRAINT `atl_atletica_membro_cargo_atl_cargo_id_fkey` FOREIGN KEY (`atl_cargo_id`) REFERENCES `atl_cargo`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `atl_atletica_tema` ADD CONSTRAINT `atl_atletica_tema_atl_atletica_id_fkey` FOREIGN KEY (`atl_atletica_id`) REFERENCES `atl_atletica`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `atl_atletica_regimento` ADD CONSTRAINT `atl_atletica_regimento_atl_atletica_id_fkey` FOREIGN KEY (`atl_atletica_id`) REFERENCES `atl_atletica`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_assinatura_plano` ADD CONSTRAINT `sys_assinatura_plano_sys_assinatura_plano_periodicidade_id_fkey` FOREIGN KEY (`sys_assinatura_plano_periodicidade_id`) REFERENCES `sys_assinatura_plano_periodicidade`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `atl_atletica_assinatura` ADD CONSTRAINT `atl_atletica_assinatura_atl_atletica_id_fkey` FOREIGN KEY (`atl_atletica_id`) REFERENCES `atl_atletica`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `atl_atletica_assinatura` ADD CONSTRAINT `atl_atletica_assinatura_sys_assinatura_plano_id_fkey` FOREIGN KEY (`sys_assinatura_plano_id`) REFERENCES `sys_assinatura_plano`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `atl_atletica_assinatura` ADD CONSTRAINT `atl_atletica_assinatura_atl_atletica_assinatura_status_id_fkey` FOREIGN KEY (`atl_atletica_assinatura_status_id`) REFERENCES `atl_atletica_assinatura_status`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
