-- CreateTable
CREATE TABLE `crd_categoria` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `par_parceiro_id` INTEGER NOT NULL,
    `nome` VARCHAR(120) NOT NULL,
    `descricao` VARCHAR(500) NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `crd_categoria_par_parceiro_id_idx`(`par_parceiro_id`),
    INDEX `crd_categoria_par_parceiro_id_ativo_idx`(`par_parceiro_id`, `ativo`),
    INDEX `crd_categoria_par_parceiro_id_ordem_idx`(`par_parceiro_id`, `ordem`),
    INDEX `crd_categoria_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `crd_item` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `par_parceiro_id` INTEGER NOT NULL,
    `crd_categoria_id` INTEGER NOT NULL,
    `imagem_sys_arquivo_id` INTEGER NULL,
    `nome` VARCHAR(150) NOT NULL,
    `descricao` TEXT NULL,
    `preco` DECIMAL(10, 2) NOT NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `crd_item_par_parceiro_id_idx`(`par_parceiro_id`),
    INDEX `crd_item_crd_categoria_id_idx`(`crd_categoria_id`),
    INDEX `crd_item_imagem_sys_arquivo_id_idx`(`imagem_sys_arquivo_id`),
    INDEX `crd_item_par_parceiro_id_ativo_idx`(`par_parceiro_id`, `ativo`),
    INDEX `crd_item_par_parceiro_id_crd_categoria_id_ativo_idx`(`par_parceiro_id`, `crd_categoria_id`, `ativo`),
    INDEX `crd_item_crd_categoria_id_ordem_idx`(`crd_categoria_id`, `ordem`),
    INDEX `crd_item_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `crd_categoria` ADD CONSTRAINT `crd_categoria_par_parceiro_id_fkey` FOREIGN KEY (`par_parceiro_id`) REFERENCES `par_parceiro`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `crd_item` ADD CONSTRAINT `crd_item_par_parceiro_id_fkey` FOREIGN KEY (`par_parceiro_id`) REFERENCES `par_parceiro`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `crd_item` ADD CONSTRAINT `crd_item_crd_categoria_id_fkey` FOREIGN KEY (`crd_categoria_id`) REFERENCES `crd_categoria`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `crd_item` ADD CONSTRAINT `crd_item_imagem_sys_arquivo_id_fkey` FOREIGN KEY (`imagem_sys_arquivo_id`) REFERENCES `sys_arquivo`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;
