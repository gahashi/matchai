-- AlterTable
ALTER TABLE `prd_produto` ADD COLUMN `exibir_apos_encerramento` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `fim_exibicao` DATETIME(0) NULL,
    ADD COLUMN `inicio_exibicao` DATETIME(0) NULL,
    ADD COLUMN `visivel_publico` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `soc_plano` ADD COLUMN `exibir_apos_encerramento` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `fim_exibicao` DATETIME(0) NULL,
    ADD COLUMN `inicio_exibicao` DATETIME(0) NULL,
    ADD COLUMN `visivel_publico` INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE `cad_evento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(150) NOT NULL,
    `descricao` TEXT NULL,
    `url` VARCHAR(1000) NULL,
    `banner_sys_arquivo_id` INTEGER NULL,
    `evento_at` DATETIME(0) NULL,
    `inicio_exibicao` DATETIME(0) NULL,
    `fim_exibicao` DATETIME(0) NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `destaque` INTEGER NOT NULL DEFAULT 0,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `visivel_publico` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `cad_evento_ativo_idx`(`ativo`),
    INDEX `cad_evento_ativo_visivel_publico_idx`(`ativo`, `visivel_publico`),
    INDEX `cad_evento_inicio_exibicao_fim_exibicao_idx`(`inicio_exibicao`, `fim_exibicao`),
    INDEX `cad_evento_evento_at_idx`(`evento_at`),
    INDEX `cad_evento_banner_sys_arquivo_id_idx`(`banner_sys_arquivo_id`),
    INDEX `cad_evento_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `cad_link_deleted_at_idx` ON `cad_link`(`deleted_at`);

-- CreateIndex
CREATE INDEX `prd_produto_ativo_visivel_publico_idx` ON `prd_produto`(`ativo`, `visivel_publico`);

-- CreateIndex
CREATE INDEX `prd_produto_inicio_exibicao_fim_exibicao_idx` ON `prd_produto`(`inicio_exibicao`, `fim_exibicao`);

-- CreateIndex
CREATE INDEX `prd_produto_variacao_deleted_at_idx` ON `prd_produto_variacao`(`deleted_at`);

-- CreateIndex
CREATE INDEX `soc_plano_ativo_visivel_publico_idx` ON `soc_plano`(`ativo`, `visivel_publico`);

-- CreateIndex
CREATE INDEX `soc_plano_inicio_exibicao_fim_exibicao_idx` ON `soc_plano`(`inicio_exibicao`, `fim_exibicao`);

-- CreateIndex
CREATE INDEX `soc_plano_deleted_at_idx` ON `soc_plano`(`deleted_at`);

-- CreateIndex
CREATE INDEX `vnd_campanha_deleted_at_idx` ON `vnd_campanha`(`deleted_at`);

-- AddForeignKey
ALTER TABLE `cad_evento` ADD CONSTRAINT `cad_evento_banner_sys_arquivo_id_fkey` FOREIGN KEY (`banner_sys_arquivo_id`) REFERENCES `sys_arquivo`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;
