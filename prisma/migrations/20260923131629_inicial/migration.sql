-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('doador', 'ong');

-- CreateEnum
CREATE TYPE "StatusDaDoacao" AS ENUM ('disponivel', 'aceita');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "papel" "Papel" NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessoes" (
    "token" TEXT NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "expira_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessoes_pkey" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "doacoes" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "quantidade" TEXT NOT NULL,
    "validade" TEXT NOT NULL,
    "status" "StatusDaDoacao" NOT NULL DEFAULT 'disponivel',
    "ong" TEXT,
    "criada_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "doador_id" INTEGER NOT NULL,
    "ong_id" INTEGER,

    CONSTRAINT "doacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- AddForeignKey
ALTER TABLE "sessoes" ADD CONSTRAINT "sessoes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doacoes" ADD CONSTRAINT "doacoes_doador_id_fkey" FOREIGN KEY ("doador_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doacoes" ADD CONSTRAINT "doacoes_ong_id_fkey" FOREIGN KEY ("ong_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

