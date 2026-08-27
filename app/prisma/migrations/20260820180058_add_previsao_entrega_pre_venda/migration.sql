-- AlterTable
ALTER TABLE `prd_produto` ADD COLUMN `previsao_entrega` DATE NULL;

-- AlterTable
ALTER TABLE `vnd_pedido_item` ADD COLUMN `previsao_entrega_snapshot` DATE NULL;
