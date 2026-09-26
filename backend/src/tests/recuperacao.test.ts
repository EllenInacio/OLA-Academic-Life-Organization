import request from "supertest";
import app from "../app";
import { prisma } from "../config/prisma";
import * as emailService from "../services/emailService";
import { limparBanco } from "./banco";
import { criarUsuarioDeTeste } from "./usuarioDeTeste";

jest.mock("../services/emailService");

const enviarCodigoRecuperacao = emailService.enviarCodigoRecuperacao as jest.Mock;

async function solicitarCodigo(email = "aluna@example.com") {
  await request(app).post("/api/auth/recuperacao/solicitar").send({ email });
  return enviarCodigoRecuperacao.mock.calls.at(-1)?.[2] as string;
}

describe("Recuperação de senha", () => {
  beforeEach(async () => {
    await limparBanco();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("responde da mesma forma para e-mail inexistente", async () => {
    const resposta = await request(app)
      .post("/api/auth/recuperacao/solicitar")
      .send({ email: "ninguem@example.com" });

    expect(resposta.status).toBe(200);
    expect(enviarCodigoRecuperacao).not.toHaveBeenCalled();
  });

  it("redefine a senha em três etapas e encerra sessões antigas", async () => {
    const { autorizacao } = await criarUsuarioDeTeste();
    const codigo = await solicitarCodigo();

    const verificacao = await request(app)
      .post("/api/auth/recuperacao/verificar")
      .send({ email: "aluna@example.com", codigo });
    expect(verificacao.status).toBe(200);

    const redefinicao = await request(app)
      .post("/api/auth/recuperacao/redefinir")
      .send({ tokenRedefinicao: verificacao.body.tokenRedefinicao, novaSenha: "NovaSenha456" });
    expect(redefinicao.status).toBe(200);

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "aluna@example.com", senha: "NovaSenha456" });
    expect(login.status).toBe(200);

    const sessaoAntiga = await request(app).get("/api/eventos").set(autorizacao);
    expect(sessaoAntiga.status).toBe(401);

    const reuso = await request(app)
      .post("/api/auth/recuperacao/redefinir")
      .send({ tokenRedefinicao: verificacao.body.tokenRedefinicao, novaSenha: "OutraSenha789" });
    expect(reuso.status).toBe(401);
  });

  it("recusa código incorreto e código já utilizado", async () => {
    await criarUsuarioDeTeste();
    const codigo = await solicitarCodigo();
    const errado = codigo === "000000" ? "111111" : "000000";

    const incorreto = await request(app)
      .post("/api/auth/recuperacao/verificar")
      .send({ email: "aluna@example.com", codigo: errado });
    expect(incorreto.status).toBe(401);

    await request(app)
      .post("/api/auth/recuperacao/verificar")
      .send({ email: "aluna@example.com", codigo });

    const reutilizado = await request(app)
      .post("/api/auth/recuperacao/verificar")
      .send({ email: "aluna@example.com", codigo });
    expect(reutilizado.status).toBe(401);
  });

  it("recusa código expirado", async () => {
    const { usuario } = await criarUsuarioDeTeste();
    const codigo = await solicitarCodigo();

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { codigoRecuperacaoExpiraEm: new Date(Date.now() - 1000) },
    });

    const resposta = await request(app)
      .post("/api/auth/recuperacao/verificar")
      .send({ email: "aluna@example.com", codigo });

    expect(resposta.status).toBe(401);
    expect(resposta.body.erro).toMatch(/expirado/);
  });
});
