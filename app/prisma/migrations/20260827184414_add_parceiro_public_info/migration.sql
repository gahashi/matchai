-- AlterTable
ALTER TABLE `par_parceiro` ADD COLUMN `email_contato` VARCHAR(190) NULL,
    ADD COLUMN `endereco` VARCHAR(500) NULL,
    ADD COLUMN `google_maps_url` VARCHAR(1000) NULL,
    ADD COLUMN `horario_funcionamento` TEXT NULL,
    ADD COLUMN `instagram_url` VARCHAR(1000) NULL,
    ADD COLUMN `site_url` VARCHAR(1000) NULL,
    ADD COLUMN `telefone` VARCHAR(30) NULL,
    ADD COLUMN `whatsapp` VARCHAR(30) NULL;
