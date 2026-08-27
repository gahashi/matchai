CREATE TABLE `crd_promocao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `par_parceiro_id` INTEGER NOT NULL,
    `imagem_sys_arquivo_id` INTEGER NULL,
    `titulo` VARCHAR(150) NOT NULL,
    `descricao` TEXT NULL,
    `preco_promocional` DECIMAL(10, 2) NULL,
    `validade_inicio` DATE NULL,
    `validade_fim` DATE NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `exibir_tv` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    INDEX `crd_promocao_par_parceiro_id_idx`(`par_parceiro_id`),
    INDEX `crd_promocao_imagem_sys_arquivo_id_idx`(`imagem_sys_arquivo_id`),
    INDEX `crd_promocao_par_parceiro_id_ativo_idx`(`par_parceiro_id`, `ativo`),
    INDEX `crd_promocao_par_parceiro_id_ativo_exibir_tv_idx`(`par_parceiro_id`, `ativo`, `exibir_tv`),
    INDEX `crd_promocao_validade_inicio_validade_fim_idx`(`validade_inicio`, `validade_fim`),
    INDEX `crd_promocao_ordem_idx`(`ordem`),
    INDEX `crd_promocao_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `crd_promocao_item` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `crd_promocao_id` INTEGER NOT NULL,
    `crd_item_id` INTEGER NOT NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `crd_promocao_item_crd_promocao_id_crd_item_id_key`(`crd_promocao_id`, `crd_item_id`),
    INDEX `crd_promocao_item_crd_promocao_id_ordem_idx`(`crd_promocao_id`, `ordem`),
    INDEX `crd_promocao_item_crd_item_id_idx`(`crd_item_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `crd_promocao_horario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `crd_promocao_id` INTEGER NOT NULL,
    `dia_semana` INTEGER NOT NULL,
    `hora_inicio` TIME(0) NOT NULL,
    `hora_fim` TIME(0) NOT NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    INDEX `crd_promocao_horario_crd_promocao_id_idx`(`crd_promocao_id`),
    INDEX `crd_promocao_horario_dia_semana_hora_inicio_hora_fim_idx`(`dia_semana`, `hora_inicio`, `hora_fim`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `crd_promocao`
    ADD CONSTRAINT `crd_promocao_par_parceiro_id_fkey`
    FOREIGN KEY (`par_parceiro_id`)
    REFERENCES `par_parceiro`(`id`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT;

ALTER TABLE `crd_promocao`
    ADD CONSTRAINT `crd_promocao_imagem_sys_arquivo_id_fkey`
    FOREIGN KEY (`imagem_sys_arquivo_id`)
    REFERENCES `sys_arquivo`(`id`)
    ON DELETE SET NULL
    ON UPDATE RESTRICT;

ALTER TABLE `crd_promocao_item`
    ADD CONSTRAINT `crd_promocao_item_crd_promocao_id_fkey`
    FOREIGN KEY (`crd_promocao_id`)
    REFERENCES `crd_promocao`(`id`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT;

ALTER TABLE `crd_promocao_item`
    ADD CONSTRAINT `crd_promocao_item_crd_item_id_fkey`
    FOREIGN KEY (`crd_item_id`)
    REFERENCES `crd_item`(`id`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT;

ALTER TABLE `crd_promocao_horario`
    ADD CONSTRAINT `crd_promocao_horario_crd_promocao_id_fkey`
    FOREIGN KEY (`crd_promocao_id`)
    REFERENCES `crd_promocao`(`id`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT;
