/*
  Warnings:

  - You are about to drop the `doa_arrecadacao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `doa_arrecadacao_origem_tipo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `doa_arrecadacao_tipo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `doa_despesa` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `doa_distribuicao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `doa_distribuicao_item` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `doa_evento` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `doa_evento_conteudo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `doa_evento_foto` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `doa_evento_status` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `doa_evento_usuario` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `doa_evento_usuario_tipo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `doa_familia` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `doa_ponto_coleta` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `doa_arrecadacao` DROP FOREIGN KEY `doa_arrecadacao_created_by_sys_usuario_id_fkey`;

-- DropForeignKey
ALTER TABLE `doa_arrecadacao` DROP FOREIGN KEY `doa_arrecadacao_doa_arrecadacao_origem_tipo_id_fkey`;

-- DropForeignKey
ALTER TABLE `doa_arrecadacao` DROP FOREIGN KEY `doa_arrecadacao_doa_arrecadacao_tipo_id_fkey`;

-- DropForeignKey
ALTER TABLE `doa_arrecadacao` DROP FOREIGN KEY `doa_arrecadacao_doa_evento_id_fkey`;

-- DropForeignKey
ALTER TABLE `doa_arrecadacao` DROP FOREIGN KEY `doa_arrecadacao_doa_ponto_coleta_id_fkey`;

-- DropForeignKey
ALTER TABLE `doa_arrecadacao` DROP FOREIGN KEY `doa_arrecadacao_foto_sys_arquivo_id_fkey`;

-- DropForeignKey
ALTER TABLE `doa_despesa` DROP FOREIGN KEY `doa_despesa_comprovante_sys_arquivo_id_fkey`;

-- DropForeignKey
ALTER TABLE `doa_despesa` DROP FOREIGN KEY `doa_despesa_created_by_sys_usuario_id_fkey`;

-- DropForeignKey
ALTER TABLE `doa_despesa` DROP FOREIGN KEY `doa_despesa_doa_evento_id_fkey`;

-- DropForeignKey
ALTER TABLE `doa_distribuicao` DROP FOREIGN KEY `doa_distribuicao_created_by_sys_usuario_id_fkey`;

-- DropForeignKey
ALTER TABLE `doa_distribuicao` DROP FOREIGN KEY `doa_distribuicao_doa_evento_id_fkey`;

-- DropForeignKey
ALTER TABLE `doa_distribuicao` DROP FOREIGN KEY `doa_distribuicao_doa_familia_id_fkey`;

-- DropForeignKey
ALTER TABLE `doa_distribuicao_item` DROP FOREIGN KEY `doa_distribuicao_item_doa_arrecadacao_id_fkey`;

-- DropForeignKey
ALTER TABLE `doa_distribuicao_item` DROP FOREIGN KEY `doa_distribuicao_item_doa_distribuicao_id_fkey`;

-- DropForeignKey
ALTER TABLE `doa_evento` DROP FOREIGN KEY `doa_evento_banner_sys_arquivo_id_fkey`;

-- DropForeignKey
ALTER TABLE `doa_evento` DROP FOREIGN KEY `doa_evento_created_by_sys_usuario_id_fkey`;

-- DropForeignKey
ALTER TABLE `doa_evento` DROP FOREIGN KEY `doa_evento_doa_evento_status_id_fkey`;

-- DropForeignKey
ALTER TABLE `doa_evento_conteudo` DROP FOREIGN KEY `doa_evento_conteudo_doa_evento_id_fkey`;

-- DropForeignKey
ALTER TABLE `doa_evento_foto` DROP FOREIGN KEY `doa_evento_foto_doa_evento_id_fkey`;

-- DropForeignKey
ALTER TABLE `doa_evento_foto` DROP FOREIGN KEY `doa_evento_foto_sys_arquivo_id_fkey`;

-- DropForeignKey
ALTER TABLE `doa_evento_usuario` DROP FOREIGN KEY `doa_evento_usuario_doa_evento_id_fkey`;

-- DropForeignKey
ALTER TABLE `doa_evento_usuario` DROP FOREIGN KEY `doa_evento_usuario_doa_evento_usuario_tipo_id_fkey`;

-- DropForeignKey
ALTER TABLE `doa_evento_usuario` DROP FOREIGN KEY `doa_evento_usuario_sys_usuario_id_fkey`;

-- DropForeignKey
ALTER TABLE `doa_familia` DROP FOREIGN KEY `doa_familia_created_by_sys_usuario_id_fkey`;

-- DropForeignKey
ALTER TABLE `doa_familia` DROP FOREIGN KEY `doa_familia_doa_evento_id_fkey`;

-- DropForeignKey
ALTER TABLE `doa_ponto_coleta` DROP FOREIGN KEY `doa_ponto_coleta_created_by_sys_usuario_id_fkey`;

-- DropForeignKey
ALTER TABLE `doa_ponto_coleta` DROP FOREIGN KEY `doa_ponto_coleta_doa_evento_id_fkey`;

-- DropForeignKey
ALTER TABLE `doa_ponto_coleta` DROP FOREIGN KEY `doa_ponto_coleta_foto_sys_arquivo_id_fkey`;

-- AlterTable
ALTER TABLE `prd_produto` ADD COLUMN `compra_unica_por_usuario` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `somente_socio` INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE `doa_arrecadacao`;

-- DropTable
DROP TABLE `doa_arrecadacao_origem_tipo`;

-- DropTable
DROP TABLE `doa_arrecadacao_tipo`;

-- DropTable
DROP TABLE `doa_despesa`;

-- DropTable
DROP TABLE `doa_distribuicao`;

-- DropTable
DROP TABLE `doa_distribuicao_item`;

-- DropTable
DROP TABLE `doa_evento`;

-- DropTable
DROP TABLE `doa_evento_conteudo`;

-- DropTable
DROP TABLE `doa_evento_foto`;

-- DropTable
DROP TABLE `doa_evento_status`;

-- DropTable
DROP TABLE `doa_evento_usuario`;

-- DropTable
DROP TABLE `doa_evento_usuario_tipo`;

-- DropTable
DROP TABLE `doa_familia`;

-- DropTable
DROP TABLE `doa_ponto_coleta`;
