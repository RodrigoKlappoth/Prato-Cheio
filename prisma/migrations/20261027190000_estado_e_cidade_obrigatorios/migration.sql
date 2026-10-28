-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "estado" TEXT;

-- Toda conta passa a ter estado e cidade (ADR 0009), inclusive a de doador.
-- As contas criadas antes desta mudança não tinham cidade nenhuma, e a rede
-- atende Santa Catarina, a partir de Joinville: é esse o valor que elas
-- recebem, para as duas colunas poderem virar obrigatórias.
--
-- Atenção para quem aplicar esta migration num banco com dados: a cidade,
-- antes desta mudança, era texto livre, então pode haver valor que não existe
-- na lista de src/localidades.js. A conta continua funcionando, mas não vai
-- casar com nenhuma cidade da lista — a correção é atualizar essas linhas à
-- mão para uma cidade atendida.
UPDATE "usuarios" SET "estado" = 'SC' WHERE "estado" IS NULL;
UPDATE "usuarios" SET "cidade" = 'Joinville' WHERE "cidade" IS NULL;

-- AlterTable
ALTER TABLE "usuarios" ALTER COLUMN "estado" SET NOT NULL,
ALTER COLUMN "cidade" SET NOT NULL;
