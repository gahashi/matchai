-- CreateTable
CREATE TABLE `sys_analytics_evento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sys_usuario_id` INTEGER NULL,
    `session_id` VARCHAR(100) NOT NULL,
    `tipo` VARCHAR(40) NOT NULL,
    `nome` VARCHAR(100) NULL,
    `rota` VARCHAR(500) NOT NULL,
    `rota_anterior` VARCHAR(500) NULL,
    `entidade_tipo` VARCHAR(50) NULL,
    `entidade_id` INTEGER NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `sys_analytics_evento_sys_usuario_id_idx`(`sys_usuario_id`),
    INDEX `sys_analytics_evento_session_id_idx`(`session_id`),
    INDEX `sys_analytics_evento_tipo_idx`(`tipo`),
    INDEX `sys_analytics_evento_nome_idx`(`nome`),
    INDEX `sys_analytics_evento_rota_idx`(`rota`),
    INDEX `sys_analytics_evento_entidade_tipo_entidade_id_idx`(`entidade_tipo`, `entidade_id`),
    INDEX `sys_analytics_evento_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sys_analytics_evento` ADD CONSTRAINT `sys_analytics_evento_sys_usuario_id_fkey` FOREIGN KEY (`sys_usuario_id`) REFERENCES `sys_usuario`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;
