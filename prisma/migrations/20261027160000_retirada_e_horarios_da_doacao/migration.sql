-- AlterEnum
ALTER TYPE "StatusDaDoacao" ADD VALUE 'retirada';

-- AlterTable
-- aceita_em e retirada_em são os dois instantes que o OBJ-01 mede: a mediana de
-- horas entre a publicação (criada_em) e a confirmação da retirada. As doações
-- que já existem ficam com os dois campos nulos, porque ninguém registrou essas
-- horas antes desta mudança (ADR 0008).
ALTER TABLE "doacoes" ADD COLUMN     "aceita_em" TIMESTAMP(3),
ADD COLUMN     "retirada_em" TIMESTAMP(3);
