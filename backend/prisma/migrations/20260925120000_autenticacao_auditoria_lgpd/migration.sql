-- DropIndex
DROP INDEX "disciplina_nome_key";

-- AlterTable
ALTER TABLE "disciplina" ADD COLUMN     "usuario_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "usuario" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "email" VARCHAR(160) NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "segredo_2fa" TEXT NOT NULL,
    "versao_token" INTEGER NOT NULL DEFAULT 0,
    "codigo_2fa_hash" TEXT,
    "codigo_2fa_expira_em" TIMESTAMP(3),
    "codigo_recuperacao_hash" TEXT,
    "codigo_recuperacao_expira_em" TIMESTAMP(3),
    "consentimento_em" TIMESTAMP(3) NOT NULL,
    "consentimento_versao" VARCHAR(10) NOT NULL,
    "consentimento_revogado_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_auditoria" (
    "id" SERIAL NOT NULL,
    "acao" VARCHAR(40) NOT NULL,
    "entidade" VARCHAR(40),
    "entidade_id" INTEGER,
    "detalhe" VARCHAR(255),
    "ip" VARCHAR(45),
    "usuario_id" INTEGER,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE INDEX "log_auditoria_usuario_id_idx" ON "log_auditoria"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "disciplina_usuario_id_nome_key" ON "disciplina"("usuario_id", "nome");

-- AddForeignKey
ALTER TABLE "disciplina" ADD CONSTRAINT "disciplina_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "log_auditoria" ADD CONSTRAINT "log_auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
