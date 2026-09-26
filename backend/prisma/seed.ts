import "dotenv/config";
import speakeasy from "speakeasy";
import { prisma } from "../src/config/prisma";
import { criptografar } from "../src/utils/criptografia";
import { gerarHashSenha } from "../src/utils/senha";
import { VERSAO_TERMOS } from "../src/types/lgpd";

const EMAIL_TESTE = "estudante@example.com";
const SENHA_TESTE = "Teste@2026";

function diasAPartirDeHoje(dias: number) {
  const data = new Date();
  data.setUTCHours(0, 0, 0, 0);
  data.setUTCDate(data.getUTCDate() + dias);
  return data;
}

async function main() {
  const existente = await prisma.usuario.findUnique({ where: { email: EMAIL_TESTE } });

  if (existente) {
    console.log(`Usuário de teste já existe: ${EMAIL_TESTE} / ${SENHA_TESTE}`);
    return;
  }

  const segredo = speakeasy.generateSecret({ name: `OLA (${EMAIL_TESTE})` });

  const usuario = await prisma.usuario.create({
    data: {
      nome: "Estudante Teste",
      email: EMAIL_TESTE,
      senhaHash: await gerarHashSenha(SENHA_TESTE),
      segredo2fa: criptografar(segredo.base32),
      consentimentoEm: new Date(),
      consentimentoVersao: VERSAO_TERMOS,
    },
  });

  const engenharia = await prisma.disciplina.create({
    data: { nome: "Engenharia de Software", professor: "Prof. Exemplo", usuarioId: usuario.id },
  });

  const banco = await prisma.disciplina.create({
    data: { nome: "Banco de Dados", usuarioId: usuario.id },
  });

  await prisma.evento.createMany({
    data: [
      { titulo: "Prova 1", tipo: "PROVA", data: diasAPartirDeHoje(3), peso: 3, disciplinaId: banco.id },
      {
        titulo: "Trabalho de modelagem",
        tipo: "TRABALHO",
        data: diasAPartirDeHoje(10),
        peso: 2,
        status: "EM_ANDAMENTO",
        disciplinaId: engenharia.id,
      },
      { titulo: "Entrega do relatório", tipo: "ENTREGA", data: diasAPartirDeHoje(17), peso: 1, disciplinaId: engenharia.id },
    ],
  });

  console.log("Usuário de teste criado.");
  console.log(`  E-mail: ${EMAIL_TESTE}`);
  console.log(`  Senha:  ${SENHA_TESTE}`);
  console.log(`  Chave para o app autenticador (opcional): ${segredo.base32}`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
