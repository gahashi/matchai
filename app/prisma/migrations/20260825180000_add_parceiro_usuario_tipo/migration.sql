CREATE TABLE `par_parceiro_usuario_tipo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(50) NOT NULL,
    `nome` VARCHAR(100) NOT NULL,
    `descricao` VARCHAR(255) NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `par_parceiro_usuario_tipo_codigo_key`(`codigo`),
    INDEX `par_parceiro_usuario_tipo_ativo_idx`(`ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `par_parceiro_usuario_tipo`
    (`codigo`, `nome`, `descricao`, `ativo`, `created_at`, `updated_at`)
VALUES
    ('proprietario', 'Proprietário', 'Responsável principal pelo parceiro e pela gestão de acessos.', 1, NOW(), NOW()),
    ('administrador', 'Administrador', 'Pode operar o parceiro e gerenciar membros comuns.', 1, NOW(), NOW()),
    ('membro', 'Membro', 'Pode acessar os recursos operacionais liberados para o parceiro.', 1, NOW(), NOW());

ALTER TABLE `par_parceiro_usuario`
    ADD COLUMN `par_parceiro_usuario_tipo_id` INTEGER NULL;

UPDATE `par_parceiro_usuario` AS `ppu`
INNER JOIN `par_parceiro_usuario_tipo` AS `tipo`
    ON `tipo`.`codigo` = 'proprietario'
SET `ppu`.`par_parceiro_usuario_tipo_id` = `tipo`.`id`
WHERE `ppu`.`par_parceiro_usuario_tipo_id` IS NULL;

ALTER TABLE `par_parceiro_usuario`
    MODIFY `par_parceiro_usuario_tipo_id` INTEGER NOT NULL;

CREATE INDEX `par_parceiro_usuario_par_parceiro_usuario_tipo_id_idx`
    ON `par_parceiro_usuario`(`par_parceiro_usuario_tipo_id`);

ALTER TABLE `par_parceiro_usuario`
    ADD CONSTRAINT `par_parceiro_usuario_par_parceiro_usuario_tipo_id_fkey`
    FOREIGN KEY (`par_parceiro_usuario_tipo_id`)
    REFERENCES `par_parceiro_usuario_tipo`(`id`)
    ON DELETE RESTRICT
    ON UPDATE RESTRICT;
