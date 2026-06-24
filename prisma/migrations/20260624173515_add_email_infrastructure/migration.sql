-- AlterTable
ALTER TABLE `sys_usuario` ADD COLUMN `email_verificado_at` DATETIME(0) NULL,
    ADD COLUMN `perfil_completo` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `ultimo_login_at` DATETIME(0) NULL,
    MODIFY `senha_hash` VARCHAR(255) NULL;

-- CreateTable
CREATE TABLE `sys_email_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sys_usuario_id` INTEGER NULL,
    `email_to` VARCHAR(180) NOT NULL,
    `email_from` VARCHAR(180) NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `template` VARCHAR(100) NULL,
    `provider` VARCHAR(50) NOT NULL DEFAULT 'smtp',
    `status` VARCHAR(50) NOT NULL DEFAULT 'sent',
    `message_id` VARCHAR(255) NULL,
    `error_message` TEXT NULL,
    `metadata_text` TEXT NULL,
    `sent_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    INDEX `sys_email_log_fk1`(`sys_usuario_id`),
    INDEX `sys_email_log_email_to_idx`(`email_to`),
    INDEX `sys_email_log_status_idx`(`status`),
    INDEX `sys_email_log_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_email_verification_code` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sys_usuario_id` INTEGER NULL,
    `email` VARCHAR(180) NOT NULL,
    `tipo` VARCHAR(80) NOT NULL DEFAULT 'email_verification',
    `codigo_hash` VARCHAR(255) NOT NULL,
    `tentativas` INTEGER NOT NULL DEFAULT 0,
    `max_tentativas` INTEGER NOT NULL DEFAULT 5,
    `expires_at` DATETIME(0) NOT NULL,
    `used_at` DATETIME(0) NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `sys_email_verification_code_fk1`(`sys_usuario_id`),
    INDEX `sys_email_verification_code_email_idx`(`email`),
    INDEX `sys_email_verification_code_tipo_idx`(`tipo`),
    INDEX `sys_email_verification_code_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sys_email_log` ADD CONSTRAINT `sys_email_log_sys_usuario_id_fkey` FOREIGN KEY (`sys_usuario_id`) REFERENCES `sys_usuario`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_email_verification_code` ADD CONSTRAINT `sys_email_verification_code_sys_usuario_id_fkey` FOREIGN KEY (`sys_usuario_id`) REFERENCES `sys_usuario`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
