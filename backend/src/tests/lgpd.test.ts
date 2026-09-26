import request from "supertest";
import app from "../app";
import { prisma } from "../config/prisma";
import { limparBanco } from "./banco";
import { criarUsuarioDeTeste, SENHA_DE_TESTE } from "./usuarioDeTeste";

let autorizacao: Record<string, string>;
let usuarioId: number;

async function criarDadosAcademicos() {
  const disciplina = await request(app)
    .post("/api/disciplinas")
    .set(autorizacao)
    .send({ nome: "Engenharia de Software" });

  await request(app).post("/api/eventos").set(autorizacao).send({
    titulo: "Entrega do PFC",
    tipo: "ENTREGA",
    data: "2026-11-23",
    peso: 5,
    disciplinaId: disciplina.body.id,
  });
}

describe("LGPD", () => {
  beforeEach(async () => {
    await limparBanco();
    const criado = await criarUsuarioDeTeste();
    autorizacao = criado.autorizacao;
    usuarioId = criado.usuario.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("exige autenticação", async () => {
    const resposta = await request(app).get("/api/lgpd/dados");
    expect(resposta.status).toBe(401);
  });

  it("consulta os dados do titular sem expor segredos", async () => {
    await criarDadosAcademicos();

    const resposta = await request(app).get("/api/lgpd/dados").set(autorizacao);

    expect(resposta.status).toBe(200);
    expect(resposta.body.dadosPessoais.email).toBe("aluna@example.com");
    expect(resposta.body.dadosAcademicos).toEqual({ disciplinas: 1, eventos: 1 });
    expect(JSON.stringify(resposta.body)).not.toMatch(/senhaHash|segredo2fa|argon2/);
  });

  it("exporta os dados pessoais e acadêmicos", async () => {
    await criarDadosAcademicos();

    const resposta = await request(app).get("/api/lgpd/exportar").set(autorizacao);

    expect(resposta.status).toBe(200);
    expect(resposta.headers["content-disposition"]).toContain("attachment");
    expect(resposta.body.disciplinas[0].eventos[0].titulo).toBe("Entrega do PFC");
    expect(JSON.stringify(resposta.body)).not.toMatch(/senhaHash|segredo2fa|argon2/);
  });

  it("lista o histórico de auditoria do próprio usuário", async () => {
    await criarDadosAcademicos();

    const resposta = await request(app).get("/api/lgpd/logs").set(autorizacao);

    expect(resposta.status).toBe(200);
    expect(resposta.body.logs.map((log: { acao: string }) => log.acao)).toEqual([
      "EVENTO_CRIADO",
      "DISCIPLINA_CRIADA",
    ]);
  });

  it("revoga o consentimento, encerra a sessão e bloqueia novo login", async () => {
    const resposta = await request(app)
      .post("/api/lgpd/revogar-consentimento")
      .set(autorizacao);
    expect(resposta.status).toBe(200);

    const depois = await request(app).get("/api/eventos").set(autorizacao);
    expect(depois.status).toBe(401);

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "aluna@example.com", senha: SENHA_DE_TESTE });
    expect(login.status).toBe(403);
  });

  it("exclui a conta com os dados acadêmicos e mantém o log desvinculado", async () => {
    await criarDadosAcademicos();

    const resposta = await request(app).delete("/api/lgpd/conta").set(autorizacao);
    expect(resposta.status).toBe(200);

    expect(await prisma.usuario.count()).toBe(0);
    expect(await prisma.disciplina.count()).toBe(0);
    expect(await prisma.evento.count()).toBe(0);

    const logExclusao = await prisma.logAuditoria.findFirst({
      where: { acao: "LGPD_CONTA_EXCLUIDA" },
    });
    expect(logExclusao).not.toBeNull();
    expect(logExclusao!.usuarioId).toBeNull();
    expect(await prisma.logAuditoria.count({ where: { usuarioId } })).toBe(0);
  });
});
