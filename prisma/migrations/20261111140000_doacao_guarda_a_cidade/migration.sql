-- AlterTable
ALTER TABLE "doacoes" ADD COLUMN     "estado" TEXT,
ADD COLUMN     "cidade" TEXT;

-- A doação passa a guardar onde a comida está, em vez de ler isso pela conta de
-- quem publicou (ADR 0011). Até aqui a relação dava sempre a resposta certa,
-- porque a conta não podia mudar de cidade; com a conta editável (H-09), ler
-- pela relação faria a doação de ontem trocar de cidade junto com o doador.
--
-- As doações que já existem recebem a localidade atual da conta de quem
-- publicou: é o mesmo valor que o sistema usava para elas até agora, então
-- nenhuma lista muda ao aplicar esta migration.
UPDATE "doacoes"
SET "estado" = "usuarios"."estado", "cidade" = "usuarios"."cidade"
FROM "usuarios"
WHERE "doacoes"."doador_id" = "usuarios"."id";

-- AlterTable
ALTER TABLE "doacoes" ALTER COLUMN "estado" SET NOT NULL,
ALTER COLUMN "cidade" SET NOT NULL;
