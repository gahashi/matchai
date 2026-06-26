-- CreateTable
CREATE TABLE `sys_auth_login_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sys_usuario_id` INTEGER NULL,
    `email` VARCHAR(150) NULL,
    `evento` VARCHAR(80) NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `device_text` VARCHAR(255) NULL,
    `location_text` VARCHAR(255) NULL,
    `error_message` TEXT NULL,
    `metadata_text` TEXT NULL,
    `created_at` DATETIME(0) NULL,

    INDEX `sys_auth_login_log_fk1`(`sys_usuario_id`),
    INDEX `sys_auth_login_log_email_idx`(`email`),
    INDEX `sys_auth_login_log_evento_idx`(`evento`),
    INDEX `sys_auth_login_log_status_idx`(`status`),
    INDEX `sys_auth_login_log_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sys_auth_login_log` ADD CONSTRAINT `sys_auth_login_log_sys_usuario_id_fkey` FOREIGN KEY (`sys_usuario_id`) REFERENCES `sys_usuario`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
