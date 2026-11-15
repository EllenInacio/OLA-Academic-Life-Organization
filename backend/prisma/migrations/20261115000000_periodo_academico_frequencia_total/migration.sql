-- Cadastro de disciplinas: período acadêmico (semestre do curso ou Exame/Recuperação) e os dados
-- do cálculo automático da carga horária (duração de cada aula e aulas descontadas por feriado
-- ou cancelamento). A carga horária passa a ser o total de aulas usado no percentual de frequência.
--
-- Notas: o peso padrão da M2 na média final passa a ser 2 (M1 = 1, M2 = 2). As disciplinas que
-- ainda estavam com os pesos padrão antigos (1 e 1) são atualizadas; pesos alterados pelo aluno
-- são mantidos.

-- CreateEnum
CREATE TYPE "PeriodoTipo" AS ENUM ('SEMESTRE', 'EXAME');

-- AlterTable
ALTER TABLE "disciplina" ADD COLUMN     "periodo_tipo" "PeriodoTipo",
ADD COLUMN     "periodo_numero" INTEGER,
ADD COLUMN     "duracao_aula" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "aulas_descontadas" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "peso_m2" SET DEFAULT 2;

-- Pesos padrão antigos (1 e 1) → novos (1 e 2)
UPDATE "disciplina" SET "peso_m2" = 2 WHERE "peso_m1" = 1 AND "peso_m2" = 1;
