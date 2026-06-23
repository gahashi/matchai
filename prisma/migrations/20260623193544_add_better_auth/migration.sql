-- CreateTable
CREATE TABLE `sys_auth_user` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    `image` VARCHAR(255) NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL,
    `sys_usuario_id` INTEGER NOT NULL,

    UNIQUE INDEX `sys_auth_user_email_key`(`email`),
    UNIQUE INDEX `sys_auth_user_sys_usuario_id_key`(`sys_usuario_id`),
    INDEX `sys_auth_user_fk1`(`sys_usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_auth_session` (
    `id` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(0) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL,
    `ipAddress` VARCHAR(45) NULL,
    `userAgent` TEXT NULL,
    `user_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `sys_auth_session_token_key`(`token`),
    INDEX `sys_auth_session_fk1`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_auth_account` (
    `id` VARCHAR(191) NOT NULL,
    `account_id` VARCHAR(191) NOT NULL,
    `provider_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `access_token` TEXT NULL,
    `refresh_token` TEXT NULL,
    `id_token` TEXT NULL,
    `access_token_expires_at` DATETIME(0) NULL,
    `refresh_token_expires_at` DATETIME(0) NULL,
    `scope` TEXT NULL,
    `password` TEXT NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL,

    INDEX `sys_auth_account_fk1`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sys_auth_verification` (
    `id` VARCHAR(191) NOT NULL,
    `identifier` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `expiresAt` DATETIME(0) NOT NULL,
    `createdAt` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NULL,

    INDEX `sys_auth_verification_identifier_idx`(`identifier`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `sys_auth_user` ADD CONSTRAINT `sys_auth_user_sys_usuario_id_fkey` FOREIGN KEY (`sys_usuario_id`) REFERENCES `sys_usuario`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_auth_session` ADD CONSTRAINT `sys_auth_session_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `sys_auth_user`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `sys_auth_account` ADD CONSTRAINT `sys_auth_account_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `sys_auth_user`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;
