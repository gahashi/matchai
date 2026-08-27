/*
  Warnings:

  - You are about to drop the column `entidade_id` on the `sys_arquivo` table. All the data in the column will be lost.
  - You are about to drop the column `sys_arquivo_entidade_tipo_id` on the `sys_arquivo` table. All the data in the column will be lost.
  - You are about to drop the column `avatar_file_key` on the `sys_usuario` table. All the data in the column will be lost.
  - You are about to drop the column `avatar_url` on the `sys_usuario` table. All the data in the column will be lost.
  - You are about to drop the column `codigo_aluno` on the `sys_usuario` table. All the data in the column will be lost.
  - You are about to drop the column `senha_hash` on the `sys_usuario` table. All the data in the column will be lost.
  - You are about to drop the `edu_curso` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `edu_instituicao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `edu_instituicao_curso` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `edu_polo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ent_cargo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ent_cargo_tipo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ent_entidade` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ent_entidade_assinatura` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ent_entidade_assinatura_status` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ent_entidade_cargo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ent_entidade_curso` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ent_entidade_gestao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ent_entidade_gestao_status` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ent_entidade_membro` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ent_entidade_membro_cargo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ent_entidade_membro_status` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ent_entidade_membro_tipo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ent_entidade_polo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ent_entidade_regimento` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ent_entidade_status` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ent_entidade_tema` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ent_entidade_tipo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sys_arquivo_entidade_tipo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sys_assinatura_plano` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sys_assinatura_plano_periodicidade` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sys_inbox_item` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sys_inbox_item_status` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sys_inbox_item_tipo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sys_permission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sys_role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sys_role_escopo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sys_role_permission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sys_solicitacao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sys_solicitacao_documento` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sys_solicitacao_documento_status` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sys_solicitacao_documento_tipo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sys_solicitacao_historico` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sys_solicitacao_status` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sys_solicitacao_tipo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sys_usuario_permission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sys_usuario_permission_tipo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sys_usuario_polo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sys_usuario_role` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `sys_usuario_tipo_id` to the `sys_usuario` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `edu_instituicao_curso` DROP FOREIGN KEY `edu_instituicao_curso_edu_curso_id_fkey`;

-- DropForeignKey
ALTER TABLE `edu_instituicao_curso` DROP FOREIGN KEY `edu_instituicao_curso_edu_instituicao_id_fkey`;

-- DropForeignKey
ALTER TABLE `edu_polo` DROP FOREIGN KEY `edu_polo_edu_instituicao_id_fkey`;

-- DropForeignKey
ALTER TABLE `ent_cargo` DROP FOREIGN KEY `ent_cargo_ent_cargo_tipo_id_fkey`;

-- DropForeignKey
ALTER TABLE `ent_cargo` DROP FOREIGN KEY `ent_cargo_ent_entidade_id_fkey`;

-- DropForeignKey
ALTER TABLE `ent_entidade` DROP FOREIGN KEY `ent_entidade_criado_por_sys_usuario_id_fkey`;

-- DropForeignKey
ALTER TABLE `ent_entidade` DROP FOREIGN KEY `ent_entidade_edu_instituicao_id_fkey`;

-- DropForeignKey
ALTER TABLE `ent_entidade` DROP FOREIGN KEY `ent_entidade_ent_entidade_status_id_fkey`;

-- DropForeignKey
ALTER TABLE `ent_entidade` DROP FOREIGN KEY `ent_entidade_ent_entidade_tipo_id_fkey`;

-- DropForeignKey
ALTER TABLE `ent_entidade_assinatura` DROP FOREIGN KEY `ent_entidade_assinatura_ent_entidade_assinatura_status_id_fkey`;

-- DropForeignKey
ALTER TABLE `ent_entidade_assinatura` DROP FOREIGN KEY `ent_entidade_assinatura_ent_entidade_id_fkey`;

-- DropForeignKey
ALTER TABLE `ent_entidade_assinatura` DROP FOREIGN KEY `ent_entidade_assinatura_sys_assinatura_plano_id_fkey`;

-- DropForeignKey
ALTER TABLE `ent_entidade_cargo` DROP FOREIGN KEY `ent_entidade_cargo_ent_cargo_id_fkey`;

-- DropForeignKey
ALTER TABLE `ent_entidade_cargo` DROP FOREIGN KEY `ent_entidade_cargo_ent_entidade_id_fkey`;

-- DropForeignKey
ALTER TABLE `ent_entidade_curso` DROP FOREIGN KEY `ent_entidade_curso_edu_curso_id_fkey`;

-- DropForeignKey
ALTER TABLE `ent_entidade_curso` DROP FOREIGN KEY `ent_entidade_curso_ent_entidade_id_fkey`;

-- DropForeignKey
ALTER TABLE `ent_entidade_gestao` DROP FOREIGN KEY `ent_entidade_gestao_ent_entidade_gestao_status_id_fkey`;

-- DropForeignKey
ALTER TABLE `ent_entidade_gestao` DROP FOREIGN KEY `ent_entidade_gestao_ent_entidade_id_fkey`;

-- DropForeignKey
ALTER TABLE `ent_entidade_membro` DROP FOREIGN KEY `ent_entidade_membro_ent_entidade_id_fkey`;

-- DropForeignKey
ALTER TABLE `ent_entidade_membro` DROP FOREIGN KEY `ent_entidade_membro_ent_entidade_membro_status_id_fkey`;

-- DropForeignKey
ALTER TABLE `ent_entidade_membro` DROP FOREIGN KEY `ent_entidade_membro_ent_entidade_membro_tipo_id_fkey`;

-- DropForeignKey
ALTER TABLE `ent_entidade_membro` DROP FOREIGN KEY `ent_entidade_membro_sys_usuario_id_fkey`;

-- DropForeignKey
ALTER TABLE `ent_entidade_membro_cargo` DROP FOREIGN KEY `ent_entidade_membro_cargo_ent_cargo_id_fkey`;

-- DropForeignKey
ALTER TABLE `ent_entidade_membro_cargo` DROP FOREIGN KEY `ent_entidade_membro_cargo_ent_entidade_membro_id_fkey`;

-- DropForeignKey
ALTER TABLE `ent_entidade_polo` DROP FOREIGN KEY `ent_entidade_polo_edu_polo_id_fkey`;

-- DropForeignKey
ALTER TABLE `ent_entidade_polo` DROP FOREIGN KEY `ent_entidade_polo_ent_entidade_id_fkey`;

-- DropForeignKey
ALTER TABLE `ent_entidade_regimento` DROP FOREIGN KEY `ent_entidade_regimento_ent_entidade_id_fkey`;

-- DropForeignKey
ALTER TABLE `ent_entidade_tema` DROP FOREIGN KEY `ent_entidade_tema_ent_entidade_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_arquivo` DROP FOREIGN KEY `sys_arquivo_sys_arquivo_disco_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_arquivo` DROP FOREIGN KEY `sys_arquivo_sys_arquivo_entidade_tipo_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_arquivo` DROP FOREIGN KEY `sys_arquivo_sys_arquivo_tipo_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_arquivo` DROP FOREIGN KEY `sys_arquivo_sys_arquivo_visibilidade_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_assinatura_plano` DROP FOREIGN KEY `sys_assinatura_plano_sys_assinatura_plano_periodicidade_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_auth_login_log` DROP FOREIGN KEY `sys_auth_login_log_sys_usuario_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_email_log` DROP FOREIGN KEY `sys_email_log_sys_usuario_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_email_verification_code` DROP FOREIGN KEY `sys_email_verification_code_sys_usuario_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_inbox_item` DROP FOREIGN KEY `sys_inbox_item_sys_inbox_item_status_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_inbox_item` DROP FOREIGN KEY `sys_inbox_item_sys_inbox_item_tipo_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_inbox_item` DROP FOREIGN KEY `sys_inbox_item_sys_usuario_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_role` DROP FOREIGN KEY `sys_role_sys_role_escopo_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_role_permission` DROP FOREIGN KEY `sys_role_permission_sys_permission_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_role_permission` DROP FOREIGN KEY `sys_role_permission_sys_role_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_solicitacao` DROP FOREIGN KEY `sys_solicitacao_edu_instituicao_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_solicitacao` DROP FOREIGN KEY `sys_solicitacao_edu_polo_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_solicitacao` DROP FOREIGN KEY `sys_solicitacao_ent_entidade_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_solicitacao` DROP FOREIGN KEY `sys_solicitacao_responsavel_sys_usuario_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_solicitacao` DROP FOREIGN KEY `sys_solicitacao_solicitado_por_usuario_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_solicitacao` DROP FOREIGN KEY `sys_solicitacao_sys_solicitacao_status_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_solicitacao` DROP FOREIGN KEY `sys_solicitacao_sys_solicitacao_tipo_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_solicitacao_documento` DROP FOREIGN KEY `sys_solicitacao_documento_sys_arquivo_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_solicitacao_documento` DROP FOREIGN KEY `sys_solicitacao_documento_sys_solicitacao_documento_status__fkey`;

-- DropForeignKey
ALTER TABLE `sys_solicitacao_documento` DROP FOREIGN KEY `sys_solicitacao_documento_sys_solicitacao_documento_tipo_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_solicitacao_documento` DROP FOREIGN KEY `sys_solicitacao_documento_sys_solicitacao_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_solicitacao_historico` DROP FOREIGN KEY `sys_solicitacao_historico_sys_solicitacao_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_solicitacao_historico` DROP FOREIGN KEY `sys_solicitacao_historico_sys_solicitacao_status_anterior_i_fkey`;

-- DropForeignKey
ALTER TABLE `sys_solicitacao_historico` DROP FOREIGN KEY `sys_solicitacao_historico_sys_solicitacao_status_novo_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_solicitacao_historico` DROP FOREIGN KEY `sys_solicitacao_historico_sys_usuario_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_usuario_permission` DROP FOREIGN KEY `sys_usuario_permission_ent_entidade_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_usuario_permission` DROP FOREIGN KEY `sys_usuario_permission_sys_permission_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_usuario_permission` DROP FOREIGN KEY `sys_usuario_permission_sys_usuario_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_usuario_permission` DROP FOREIGN KEY `sys_usuario_permission_sys_usuario_permission_tipo_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_usuario_polo` DROP FOREIGN KEY `sys_usuario_polo_edu_polo_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_usuario_polo` DROP FOREIGN KEY `sys_usuario_polo_sys_usuario_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_usuario_role` DROP FOREIGN KEY `sys_usuario_role_ent_entidade_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_usuario_role` DROP FOREIGN KEY `sys_usuario_role_sys_role_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_usuario_role` DROP FOREIGN KEY `sys_usuario_role_sys_usuario_id_fkey`;

-- DropIndex
DROP INDEX `sys_arquivo_storage_deleted_at_idx` ON `sys_arquivo`;

-- DropIndex
DROP INDEX `sys_arquivo_sys_arquivo_entidade_tipo_id_entidade_id_idx` ON `sys_arquivo`;

-- AlterTable
ALTER TABLE `sys_arquivo` DROP COLUMN `entidade_id`,
    DROP COLUMN `sys_arquivo_entidade_tipo_id`;

-- AlterTable
ALTER TABLE `sys_usuario` DROP COLUMN `avatar_file_key`,
    DROP COLUMN `avatar_url`,
    DROP COLUMN `codigo_aluno`,
    DROP COLUMN `senha_hash`,
    ADD COLUMN `sys_usuario_tipo_id` INTEGER NOT NULL;

-- DropTable
DROP TABLE `edu_curso`;

-- DropTable
DROP TABLE `edu_instituicao`;

-- DropTable
DROP TABLE `edu_instituicao_curso`;

-- DropTable
DROP TABLE `edu_polo`;

-- DropTable
DROP TABLE `ent_cargo`;

-- DropTable
DROP TABLE `ent_cargo_tipo`;

-- DropTable
DROP TABLE `ent_entidade`;

-- DropTable
DROP TABLE `ent_entidade_assinatura`;

-- DropTable
DROP TABLE `ent_entidade_assinatura_status`;

-- DropTable
DROP TABLE `ent_entidade_cargo`;

-- DropTable
DROP TABLE `ent_entidade_curso`;

-- DropTable
DROP TABLE `ent_entidade_gestao`;

-- DropTable
DROP TABLE `ent_entidade_gestao_status`;

-- DropTable
DROP TABLE `ent_entidade_membro`;

-- DropTable
DROP TABLE `ent_entidade_membro_cargo`;

-- DropTable
DROP TABLE `ent_entidade_membro_status`;

-- DropTable
DROP TABLE `ent_entidade_membro_tipo`;

-- DropTable
DROP TABLE `ent_entidade_polo`;

-- DropTable
DROP TABLE `ent_entidade_regimento`;

-- DropTable
DROP TABLE `ent_entidade_status`;

-- DropTable
DROP TABLE `ent_entidade_tema`;

-- DropTable
DROP TABLE `ent_entidade_tipo`;

-- DropTable
DROP TABLE `sys_arquivo_entidade_tipo`;

-- DropTable
DROP TABLE `sys_assinatura_plano`;

-- DropTable
DROP TABLE `sys_assinatura_plano_periodicidade`;

-- DropTable
DROP TABLE `sys_inbox_item`;

-- DropTable
DROP TABLE `sys_inbox_item_status`;

-- DropTable
DROP TABLE `sys_inbox_item_tipo`;

-- DropTable
DROP TABLE `sys_permission`;

-- DropTable
DROP TABLE `sys_role`;

-- DropTable
DROP TABLE `sys_role_escopo`;

-- DropTable
DROP TABLE `sys_role_permission`;

-- DropTable
DROP TABLE `sys_solicitacao`;

-- DropTable
DROP TABLE `sys_solicitacao_documento`;

-- DropTable
DROP TABLE `sys_solicitacao_documento_status`;

-- DropTable
DROP TABLE `sys_solicitacao_documento_tipo`;

-- DropTable
DROP TABLE `sys_solicitacao_historico`;

-- DropTable
DROP TABLE `sys_solicitacao_status`;

-- DropTable
DROP TABLE `sys_solicitacao_tipo`;

-- DropTable
DROP TABLE `sys_usuario_permission`;

-- DropTable
DROP TABLE `sys_usuario_permission_tipo`;

-- DropTable
DROP TABLE `sys_usuario_polo`;

-- DropTable
DROP TABLE `sys_usuario_role`;

-- CreateTable
CREATE TABLE `sys_usuario_tipo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(50) NOT NULL,
    `nome` VARCHAR(100) NOT NULL,
    `descricao` VARCHAR(255) NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `sys_usuario_tipo_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cad_link` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(120) NOT NULL,
    `descricao` VARCHAR(255) NULL,
    `url` VARCHAR(1000) NOT NULL,
    `icon` VARCHAR(100) NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `destaque` INTEGER NOT NULL DEFAULT 0,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `cad_link_ativo_ordem_idx`(`ativo`, `ordem`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prd_produto_tipo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(50) NOT NULL,
    `nome` VARCHAR(100) NOT NULL,
    `descricao` VARCHAR(255) NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `prd_produto_tipo_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prd_produto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `prd_produto_tipo_id` INTEGER NOT NULL,
    `codigo` VARCHAR(60) NOT NULL,
    `slug` VARCHAR(150) NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `descricao` TEXT NULL,
    `preco_custo` DECIMAL(10, 2) NULL,
    `preco_normal` DECIMAL(10, 2) NOT NULL,
    `preco_socio` DECIMAL(10, 2) NULL,
    `controla_estoque` INTEGER NOT NULL DEFAULT 0,
    `estoque_atual` INTEGER NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `destaque` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    UNIQUE INDEX `prd_produto_codigo_key`(`codigo`),
    UNIQUE INDEX `prd_produto_slug_key`(`slug`),
    INDEX `prd_produto_prd_produto_tipo_id_idx`(`prd_produto_tipo_id`),
    INDEX `prd_produto_ativo_idx`(`ativo`),
    INDEX `prd_produto_destaque_idx`(`destaque`),
    INDEX `prd_produto_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prd_produto_imagem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `prd_produto_id` INTEGER NOT NULL,
    `sys_arquivo_id` INTEGER NOT NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `principal` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    INDEX `prd_produto_imagem_prd_produto_id_principal_ordem_idx`(`prd_produto_id`, `principal`, `ordem`),
    INDEX `prd_produto_imagem_sys_arquivo_id_idx`(`sys_arquivo_id`),
    UNIQUE INDEX `prd_produto_imagem_prd_produto_id_sys_arquivo_id_key`(`prd_produto_id`, `sys_arquivo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prd_produto_variacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `prd_produto_id` INTEGER NOT NULL,
    `sku` VARCHAR(80) NULL,
    `nome` VARCHAR(120) NOT NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `estoque_atual` INTEGER NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    UNIQUE INDEX `prd_produto_variacao_sku_key`(`sku`),
    INDEX `prd_produto_variacao_prd_produto_id_ativo_idx`(`prd_produto_id`, `ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vnd_campanha_status` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(50) NOT NULL,
    `descricao` VARCHAR(100) NOT NULL,
    `color` VARCHAR(30) NULL,
    `icon` VARCHAR(60) NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `vnd_campanha_status_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vnd_campanha` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vnd_campanha_status_id` INTEGER NOT NULL,
    `codigo` VARCHAR(60) NOT NULL,
    `slug` VARCHAR(150) NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `descricao` TEXT NULL,
    `inicio_at` DATETIME(0) NULL,
    `fim_at` DATETIME(0) NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    UNIQUE INDEX `vnd_campanha_codigo_key`(`codigo`),
    UNIQUE INDEX `vnd_campanha_slug_key`(`slug`),
    INDEX `vnd_campanha_vnd_campanha_status_id_idx`(`vnd_campanha_status_id`),
    INDEX `vnd_campanha_inicio_at_fim_at_idx`(`inicio_at`, `fim_at`),
    INDEX `vnd_campanha_ativo_idx`(`ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vnd_campanha_produto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vnd_campanha_id` INTEGER NOT NULL,
    `prd_produto_id` INTEGER NOT NULL,
    `preco_normal` DECIMAL(10, 2) NULL,
    `preco_socio` DECIMAL(10, 2) NULL,
    `limite_por_cliente` INTEGER NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    INDEX `vnd_campanha_produto_vnd_campanha_id_ativo_idx`(`vnd_campanha_id`, `ativo`),
    INDEX `vnd_campanha_produto_prd_produto_id_idx`(`prd_produto_id`),
    UNIQUE INDEX `vnd_campanha_produto_vnd_campanha_id_prd_produto_id_key`(`vnd_campanha_id`, `prd_produto_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `soc_socio_status` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(50) NOT NULL,
    `descricao` VARCHAR(100) NOT NULL,
    `color` VARCHAR(30) NULL,
    `icon` VARCHAR(60) NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `soc_socio_status_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `soc_socio_origem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(50) NOT NULL,
    `descricao` VARCHAR(100) NOT NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `soc_socio_origem_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `soc_plano` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `prd_produto_id` INTEGER NULL,
    `codigo` VARCHAR(60) NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `descricao` TEXT NULL,
    `duracao_dias` INTEGER NOT NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    UNIQUE INDEX `soc_plano_codigo_key`(`codigo`),
    INDEX `soc_plano_prd_produto_id_idx`(`prd_produto_id`),
    INDEX `soc_plano_ativo_idx`(`ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `soc_socio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sys_usuario_id` INTEGER NOT NULL,
    `soc_plano_id` INTEGER NOT NULL,
    `soc_socio_status_id` INTEGER NOT NULL,
    `soc_socio_origem_id` INTEGER NOT NULL,
    `origem_pedido_item_id` INTEGER NULL,
    `inicio_at` DATETIME(0) NOT NULL,
    `fim_at` DATETIME(0) NOT NULL,
    `observacao` VARCHAR(500) NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    INDEX `soc_socio_sys_usuario_id_soc_socio_status_id_fim_at_idx`(`sys_usuario_id`, `soc_socio_status_id`, `fim_at`),
    INDEX `soc_socio_soc_plano_id_idx`(`soc_plano_id`),
    INDEX `soc_socio_origem_pedido_item_id_idx`(`origem_pedido_item_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vnd_pedido_status` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(50) NOT NULL,
    `descricao` VARCHAR(100) NOT NULL,
    `color` VARCHAR(30) NULL,
    `icon` VARCHAR(60) NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `vnd_pedido_status_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vnd_entrega_tipo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(50) NOT NULL,
    `descricao` VARCHAR(100) NOT NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `vnd_entrega_tipo_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vnd_pedido` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(20) NOT NULL,
    `sys_usuario_id` INTEGER NULL,
    `vnd_campanha_id` INTEGER NULL,
    `vnd_pedido_status_id` INTEGER NOT NULL,
    `vnd_entrega_tipo_id` INTEGER NULL,
    `cliente_nome` VARCHAR(150) NOT NULL,
    `cliente_email` VARCHAR(180) NOT NULL,
    `cliente_telefone` VARCHAR(30) NOT NULL,
    `entrega_endereco` VARCHAR(500) NULL,
    `retirada_local` VARCHAR(255) NULL,
    `observacao_cliente` VARCHAR(500) NULL,
    `valor_produtos` DECIMAL(10, 2) NOT NULL,
    `valor_desconto` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `valor_frete` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `valor_acrescimo` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `valor_total` DECIMAL(10, 2) NOT NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `cancelado_at` DATETIME(0) NULL,
    `concluido_at` DATETIME(0) NULL,

    UNIQUE INDEX `vnd_pedido_codigo_key`(`codigo`),
    INDEX `vnd_pedido_sys_usuario_id_idx`(`sys_usuario_id`),
    INDEX `vnd_pedido_vnd_campanha_id_idx`(`vnd_campanha_id`),
    INDEX `vnd_pedido_vnd_pedido_status_id_created_at_idx`(`vnd_pedido_status_id`, `created_at`),
    INDEX `vnd_pedido_cliente_email_idx`(`cliente_email`),
    INDEX `vnd_pedido_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vnd_pedido_item` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vnd_pedido_id` INTEGER NOT NULL,
    `prd_produto_id` INTEGER NULL,
    `prd_produto_variacao_id` INTEGER NULL,
    `vnd_campanha_id` INTEGER NULL,
    `produto_codigo_snapshot` VARCHAR(60) NOT NULL,
    `produto_nome_snapshot` VARCHAR(150) NOT NULL,
    `variacao_snapshot` VARCHAR(120) NULL,
    `quantidade` INTEGER NOT NULL,
    `preco_tabela` DECIMAL(10, 2) NOT NULL,
    `preco_unitario` DECIMAL(10, 2) NOT NULL,
    `valor_desconto` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `socio_aplicado` INTEGER NOT NULL DEFAULT 0,
    `personalizacao_nome` VARCHAR(100) NULL,
    `personalizacao_numero` VARCHAR(20) NULL,
    `observacao` VARCHAR(500) NULL,
    `created_at` DATETIME(0) NULL,

    INDEX `vnd_pedido_item_vnd_pedido_id_idx`(`vnd_pedido_id`),
    INDEX `vnd_pedido_item_prd_produto_id_idx`(`prd_produto_id`),
    INDEX `vnd_pedido_item_prd_produto_variacao_id_idx`(`prd_produto_variacao_id`),
    INDEX `vnd_pedido_item_vnd_campanha_id_idx`(`vnd_campanha_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vnd_pedido_historico` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vnd_pedido_id` INTEGER NOT NULL,
    `vnd_pedido_status_id` INTEGER NOT NULL,
    `sys_usuario_id` INTEGER NULL,
    `observacao` VARCHAR(500) NULL,
    `created_at` DATETIME(0) NULL,

    INDEX `vnd_pedido_historico_vnd_pedido_id_created_at_idx`(`vnd_pedido_id`, `created_at`),
    INDEX `vnd_pedido_historico_sys_usuario_id_idx`(`sys_usuario_id`),
    INDEX `vnd_pedido_historico_vnd_pedido_status_id_idx`(`vnd_pedido_status_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fin_pagamento_status` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(50) NOT NULL,
    `descricao` VARCHAR(100) NOT NULL,
    `color` VARCHAR(30) NULL,
    `icon` VARCHAR(60) NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `fin_pagamento_status_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fin_pagamento_metodo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(50) NOT NULL,
    `descricao` VARCHAR(100) NOT NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `fin_pagamento_metodo_codigo_key`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fin_pagamento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vnd_pedido_id` INTEGER NOT NULL,
    `fin_pagamento_status_id` INTEGER NOT NULL,
    `fin_pagamento_metodo_id` INTEGER NOT NULL,
    `valor` DECIMAL(10, 2) NOT NULL,
    `taxa_gateway` DECIMAL(10, 2) NULL,
    `valor_liquido` DECIMAL(10, 2) NULL,
    `provider` VARCHAR(50) NULL,
    `external_id` VARCHAR(191) NULL,
    `external_reference` VARCHAR(191) NULL,
    `idempotency_key` VARCHAR(191) NULL,
    `qr_code_text` TEXT NULL,
    `payment_url` VARCHAR(1000) NULL,
    `aprovado_at` DATETIME(0) NULL,
    `expirado_at` DATETIME(0) NULL,
    `cancelado_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `fin_pagamento_idempotency_key_key`(`idempotency_key`),
    INDEX `fin_pagamento_vnd_pedido_id_idx`(`vnd_pedido_id`),
    INDEX `fin_pagamento_fin_pagamento_status_id_idx`(`fin_pagamento_status_id`),
    INDEX `fin_pagamento_fin_pagamento_metodo_id_idx`(`fin_pagamento_metodo_id`),
    INDEX `fin_pagamento_provider_external_id_idx`(`provider`, `external_id`),
    INDEX `fin_pagamento_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `sys_usuario_sys_usuario_tipo_id_idx` ON `sys_usuario`(`sys_usuario_tipo_id`);

-- CreateIndex
CREATE INDEX `sys_usuario_ativo_idx` ON `sys_usuario`(`ativo`);

-- CreateIndex
CREATE INDEX `sys_usuario_deleted_at_idx` ON `sys_usuario`(`deleted_at`);

-- AddForeignKey
ALTER TABLE `sys_usuario` ADD CONSTRAINT `sys_usuario_sys_usuario_tipo_id_fkey` FOREIGN KEY (`sys_usuario_tipo_id`) REFERENCES `sys_usuario_tipo`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_usuario` ADD CONSTRAINT `sys_usuario_avatar_sys_arquivo_id_fkey` FOREIGN KEY (`avatar_sys_arquivo_id`) REFERENCES `sys_arquivo`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_auth_login_log` ADD CONSTRAINT `sys_auth_login_log_sys_usuario_id_fkey` FOREIGN KEY (`sys_usuario_id`) REFERENCES `sys_usuario`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_email_log` ADD CONSTRAINT `sys_email_log_sys_usuario_id_fkey` FOREIGN KEY (`sys_usuario_id`) REFERENCES `sys_usuario`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_email_verification_code` ADD CONSTRAINT `sys_email_verification_code_sys_usuario_id_fkey` FOREIGN KEY (`sys_usuario_id`) REFERENCES `sys_usuario`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_arquivo` ADD CONSTRAINT `sys_arquivo_sys_arquivo_disco_id_fkey` FOREIGN KEY (`sys_arquivo_disco_id`) REFERENCES `sys_arquivo_disco`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_arquivo` ADD CONSTRAINT `sys_arquivo_sys_arquivo_visibilidade_id_fkey` FOREIGN KEY (`sys_arquivo_visibilidade_id`) REFERENCES `sys_arquivo_visibilidade`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_arquivo` ADD CONSTRAINT `sys_arquivo_sys_arquivo_tipo_id_fkey` FOREIGN KEY (`sys_arquivo_tipo_id`) REFERENCES `sys_arquivo_tipo`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_arquivo` ADD CONSTRAINT `sys_arquivo_created_by_usuario_id_fkey` FOREIGN KEY (`created_by_usuario_id`) REFERENCES `sys_usuario`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `prd_produto` ADD CONSTRAINT `prd_produto_prd_produto_tipo_id_fkey` FOREIGN KEY (`prd_produto_tipo_id`) REFERENCES `prd_produto_tipo`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `prd_produto_imagem` ADD CONSTRAINT `prd_produto_imagem_prd_produto_id_fkey` FOREIGN KEY (`prd_produto_id`) REFERENCES `prd_produto`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `prd_produto_imagem` ADD CONSTRAINT `prd_produto_imagem_sys_arquivo_id_fkey` FOREIGN KEY (`sys_arquivo_id`) REFERENCES `sys_arquivo`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `prd_produto_variacao` ADD CONSTRAINT `prd_produto_variacao_prd_produto_id_fkey` FOREIGN KEY (`prd_produto_id`) REFERENCES `prd_produto`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `vnd_campanha` ADD CONSTRAINT `vnd_campanha_vnd_campanha_status_id_fkey` FOREIGN KEY (`vnd_campanha_status_id`) REFERENCES `vnd_campanha_status`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `vnd_campanha_produto` ADD CONSTRAINT `vnd_campanha_produto_vnd_campanha_id_fkey` FOREIGN KEY (`vnd_campanha_id`) REFERENCES `vnd_campanha`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `vnd_campanha_produto` ADD CONSTRAINT `vnd_campanha_produto_prd_produto_id_fkey` FOREIGN KEY (`prd_produto_id`) REFERENCES `prd_produto`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `soc_plano` ADD CONSTRAINT `soc_plano_prd_produto_id_fkey` FOREIGN KEY (`prd_produto_id`) REFERENCES `prd_produto`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `soc_socio` ADD CONSTRAINT `soc_socio_sys_usuario_id_fkey` FOREIGN KEY (`sys_usuario_id`) REFERENCES `sys_usuario`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `soc_socio` ADD CONSTRAINT `soc_socio_soc_plano_id_fkey` FOREIGN KEY (`soc_plano_id`) REFERENCES `soc_plano`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `soc_socio` ADD CONSTRAINT `soc_socio_soc_socio_status_id_fkey` FOREIGN KEY (`soc_socio_status_id`) REFERENCES `soc_socio_status`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `soc_socio` ADD CONSTRAINT `soc_socio_soc_socio_origem_id_fkey` FOREIGN KEY (`soc_socio_origem_id`) REFERENCES `soc_socio_origem`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `soc_socio` ADD CONSTRAINT `soc_socio_origem_pedido_item_id_fkey` FOREIGN KEY (`origem_pedido_item_id`) REFERENCES `vnd_pedido_item`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `vnd_pedido` ADD CONSTRAINT `vnd_pedido_sys_usuario_id_fkey` FOREIGN KEY (`sys_usuario_id`) REFERENCES `sys_usuario`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `vnd_pedido` ADD CONSTRAINT `vnd_pedido_vnd_campanha_id_fkey` FOREIGN KEY (`vnd_campanha_id`) REFERENCES `vnd_campanha`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `vnd_pedido` ADD CONSTRAINT `vnd_pedido_vnd_pedido_status_id_fkey` FOREIGN KEY (`vnd_pedido_status_id`) REFERENCES `vnd_pedido_status`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `vnd_pedido` ADD CONSTRAINT `vnd_pedido_vnd_entrega_tipo_id_fkey` FOREIGN KEY (`vnd_entrega_tipo_id`) REFERENCES `vnd_entrega_tipo`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `vnd_pedido_item` ADD CONSTRAINT `vnd_pedido_item_vnd_pedido_id_fkey` FOREIGN KEY (`vnd_pedido_id`) REFERENCES `vnd_pedido`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `vnd_pedido_item` ADD CONSTRAINT `vnd_pedido_item_prd_produto_id_fkey` FOREIGN KEY (`prd_produto_id`) REFERENCES `prd_produto`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `vnd_pedido_item` ADD CONSTRAINT `vnd_pedido_item_prd_produto_variacao_id_fkey` FOREIGN KEY (`prd_produto_variacao_id`) REFERENCES `prd_produto_variacao`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `vnd_pedido_item` ADD CONSTRAINT `vnd_pedido_item_vnd_campanha_id_fkey` FOREIGN KEY (`vnd_campanha_id`) REFERENCES `vnd_campanha`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `vnd_pedido_historico` ADD CONSTRAINT `vnd_pedido_historico_vnd_pedido_id_fkey` FOREIGN KEY (`vnd_pedido_id`) REFERENCES `vnd_pedido`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `vnd_pedido_historico` ADD CONSTRAINT `vnd_pedido_historico_vnd_pedido_status_id_fkey` FOREIGN KEY (`vnd_pedido_status_id`) REFERENCES `vnd_pedido_status`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `vnd_pedido_historico` ADD CONSTRAINT `vnd_pedido_historico_sys_usuario_id_fkey` FOREIGN KEY (`sys_usuario_id`) REFERENCES `sys_usuario`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `fin_pagamento` ADD CONSTRAINT `fin_pagamento_vnd_pedido_id_fkey` FOREIGN KEY (`vnd_pedido_id`) REFERENCES `vnd_pedido`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `fin_pagamento` ADD CONSTRAINT `fin_pagamento_fin_pagamento_status_id_fkey` FOREIGN KEY (`fin_pagamento_status_id`) REFERENCES `fin_pagamento_status`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `fin_pagamento` ADD CONSTRAINT `fin_pagamento_fin_pagamento_metodo_id_fkey` FOREIGN KEY (`fin_pagamento_metodo_id`) REFERENCES `fin_pagamento_metodo`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- RenameIndex
ALTER TABLE `sys_auth_login_log` RENAME INDEX `sys_auth_login_log_fk1` TO `sys_auth_login_log_sys_usuario_id_idx`;

-- RenameIndex
ALTER TABLE `sys_email_log` RENAME INDEX `sys_email_log_fk1` TO `sys_email_log_sys_usuario_id_idx`;

-- RenameIndex
ALTER TABLE `sys_email_verification_code` RENAME INDEX `sys_email_verification_code_fk1` TO `sys_email_verification_code_sys_usuario_id_idx`;
