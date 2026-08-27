/*
  Warnings:

  - You are about to drop the column `origem_pedido_item_id` on the `soc_socio` table. All the data in the column will be lost.
  - You are about to drop the column `created_by_usuario_id` on the `sys_arquivo` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `soc_socio` DROP FOREIGN KEY `soc_socio_origem_pedido_item_id_fkey`;

-- DropForeignKey
ALTER TABLE `sys_arquivo` DROP FOREIGN KEY `sys_arquivo_created_by_usuario_id_fkey`;

-- DropIndex
DROP INDEX `soc_socio_origem_pedido_item_id_idx` ON `soc_socio`;

-- DropIndex
DROP INDEX `sys_arquivo_created_by_usuario_id_idx` ON `sys_arquivo`;

-- AlterTable
ALTER TABLE `soc_socio` DROP COLUMN `origem_pedido_item_id`,
    ADD COLUMN `origem_vnd_pedido_item_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `sys_arquivo` DROP COLUMN `created_by_usuario_id`,
    ADD COLUMN `created_by_sys_usuario_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `soc_socio_origem_vnd_pedido_item_id_idx` ON `soc_socio`(`origem_vnd_pedido_item_id`);

-- CreateIndex
CREATE INDEX `sys_arquivo_created_by_sys_usuario_id_idx` ON `sys_arquivo`(`created_by_sys_usuario_id`);

-- AddForeignKey
ALTER TABLE `sys_arquivo` ADD CONSTRAINT `sys_arquivo_created_by_sys_usuario_id_fkey` FOREIGN KEY (`created_by_sys_usuario_id`) REFERENCES `sys_usuario`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `soc_socio` ADD CONSTRAINT `soc_socio_origem_vnd_pedido_item_id_fkey` FOREIGN KEY (`origem_vnd_pedido_item_id`) REFERENCES `vnd_pedido_item`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
