-- CreateTable
CREATE TABLE `par_parceiro` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(60) NOT NULL,
    `slug` VARCHAR(150) NOT NULL,
    `nome` VARCHAR(150) NOT NULL,
    `descricao` TEXT NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `visivel_publico` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    UNIQUE INDEX `par_parceiro_codigo_key`(`codigo`),
    UNIQUE INDEX `par_parceiro_slug_key`(`slug`),
    INDEX `par_parceiro_ativo_idx`(`ativo`),
    INDEX `par_parceiro_ativo_visivel_publico_idx`(`ativo`, `visivel_publico`),
    INDEX `par_parceiro_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `par_parceiro_usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `par_parceiro_id` INTEGER NOT NULL,
    `sys_usuario_id` INTEGER NOT NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    INDEX `par_parceiro_usuario_par_parceiro_id_ativo_idx`(`par_parceiro_id`, `ativo`),
    INDEX `par_parceiro_usuario_sys_usuario_id_ativo_idx`(`sys_usuario_id`, `ativo`),
    UNIQUE INDEX `par_parceiro_usuario_par_parceiro_id_sys_usuario_id_key`(`par_parceiro_id`, `sys_usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `par_parceiro_tema` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `par_parceiro_id` INTEGER NOT NULL,
    `logo_sys_arquivo_id` INTEGER NULL,
    `banner_sys_arquivo_id` INTEGER NULL,
    `cor_primaria` VARCHAR(20) NULL,
    `cor_secundaria` VARCHAR(20) NULL,
    `cor_fundo` VARCHAR(20) NULL,
    `cor_texto` VARCHAR(20) NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `par_parceiro_tema_par_parceiro_id_key`(`par_parceiro_id`),
    INDEX `par_parceiro_tema_logo_sys_arquivo_id_idx`(`logo_sys_arquivo_id`),
    INDEX `par_parceiro_tema_banner_sys_arquivo_id_idx`(`banner_sys_arquivo_id`),
    INDEX `par_parceiro_tema_ativo_idx`(`ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `par_parceiro_usuario` ADD CONSTRAINT `par_parceiro_usuario_par_parceiro_id_fkey` FOREIGN KEY (`par_parceiro_id`) REFERENCES `par_parceiro`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `par_parceiro_usuario` ADD CONSTRAINT `par_parceiro_usuario_sys_usuario_id_fkey` FOREIGN KEY (`sys_usuario_id`) REFERENCES `sys_usuario`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `par_parceiro_tema` ADD CONSTRAINT `par_parceiro_tema_par_parceiro_id_fkey` FOREIGN KEY (`par_parceiro_id`) REFERENCES `par_parceiro`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `par_parceiro_tema` ADD CONSTRAINT `par_parceiro_tema_logo_sys_arquivo_id_fkey` FOREIGN KEY (`logo_sys_arquivo_id`) REFERENCES `sys_arquivo`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `par_parceiro_tema` ADD CONSTRAINT `par_parceiro_tema_banner_sys_arquivo_id_fkey` FOREIGN KEY (`banner_sys_arquivo_id`) REFERENCES `sys_arquivo`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;
