-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('PROVA', 'TRABALHO', 'ENTREGA');

-- CreateEnum
CREATE TYPE "StatusEvento" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO');

-- CreateTable
CREATE TABLE "disciplina" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "professor" VARCHAR(120),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disciplina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evento" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "tipo" "TipoEvento" NOT NULL,
    "data" DATE NOT NULL,
    "peso" DECIMAL(5,2) NOT NULL,
    "status" "StatusEvento" NOT NULL DEFAULT 'PENDENTE',
    "disciplina_id" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "disciplina_nome_key" ON "disciplina"("nome");

-- CreateIndex
CREATE INDEX "evento_data_idx" ON "evento"("data");

-- AddForeignKey
ALTER TABLE "evento" ADD CONSTRAINT "evento_disciplina_id_fkey" FOREIGN KEY ("disciplina_id") REFERENCES "disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;
