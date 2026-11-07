-- CreateEnum
CREATE TYPE "RegraMedia" AS ENUM ('PONDERADA', 'ARITMETICA');

-- AlterTable
ALTER TABLE "disciplina" ADD COLUMN     "limite_faltas" DECIMAL(5,2) NOT NULL DEFAULT 25,
ADD COLUMN     "media_aprovacao" DECIMAL(4,2),
ADD COLUMN     "regra_media" "RegraMedia" NOT NULL DEFAULT 'PONDERADA';

-- AlterTable
ALTER TABLE "evento" ADD COLUMN     "nota" DECIMAL(5,2),
ADD COLUMN     "nota_maxima" DECIMAL(5,2) NOT NULL DEFAULT 10;

-- CreateTable
CREATE TABLE "registro_frequencia" (
    "id" SERIAL NOT NULL,
    "data" DATE NOT NULL,
    "quantidade_aulas" INTEGER NOT NULL DEFAULT 1,
    "faltas" INTEGER NOT NULL DEFAULT 0,
    "disciplina_id" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registro_frequencia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "registro_frequencia_disciplina_id_data_key" ON "registro_frequencia"("disciplina_id", "data");

-- AddForeignKey
ALTER TABLE "registro_frequencia" ADD CONSTRAINT "registro_frequencia_disciplina_id_fkey" FOREIGN KEY ("disciplina_id") REFERENCES "disciplina"("id") ON DELETE CASCADE ON UPDATE CASCADE;
