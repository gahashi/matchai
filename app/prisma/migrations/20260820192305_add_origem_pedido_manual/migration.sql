-- AlterTable
ALTER TABLE `vnd_pedido` ADD COLUMN `data_original` DATETIME(0) NULL,
    ADD COLUMN `origem` VARCHAR(30) NOT NULL DEFAULT 'loja';

-- CreateIndex
CREATE INDEX `vnd_pedido_origem_idx` ON `vnd_pedido`(`origem`);

-- CreateIndex
CREATE INDEX `vnd_pedido_data_original_idx` ON `vnd_pedido`(`data_original`);
