-- CreateTable
CREATE TABLE `doa_evento_status` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(50) NOT NULL,
    `nome` VARCHAR(100) NOT NULL,
    `descricao` VARCHAR(255) NULL,
    `color` VARCHAR(30) NULL,
    `icon` VARCHAR(60) NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `doa_evento_status_codigo_key`(`codigo`),
    INDEX `doa_evento_status_ativo_idx`(`ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doa_evento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `doa_evento_status_id` INTEGER NOT NULL,
    `banner_sys_arquivo_id` INTEGER NULL,
    `created_by_sys_usuario_id` INTEGER NULL,
    `slug` VARCHAR(150) NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `descricao` TEXT NULL,
    `evento_at` DATETIME(0) NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `visivel_publico` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    UNIQUE INDEX `doa_evento_slug_key`(`slug`),
    INDEX `doa_evento_doa_evento_status_id_idx`(`doa_evento_status_id`),
    INDEX `doa_evento_banner_sys_arquivo_id_idx`(`banner_sys_arquivo_id`),
    INDEX `doa_evento_created_by_sys_usuario_id_idx`(`created_by_sys_usuario_id`),
    INDEX `doa_evento_evento_at_idx`(`evento_at`),
    INDEX `doa_evento_ativo_idx`(`ativo`),
    INDEX `doa_evento_ativo_visivel_publico_idx`(`ativo`, `visivel_publico`),
    INDEX `doa_evento_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doa_evento_usuario_tipo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(50) NOT NULL,
    `nome` VARCHAR(100) NOT NULL,
    `descricao` VARCHAR(255) NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `doa_evento_usuario_tipo_codigo_key`(`codigo`),
    INDEX `doa_evento_usuario_tipo_ativo_idx`(`ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doa_evento_usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `doa_evento_id` INTEGER NOT NULL,
    `sys_usuario_id` INTEGER NOT NULL,
    `doa_evento_usuario_tipo_id` INTEGER NOT NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    INDEX `doa_evento_usuario_doa_evento_id_ativo_idx`(`doa_evento_id`, `ativo`),
    INDEX `doa_evento_usuario_sys_usuario_id_ativo_idx`(`sys_usuario_id`, `ativo`),
    INDEX `doa_evento_usuario_doa_evento_usuario_tipo_id_idx`(`doa_evento_usuario_tipo_id`),
    UNIQUE INDEX `doa_evento_usuario_doa_evento_id_sys_usuario_id_key`(`doa_evento_id`, `sys_usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doa_ponto_coleta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `doa_evento_id` INTEGER NOT NULL,
    `foto_sys_arquivo_id` INTEGER NULL,
    `created_by_sys_usuario_id` INTEGER NULL,
    `nome` VARCHAR(150) NOT NULL,
    `descricao` TEXT NULL,
    `endereco` VARCHAR(500) NULL,
    `google_maps_url` VARCHAR(1000) NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `doa_ponto_coleta_doa_evento_id_idx`(`doa_evento_id`),
    INDEX `doa_ponto_coleta_doa_evento_id_ativo_idx`(`doa_evento_id`, `ativo`),
    INDEX `doa_ponto_coleta_doa_evento_id_ordem_idx`(`doa_evento_id`, `ordem`),
    INDEX `doa_ponto_coleta_foto_sys_arquivo_id_idx`(`foto_sys_arquivo_id`),
    INDEX `doa_ponto_coleta_created_by_sys_usuario_id_idx`(`created_by_sys_usuario_id`),
    INDEX `doa_ponto_coleta_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doa_arrecadacao_tipo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(50) NOT NULL,
    `nome` VARCHAR(100) NOT NULL,
    `descricao` VARCHAR(255) NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `doa_arrecadacao_tipo_codigo_key`(`codigo`),
    INDEX `doa_arrecadacao_tipo_ativo_idx`(`ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doa_arrecadacao_origem_tipo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(50) NOT NULL,
    `nome` VARCHAR(100) NOT NULL,
    `descricao` VARCHAR(255) NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `doa_arrecadacao_origem_tipo_codigo_key`(`codigo`),
    INDEX `doa_arrecadacao_origem_tipo_ativo_idx`(`ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doa_arrecadacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `doa_evento_id` INTEGER NOT NULL,
    `doa_arrecadacao_tipo_id` INTEGER NOT NULL,
    `doa_arrecadacao_origem_tipo_id` INTEGER NOT NULL,
    `doa_ponto_coleta_id` INTEGER NULL,
    `foto_sys_arquivo_id` INTEGER NULL,
    `created_by_sys_usuario_id` INTEGER NULL,
    `nome` VARCHAR(150) NOT NULL,
    `descricao` TEXT NULL,
    `quantidade` DECIMAL(12, 3) NULL,
    `unidade` VARCHAR(30) NULL,
    `valor` DECIMAL(10, 2) NULL,
    `observacao` TEXT NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `doa_arrecadacao_doa_evento_id_idx`(`doa_evento_id`),
    INDEX `doa_arrecadacao_doa_evento_id_doa_arrecadacao_tipo_id_idx`(`doa_evento_id`, `doa_arrecadacao_tipo_id`),
    INDEX `doa_arrecadacao_doa_arrecadacao_tipo_id_idx`(`doa_arrecadacao_tipo_id`),
    INDEX `doa_arrecadacao_doa_arrecadacao_origem_tipo_id_idx`(`doa_arrecadacao_origem_tipo_id`),
    INDEX `doa_arrecadacao_doa_ponto_coleta_id_idx`(`doa_ponto_coleta_id`),
    INDEX `doa_arrecadacao_foto_sys_arquivo_id_idx`(`foto_sys_arquivo_id`),
    INDEX `doa_arrecadacao_created_by_sys_usuario_id_idx`(`created_by_sys_usuario_id`),
    INDEX `doa_arrecadacao_created_at_idx`(`created_at`),
    INDEX `doa_arrecadacao_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doa_familia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `doa_evento_id` INTEGER NOT NULL,
    `created_by_sys_usuario_id` INTEGER NULL,
    `responsavel_nome` VARCHAR(150) NOT NULL,
    `responsavel_cpf` VARCHAR(14) NOT NULL,
    `telefone` VARCHAR(30) NULL,
    `endereco` VARCHAR(500) NULL,
    `quantidade_pessoas` INTEGER NULL,
    `quantidade_criancas` INTEGER NULL,
    `observacao` TEXT NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `doa_familia_doa_evento_id_idx`(`doa_evento_id`),
    INDEX `doa_familia_created_by_sys_usuario_id_idx`(`created_by_sys_usuario_id`),
    INDEX `doa_familia_responsavel_nome_idx`(`responsavel_nome`),
    INDEX `doa_familia_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `doa_familia_doa_evento_id_responsavel_cpf_key`(`doa_evento_id`, `responsavel_cpf`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doa_distribuicao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `doa_evento_id` INTEGER NOT NULL,
    `doa_familia_id` INTEGER NOT NULL,
    `created_by_sys_usuario_id` INTEGER NULL,
    `observacao` TEXT NULL,
    `entregue_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `doa_distribuicao_doa_evento_id_idx`(`doa_evento_id`),
    INDEX `doa_distribuicao_doa_familia_id_idx`(`doa_familia_id`),
    INDEX `doa_distribuicao_doa_evento_id_entregue_at_idx`(`doa_evento_id`, `entregue_at`),
    INDEX `doa_distribuicao_created_by_sys_usuario_id_idx`(`created_by_sys_usuario_id`),
    INDEX `doa_distribuicao_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doa_distribuicao_item` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `doa_distribuicao_id` INTEGER NOT NULL,
    `doa_arrecadacao_id` INTEGER NOT NULL,
    `quantidade` DECIMAL(12, 3) NOT NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    INDEX `doa_distribuicao_item_doa_distribuicao_id_idx`(`doa_distribuicao_id`),
    INDEX `doa_distribuicao_item_doa_arrecadacao_id_idx`(`doa_arrecadacao_id`),
    UNIQUE INDEX `doa_distribuicao_item_doa_distribuicao_id_doa_arrecadacao_id_key`(`doa_distribuicao_id`, `doa_arrecadacao_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doa_despesa` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `doa_evento_id` INTEGER NOT NULL,
    `comprovante_sys_arquivo_id` INTEGER NULL,
    `created_by_sys_usuario_id` INTEGER NULL,
    `descricao` VARCHAR(255) NOT NULL,
    `valor` DECIMAL(10, 2) NOT NULL,
    `despesa_at` DATETIME(0) NULL,
    `observacao` TEXT NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `doa_despesa_doa_evento_id_idx`(`doa_evento_id`),
    INDEX `doa_despesa_comprovante_sys_arquivo_id_idx`(`comprovante_sys_arquivo_id`),
    INDEX `doa_despesa_created_by_sys_usuario_id_idx`(`created_by_sys_usuario_id`),
    INDEX `doa_despesa_despesa_at_idx`(`despesa_at`),
    INDEX `doa_despesa_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doa_evento_conteudo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `doa_evento_id` INTEGER NOT NULL,
    `titulo` VARCHAR(180) NOT NULL,
    `conteudo` TEXT NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `doa_evento_conteudo_doa_evento_id_idx`(`doa_evento_id`),
    INDEX `doa_evento_conteudo_doa_evento_id_ativo_ordem_idx`(`doa_evento_id`, `ativo`, `ordem`),
    INDEX `doa_evento_conteudo_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doa_evento_foto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `doa_evento_id` INTEGER NOT NULL,
    `sys_arquivo_id` INTEGER NOT NULL,
    `legenda` VARCHAR(500) NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `destaque` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    INDEX `doa_evento_foto_doa_evento_id_destaque_ordem_idx`(`doa_evento_id`, `destaque`, `ordem`),
    INDEX `doa_evento_foto_sys_arquivo_id_idx`(`sys_arquivo_id`),
    UNIQUE INDEX `doa_evento_foto_doa_evento_id_sys_arquivo_id_key`(`doa_evento_id`, `sys_arquivo_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `doa_evento` ADD CONSTRAINT `doa_evento_doa_evento_status_id_fkey` FOREIGN KEY (`doa_evento_status_id`) REFERENCES `doa_evento_status`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `doa_evento` ADD CONSTRAINT `doa_evento_banner_sys_arquivo_id_fkey` FOREIGN KEY (`banner_sys_arquivo_id`) REFERENCES `sys_arquivo`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `doa_evento` ADD CONSTRAINT `doa_evento_created_by_sys_usuario_id_fkey` FOREIGN KEY (`created_by_sys_usuario_id`) REFERENCES `sys_usuario`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `doa_evento_usuario` ADD CONSTRAINT `doa_evento_usuario_doa_evento_id_fkey` FOREIGN KEY (`doa_evento_id`) REFERENCES `doa_evento`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `doa_evento_usuario` ADD CONSTRAINT `doa_evento_usuario_sys_usuario_id_fkey` FOREIGN KEY (`sys_usuario_id`) REFERENCES `sys_usuario`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `doa_evento_usuario` ADD CONSTRAINT `doa_evento_usuario_doa_evento_usuario_tipo_id_fkey` FOREIGN KEY (`doa_evento_usuario_tipo_id`) REFERENCES `doa_evento_usuario_tipo`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `doa_ponto_coleta` ADD CONSTRAINT `doa_ponto_coleta_doa_evento_id_fkey` FOREIGN KEY (`doa_evento_id`) REFERENCES `doa_evento`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `doa_ponto_coleta` ADD CONSTRAINT `doa_ponto_coleta_foto_sys_arquivo_id_fkey` FOREIGN KEY (`foto_sys_arquivo_id`) REFERENCES `sys_arquivo`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `doa_ponto_coleta` ADD CONSTRAINT `doa_ponto_coleta_created_by_sys_usuario_id_fkey` FOREIGN KEY (`created_by_sys_usuario_id`) REFERENCES `sys_usuario`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `doa_arrecadacao` ADD CONSTRAINT `doa_arrecadacao_doa_evento_id_fkey` FOREIGN KEY (`doa_evento_id`) REFERENCES `doa_evento`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `doa_arrecadacao` ADD CONSTRAINT `doa_arrecadacao_doa_arrecadacao_tipo_id_fkey` FOREIGN KEY (`doa_arrecadacao_tipo_id`) REFERENCES `doa_arrecadacao_tipo`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `doa_arrecadacao` ADD CONSTRAINT `doa_arrecadacao_doa_arrecadacao_origem_tipo_id_fkey` FOREIGN KEY (`doa_arrecadacao_origem_tipo_id`) REFERENCES `doa_arrecadacao_origem_tipo`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `doa_arrecadacao` ADD CONSTRAINT `doa_arrecadacao_doa_ponto_coleta_id_fkey` FOREIGN KEY (`doa_ponto_coleta_id`) REFERENCES `doa_ponto_coleta`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `doa_arrecadacao` ADD CONSTRAINT `doa_arrecadacao_foto_sys_arquivo_id_fkey` FOREIGN KEY (`foto_sys_arquivo_id`) REFERENCES `sys_arquivo`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `doa_arrecadacao` ADD CONSTRAINT `doa_arrecadacao_created_by_sys_usuario_id_fkey` FOREIGN KEY (`created_by_sys_usuario_id`) REFERENCES `sys_usuario`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `doa_familia` ADD CONSTRAINT `doa_familia_doa_evento_id_fkey` FOREIGN KEY (`doa_evento_id`) REFERENCES `doa_evento`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `doa_familia` ADD CONSTRAINT `doa_familia_created_by_sys_usuario_id_fkey` FOREIGN KEY (`created_by_sys_usuario_id`) REFERENCES `sys_usuario`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `doa_distribuicao` ADD CONSTRAINT `doa_distribuicao_doa_evento_id_fkey` FOREIGN KEY (`doa_evento_id`) REFERENCES `doa_evento`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `doa_distribuicao` ADD CONSTRAINT `doa_distribuicao_doa_familia_id_fkey` FOREIGN KEY (`doa_familia_id`) REFERENCES `doa_familia`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `doa_distribuicao` ADD CONSTRAINT `doa_distribuicao_created_by_sys_usuario_id_fkey` FOREIGN KEY (`created_by_sys_usuario_id`) REFERENCES `sys_usuario`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `doa_distribuicao_item` ADD CONSTRAINT `doa_distribuicao_item_doa_distribuicao_id_fkey` FOREIGN KEY (`doa_distribuicao_id`) REFERENCES `doa_distribuicao`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `doa_distribuicao_item` ADD CONSTRAINT `doa_distribuicao_item_doa_arrecadacao_id_fkey` FOREIGN KEY (`doa_arrecadacao_id`) REFERENCES `doa_arrecadacao`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `doa_despesa` ADD CONSTRAINT `doa_despesa_doa_evento_id_fkey` FOREIGN KEY (`doa_evento_id`) REFERENCES `doa_evento`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `doa_despesa` ADD CONSTRAINT `doa_despesa_comprovante_sys_arquivo_id_fkey` FOREIGN KEY (`comprovante_sys_arquivo_id`) REFERENCES `sys_arquivo`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `doa_despesa` ADD CONSTRAINT `doa_despesa_created_by_sys_usuario_id_fkey` FOREIGN KEY (`created_by_sys_usuario_id`) REFERENCES `sys_usuario`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `doa_evento_conteudo` ADD CONSTRAINT `doa_evento_conteudo_doa_evento_id_fkey` FOREIGN KEY (`doa_evento_id`) REFERENCES `doa_evento`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `doa_evento_foto` ADD CONSTRAINT `doa_evento_foto_doa_evento_id_fkey` FOREIGN KEY (`doa_evento_id`) REFERENCES `doa_evento`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `doa_evento_foto` ADD CONSTRAINT `doa_evento_foto_sys_arquivo_id_fkey` FOREIGN KEY (`sys_arquivo_id`) REFERENCES `sys_arquivo`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
