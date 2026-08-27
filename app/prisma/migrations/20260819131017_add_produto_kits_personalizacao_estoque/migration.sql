-- AlterTable
ALTER TABLE `vnd_campanha_produto` ADD COLUMN `modalidade_venda` VARCHAR(30) NOT NULL DEFAULT 'estoque';

-- AlterTable
ALTER TABLE `vnd_pedido` MODIFY `cliente_email` VARCHAR(180) NULL;

-- CreateTable
CREATE TABLE `prd_produto_componente` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `prd_produto_id` INTEGER NOT NULL,
    `prd_produto_componente_id` INTEGER NOT NULL,
    `quantidade` INTEGER NOT NULL DEFAULT 1,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    INDEX `prd_produto_componente_prd_produto_id_ativo_ordem_idx`(`prd_produto_id`, `ativo`, `ordem`),
    INDEX `prd_produto_componente_prd_produto_componente_id_idx`(`prd_produto_componente_id`),
    UNIQUE INDEX `prd_produto_componente_prd_produto_id_prd_produto_componente_key`(`prd_produto_id`, `prd_produto_componente_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prd_produto_campo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `prd_produto_id` INTEGER NOT NULL,
    `codigo` VARCHAR(60) NOT NULL,
    `nome` VARCHAR(100) NOT NULL,
    `descricao` VARCHAR(255) NULL,
    `tipo` VARCHAR(30) NOT NULL DEFAULT 'texto',
    `obrigatorio` INTEGER NOT NULL DEFAULT 0,
    `valor_unico` INTEGER NOT NULL DEFAULT 0,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `prd_produto_campo_prd_produto_id_ativo_idx`(`prd_produto_id`, `ativo`),
    INDEX `prd_produto_campo_deleted_at_idx`(`deleted_at`),
    UNIQUE INDEX `prd_produto_campo_prd_produto_id_codigo_key`(`prd_produto_id`, `codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vnd_pedido_item_componente` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vnd_pedido_item_id` INTEGER NOT NULL,
    `prd_produto_id` INTEGER NULL,
    `prd_produto_variacao_id` INTEGER NULL,
    `produto_codigo_snapshot` VARCHAR(60) NOT NULL,
    `produto_nome_snapshot` VARCHAR(150) NOT NULL,
    `variacao_snapshot` VARCHAR(120) NULL,
    `quantidade` INTEGER NOT NULL,
    `created_at` DATETIME(0) NULL,

    INDEX `vnd_pedido_item_componente_vnd_pedido_item_id_idx`(`vnd_pedido_item_id`),
    INDEX `vnd_pedido_item_componente_prd_produto_id_idx`(`prd_produto_id`),
    INDEX `vnd_pedido_item_componente_prd_produto_variacao_id_idx`(`prd_produto_variacao_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vnd_pedido_item_campo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vnd_pedido_item_id` INTEGER NOT NULL,
    `vnd_pedido_item_componente_id` INTEGER NULL,
    `prd_produto_campo_id` INTEGER NULL,
    `campo_codigo_snapshot` VARCHAR(60) NOT NULL,
    `campo_nome_snapshot` VARCHAR(100) NOT NULL,
    `campo_tipo_snapshot` VARCHAR(30) NOT NULL,
    `valor` VARCHAR(255) NOT NULL,
    `valor_normalizado` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(0) NULL,

    INDEX `vnd_pedido_item_campo_vnd_pedido_item_id_idx`(`vnd_pedido_item_id`),
    INDEX `vnd_pedido_item_campo_vnd_pedido_item_componente_id_idx`(`vnd_pedido_item_componente_id`),
    INDEX `vnd_pedido_item_campo_prd_produto_campo_id_idx`(`prd_produto_campo_id`),
    INDEX `vnd_pedido_item_campo_prd_produto_campo_id_valor_normalizado_idx`(`prd_produto_campo_id`, `valor_normalizado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vnd_estoque_reserva` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vnd_pedido_id` INTEGER NOT NULL,
    `vnd_pedido_item_id` INTEGER NOT NULL,
    `vnd_pedido_item_componente_id` INTEGER NULL,
    `prd_produto_id` INTEGER NOT NULL,
    `prd_produto_variacao_id` INTEGER NULL,
    `quantidade` INTEGER NOT NULL,
    `expira_at` DATETIME(0) NOT NULL,
    `consumida_at` DATETIME(0) NULL,
    `liberada_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    INDEX `vnd_estoque_reserva_vnd_pedido_id_idx`(`vnd_pedido_id`),
    INDEX `vnd_estoque_reserva_vnd_pedido_item_id_idx`(`vnd_pedido_item_id`),
    INDEX `vnd_estoque_reserva_vnd_pedido_item_componente_id_idx`(`vnd_pedido_item_componente_id`),
    INDEX `vnd_estoque_reserva_prd_produto_id_expira_at_idx`(`prd_produto_id`, `expira_at`),
    INDEX `vnd_estoque_reserva_prd_produto_variacao_id_expira_at_idx`(`prd_produto_variacao_id`, `expira_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `vnd_campanha_produto_modalidade_venda_idx` ON `vnd_campanha_produto`(`modalidade_venda`);

-- AddForeignKey
ALTER TABLE `prd_produto_componente` ADD CONSTRAINT `prd_produto_componente_prd_produto_id_fkey` FOREIGN KEY (`prd_produto_id`) REFERENCES `prd_produto`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `prd_produto_componente` ADD CONSTRAINT `prd_produto_componente_prd_produto_componente_id_fkey` FOREIGN KEY (`prd_produto_componente_id`) REFERENCES `prd_produto`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `prd_produto_campo` ADD CONSTRAINT `prd_produto_campo_prd_produto_id_fkey` FOREIGN KEY (`prd_produto_id`) REFERENCES `prd_produto`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `vnd_pedido_item_componente` ADD CONSTRAINT `vnd_pedido_item_componente_vnd_pedido_item_id_fkey` FOREIGN KEY (`vnd_pedido_item_id`) REFERENCES `vnd_pedido_item`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `vnd_pedido_item_componente` ADD CONSTRAINT `vnd_pedido_item_componente_prd_produto_id_fkey` FOREIGN KEY (`prd_produto_id`) REFERENCES `prd_produto`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `vnd_pedido_item_componente` ADD CONSTRAINT `vnd_pedido_item_componente_prd_produto_variacao_id_fkey` FOREIGN KEY (`prd_produto_variacao_id`) REFERENCES `prd_produto_variacao`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `vnd_pedido_item_campo` ADD CONSTRAINT `vnd_pedido_item_campo_vnd_pedido_item_id_fkey` FOREIGN KEY (`vnd_pedido_item_id`) REFERENCES `vnd_pedido_item`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `vnd_pedido_item_campo` ADD CONSTRAINT `vnd_pedido_item_campo_vnd_pedido_item_componente_id_fkey` FOREIGN KEY (`vnd_pedido_item_componente_id`) REFERENCES `vnd_pedido_item_componente`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `vnd_pedido_item_campo` ADD CONSTRAINT `vnd_pedido_item_campo_prd_produto_campo_id_fkey` FOREIGN KEY (`prd_produto_campo_id`) REFERENCES `prd_produto_campo`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `vnd_estoque_reserva` ADD CONSTRAINT `vnd_estoque_reserva_vnd_pedido_id_fkey` FOREIGN KEY (`vnd_pedido_id`) REFERENCES `vnd_pedido`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `vnd_estoque_reserva` ADD CONSTRAINT `vnd_estoque_reserva_vnd_pedido_item_id_fkey` FOREIGN KEY (`vnd_pedido_item_id`) REFERENCES `vnd_pedido_item`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `vnd_estoque_reserva` ADD CONSTRAINT `vnd_estoque_reserva_vnd_pedido_item_componente_id_fkey` FOREIGN KEY (`vnd_pedido_item_componente_id`) REFERENCES `vnd_pedido_item_componente`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `vnd_estoque_reserva` ADD CONSTRAINT `vnd_estoque_reserva_prd_produto_id_fkey` FOREIGN KEY (`prd_produto_id`) REFERENCES `prd_produto`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `vnd_estoque_reserva` ADD CONSTRAINT `vnd_estoque_reserva_prd_produto_variacao_id_fkey` FOREIGN KEY (`prd_produto_variacao_id`) REFERENCES `prd_produto_variacao`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
