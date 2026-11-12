-- CreateTable
CREATE TABLE "mudancas_de_localidade" (
    "id" SERIAL NOT NULL,
    "conta_id" INTEGER NOT NULL,
    "estado_anterior" TEXT NOT NULL,
    "cidade_anterior" TEXT NOT NULL,
    "estado_novo" TEXT NOT NULL,
    "cidade_novo" TEXT NOT NULL,
    "mudada_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mudancas_de_localidade_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "mudancas_de_localidade" ADD CONSTRAINT "mudancas_de_localidade_conta_id_fkey" FOREIGN KEY ("conta_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- A tabela nasce vazia, de propósito. As mudanças de cidade que aconteceram
-- antes desta migration não foram gravadas em lugar nenhum — era exatamente a
-- dívida que o ADR 0011 registrou — e inventar linha para elas seria inventar
-- data e cidade de origem. O rastro começa aqui, e isso está no ADR 0012.
