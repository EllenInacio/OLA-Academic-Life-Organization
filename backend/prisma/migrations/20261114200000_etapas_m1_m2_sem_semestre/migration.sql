-- A disciplina deixa de ter o campo "semestre". No lugar, cada avaliação passa a pertencer
-- a uma etapa (M1 ou M2) e a disciplina guarda o peso de cada etapa na média final:
-- (M1 × peso_m1 + M2 × peso_m2) ÷ (peso_m1 + peso_m2). Pesos iguais = média simples.
--
-- Dados já cadastrados: as avaliações existentes ficam na M1 (dá para mudar depois na tela
-- de Notas e frequência) e os pesos começam em 1 e 1.

-- CreateEnum
CREATE TYPE "EtapaAvaliacao" AS ENUM ('M1', 'M2');

-- AlterTable
ALTER TABLE "disciplina" DROP COLUMN "semestre",
ADD COLUMN     "peso_m1" DECIMAL(5,2) NOT NULL DEFAULT 1,
ADD COLUMN     "peso_m2" DECIMAL(5,2) NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "evento" ADD COLUMN     "etapa" "EtapaAvaliacao" NOT NULL DEFAULT 'M1';
