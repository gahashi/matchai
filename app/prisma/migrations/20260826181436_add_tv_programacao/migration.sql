-- AlterTable
ALTER TABLE `cad_evento` ADD COLUMN `par_parceiro_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `tv_exibicao_tipo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(50) NOT NULL,
    `nome` VARCHAR(100) NOT NULL,
    `descricao` VARCHAR(255) NULL,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    UNIQUE INDEX `tv_exibicao_tipo_codigo_key`(`codigo`),
    INDEX `tv_exibicao_tipo_ativo_idx`(`ativo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tv_exibicao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tv_exibicao_tipo_id` INTEGER NOT NULL,
    `par_parceiro_id` INTEGER NULL,
    `cad_evento_id` INTEGER NULL,
    `crd_promocao_id` INTEGER NULL,
    `midia_sys_arquivo_id` INTEGER NULL,
    `titulo` VARCHAR(150) NULL,
    `descricao` TEXT NULL,
    `link` VARCHAR(1000) NULL,
    `kicker` VARCHAR(120) NULL,
    `cor_destaque` VARCHAR(20) NULL,
    `duracao_segundos` INTEGER NULL,
    `ordem` INTEGER NOT NULL DEFAULT 0,
    `ativo` INTEGER NOT NULL DEFAULT 1,
    `inicio_exibicao` DATETIME(0) NULL,
    `fim_exibicao` DATETIME(0) NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `deleted_at` DATETIME(0) NULL,

    UNIQUE INDEX `tv_exibicao_cad_evento_id_key`(`cad_evento_id`),
    UNIQUE INDEX `tv_exibicao_crd_promocao_id_key`(`crd_promocao_id`),
    INDEX `tv_exibicao_tv_exibicao_tipo_id_idx`(`tv_exibicao_tipo_id`),
    INDEX `tv_exibicao_par_parceiro_id_idx`(`par_parceiro_id`),
    INDEX `tv_exibicao_par_parceiro_id_ativo_idx`(`par_parceiro_id`, `ativo`),
    INDEX `tv_exibicao_midia_sys_arquivo_id_idx`(`midia_sys_arquivo_id`),
    INDEX `tv_exibicao_inicio_exibicao_fim_exibicao_idx`(`inicio_exibicao`, `fim_exibicao`),
    INDEX `tv_exibicao_ordem_idx`(`ordem`),
    INDEX `tv_exibicao_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tv_exibicao_horario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tv_exibicao_id` INTEGER NOT NULL,
    `dia_semana` INTEGER NOT NULL,
    `hora_inicio` TIME(0) NOT NULL,
    `hora_fim` TIME(0) NOT NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    INDEX `tv_exibicao_horario_tv_exibicao_id_idx`(`tv_exibicao_id`),
    INDEX `tv_exibicao_horario_dia_semana_hora_inicio_hora_fim_idx`(`dia_semana`, `hora_inicio`, `hora_fim`),
    UNIQUE INDEX `tv_exibicao_horario_tv_exibicao_id_dia_semana_hora_inicio_ho_key`(`tv_exibicao_id`, `dia_semana`, `hora_inicio`, `hora_fim`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `cad_evento_par_parceiro_id_idx` ON `cad_evento`(`par_parceiro_id`);

-- CreateIndex
CREATE INDEX `cad_evento_par_parceiro_id_ativo_idx` ON `cad_evento`(`par_parceiro_id`, `ativo`);

-- AddForeignKey
ALTER TABLE `cad_evento` ADD CONSTRAINT `cad_evento_par_parceiro_id_fkey` FOREIGN KEY (`par_parceiro_id`) REFERENCES `par_parceiro`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tv_exibicao` ADD CONSTRAINT `tv_exibicao_tv_exibicao_tipo_id_fkey` FOREIGN KEY (`tv_exibicao_tipo_id`) REFERENCES `tv_exibicao_tipo`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tv_exibicao` ADD CONSTRAINT `tv_exibicao_par_parceiro_id_fkey` FOREIGN KEY (`par_parceiro_id`) REFERENCES `par_parceiro`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tv_exibicao` ADD CONSTRAINT `tv_exibicao_cad_evento_id_fkey` FOREIGN KEY (`cad_evento_id`) REFERENCES `cad_evento`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tv_exibicao` ADD CONSTRAINT `tv_exibicao_crd_promocao_id_fkey` FOREIGN KEY (`crd_promocao_id`) REFERENCES `crd_promocao`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tv_exibicao` ADD CONSTRAINT `tv_exibicao_midia_sys_arquivo_id_fkey` FOREIGN KEY (`midia_sys_arquivo_id`) REFERENCES `sys_arquivo`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tv_exibicao_horario` ADD CONSTRAINT `tv_exibicao_horario_tv_exibicao_id_fkey` FOREIGN KEY (`tv_exibicao_id`) REFERENCES `tv_exibicao`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- =========================================================
-- TV — MIGRAÇÃO DE DADOS EXISTENTES
-- =========================================================
--
-- IMPORTANTE:
-- 1. Primeiro gere a migration Prisma com --create-only usando o novo schema.
-- 2. Cole este bloco NO FINAL do migration.sql gerado.
-- 3. Só então aplique a migration.
--
-- O objetivo é preservar o comportamento atual:
-- - eventos existentes passam a ter uma configuração de TV;
-- - promoções que hoje possuem exibir_tv = 1 entram na nova programação;
-- - promoções com exibir_tv = 0 permanecem disponíveis para serem
--   adicionadas posteriormente pela Central da TV.
-- =========================================================


-- Tipos base da programação.
INSERT INTO tv_exibicao_tipo
(
    codigo,
    nome,
    descricao,
    ativo,
    created_at,
    updated_at
)
VALUES
    (
        'evento',
        'Evento',
        'Exibição vinculada a um evento cadastrado.',
        1,
        NOW(),
        NOW()
    ),
    (
        'promocao',
        'Promoção',
        'Exibição vinculada a uma promoção do cardápio.',
        1,
        NOW(),
        NOW()
    ),
    (
        'divulgacao',
        'Divulgação',
        'Conteúdo livre criado diretamente para a programação da TV.',
        1,
        NOW(),
        NOW()
    )
    ON DUPLICATE KEY UPDATE
                         nome = VALUES(nome),
                         descricao = VALUES(descricao),
                         ativo = VALUES(ativo),
                         updated_at = NOW();


-- Preserva os eventos que atualmente entram automaticamente na TV.
--
-- O campo par_parceiro_id será null para todos os eventos já existentes,
-- pois antes desta migration CadEvento ainda não possuía parceiro.
INSERT INTO tv_exibicao
(
    tv_exibicao_tipo_id,
    par_parceiro_id,
    cad_evento_id,
    crd_promocao_id,
    midia_sys_arquivo_id,
    titulo,
    descricao,
    link,
    kicker,
    cor_destaque,
    duracao_segundos,
    ordem,
    ativo,
    inicio_exibicao,
    fim_exibicao,
    created_at,
    updated_at,
    deleted_at
)
SELECT
    tipo.id,
    evento.par_parceiro_id,
    evento.id,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    evento.ordem,
    1,
    NULL,
    NULL,
    NOW(),
    NOW(),
    NULL
FROM cad_evento evento
         INNER JOIN tv_exibicao_tipo tipo
                    ON tipo.codigo = 'evento'
WHERE
    evento.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM tv_exibicao existente
    WHERE existente.cad_evento_id = evento.id
);


-- Preserva somente as promoções que atualmente estão marcadas para TV.
--
-- A validade e os horários da PROMOÇÃO continuam em crd_promocao e
-- crd_promocao_horario. Nenhum horário é copiado para tv_exibicao_horario,
-- pois agora a agenda da TV será uma camada opcional e independente.
INSERT INTO tv_exibicao
(
    tv_exibicao_tipo_id,
    par_parceiro_id,
    cad_evento_id,
    crd_promocao_id,
    midia_sys_arquivo_id,
    titulo,
    descricao,
    link,
    kicker,
    cor_destaque,
    duracao_segundos,
    ordem,
    ativo,
    inicio_exibicao,
    fim_exibicao,
    created_at,
    updated_at,
    deleted_at
)
SELECT
    tipo.id,
    promocao.par_parceiro_id,
    NULL,
    promocao.id,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    promocao.ordem,
    1,
    NULL,
    NULL,
    NOW(),
    NOW(),
    NULL
FROM crd_promocao promocao
         INNER JOIN tv_exibicao_tipo tipo
                    ON tipo.codigo = 'promocao'
WHERE
    promocao.deleted_at IS NULL
  AND promocao.exibir_tv = 1
  AND NOT EXISTS (
    SELECT 1
    FROM tv_exibicao existente
    WHERE existente.crd_promocao_id = promocao.id
);
