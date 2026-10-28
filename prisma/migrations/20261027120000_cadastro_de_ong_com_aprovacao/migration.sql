-- AlterEnum
ALTER TYPE "Papel" ADD VALUE 'coordenacao';

-- CreateEnum
CREATE TYPE "SituacaoDaConta" AS ENUM ('pendente', 'aprovada', 'recusada');

-- AlterTable
-- O DEFAULT 'aprovada' aplica a regra do ADR 0006 "as ONGs que já existem
-- continuam aprovadas": as contas criadas antes desta migration não ficam
-- bloqueadas quando ela for aplicada no Neon.
ALTER TABLE "usuarios" ADD COLUMN     "avaliada_em" TIMESTAMP(3),
ADD COLUMN     "avaliada_por_id" INTEGER,
ADD COLUMN     "cidade" TEXT,
ADD COLUMN     "situacao" "SituacaoDaConta" NOT NULL DEFAULT 'aprovada';

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_avaliada_por_id_fkey" FOREIGN KEY ("avaliada_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
