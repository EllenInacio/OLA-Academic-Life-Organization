-- O limite de faltas deixa de ser um percentual (DECIMAL, padrão 25) e passa a ser
-- a quantidade de faltas permitidas no semestre (INTEGER, opcional).
--
-- Conversão dos dados já cadastrados: disciplinas com carga horária recebem a mesma
-- quantidade que o sistema calculava antes (carga horária × percentual, arredondado
-- para baixo, 1 aula por hora); disciplinas sem carga horária ficam sem limite.

-- AlterTable
ALTER TABLE "disciplina" ALTER COLUMN "limite_faltas" DROP DEFAULT;
ALTER TABLE "disciplina" ALTER COLUMN "limite_faltas" DROP NOT NULL;
ALTER TABLE "disciplina" ALTER COLUMN "limite_faltas" SET DATA TYPE INTEGER
  USING (
    CASE
      WHEN "carga_horaria" IS NULL THEN NULL
      ELSE FLOOR("carga_horaria" * "limite_faltas" / 100)::INTEGER
    END
  );
