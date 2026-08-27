-- AlterTable
ALTER TABLE `soc_plano` ADD COLUMN `banner_sys_arquivo_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `soc_plano_banner_sys_arquivo_id_idx` ON `soc_plano`(`banner_sys_arquivo_id`);

-- AddForeignKey
ALTER TABLE `soc_plano` ADD CONSTRAINT `soc_plano_banner_sys_arquivo_id_fkey` FOREIGN KEY (`banner_sys_arquivo_id`) REFERENCES `sys_arquivo`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;
