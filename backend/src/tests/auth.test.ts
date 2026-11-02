import request from "supertest";
import speakeasy from "speakeasy";
import app from "../app";
import { prisma } from "../config/prisma";
import * as emailService from "../services/emailService";
import { limparBanco } from "./banco";
import { criarUsuarioDeTeste, SENHA_DE_TESTE } from "./usuarioDeTeste";

jest.mock("../services/emailService");

const enviarCodigo2fa = emailService.enviarCodigo2fa as jest.Mock;

async function fazerLogin(email = "aluna@example.com", senha = SENHA_DE_TESTE) {
  return request(app).post("/api/auth/login").send({ email, senha });
}

async function acoesRegistradas() {
  const logs = await prisma.logAuditoria.findMany({ orderBy: { id: "asc" } });
  return logs.map((log) => log.acao);
}

describe("Autenticação", () => {
  beforeEach(async () => {
    await limparBanco();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("cadastra um usuário com senha protegida e segredo 2FA criptografado", async () => {
    const resposta = await request(app).post("/api/auth/cadastro").send({
      nome: "Ellen",
      email: "Ellen@Example.com",
      senha: "SenhaForte123",
      aceiteTermos: true,
    });

    expect(resposta.status).toBe(201);
    expect(resposta.body.qrCode).toMatch(/^data:image\/png;base64,/);

    const usuario = await prisma.usuario.findUnique({ where: { email: "ellen@example.com" } });
    expect(usuario).not.toBeNull();
    expect(usuario!.senhaHash).toMatch(/^\$argon2id\$/);
    expect(usuario!.senhaHash).not.toContain("SenhaForte123");
    expect(usuario!.segredo2fa.split(":")).toHaveLength(3);
    expect(usuario!.consentimentoVersao).toBe("1.0");
    expect(await acoesRegistradas()).toEqual(["CADASTRO"]);
  });

  it("recusa cadastro sem aceite dos termos", async () => {
    const resposta = await request(app).post("/api/auth/cadastro").send({
      nome: "Ellen",
      email: "ellen@example.com",
      senha: "SenhaForte123",
      aceiteTermos: false,
    });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toMatch(/Termos de Uso/);
  });

  it("recusa cadastro com senha curta e com e-mail repetido", async () => {
    const curta = await request(app).post("/api/auth/cadastro").send({
      nome: "Ellen",
      email: "ellen@example.com",
      senha: "123",
      aceiteTermos: true,
    });
    expect(curta.status).toBe(400);

    await criarUsuarioDeTeste("ellen@example.com");
    const repetido = await request(app).post("/api/auth/cadastro").send({
      nome: "Ellen",
      email: "ellen@example.com",
      senha: "SenhaForte123",
      aceiteTermos: true,
    });
    expect(repetido.status).toBe(409);
  });

  it("recusa login com senha incorreta e registra a tentativa", async () => {
    await criarUsuarioDeTeste();

    const resposta = await fazerLogin("aluna@example.com", "senhaErrada");

    expect(resposta.status).toBe(401);
    expect(resposta.body.tokenTemporario).toBeUndefined();
    expect(await acoesRegistradas()).toEqual(["LOGIN_FALHA"]);
  });

  it("conclui o login com o código do aplicativo autenticador", async () => {
    const { segredo } = await criarUsuarioDeTeste();

    const etapa1 = await fazerLogin();
    expect(etapa1.status).toBe(200);
    expect(etapa1.body.exige2fa).toBe(true);

    const codigo = speakeasy.totp({ secret: segredo, encoding: "base32" });
    const etapa2 = await request(app)
      .post("/api/auth/2fa/verificar")
      .send({ tokenTemporario: etapa1.body.tokenTemporario, codigo, metodo: "app" });

    expect(etapa2.status).toBe(200);
    expect(etapa2.body.token).toBeDefined();
    expect(etapa2.body.usuario.email).toBe("aluna@example.com");

    const eventos = await request(app)
      .get("/api/eventos")
      .set("Authorization", `Bearer ${etapa2.body.token}`);
    expect(eventos.status).toBe(200);

    expect(await acoesRegistradas()).toEqual(["LOGIN_SENHA_VALIDA", "LOGIN_SUCESSO"]);
  });

  it("conclui o login com o código enviado por e-mail", async () => {
    await criarUsuarioDeTeste();
    const etapa1 = await fazerLogin();

    const envio = await request(app)
      .post("/api/auth/2fa/enviar-codigo")
      .send({ tokenTemporario: etapa1.body.tokenTemporario });
    expect(envio.status).toBe(200);

    const codigo = enviarCodigo2fa.mock.calls[0][2];
    const etapa2 = await request(app)
      .post("/api/auth/2fa/verificar")
      .send({ tokenTemporario: etapa1.body.tokenTemporario, codigo, metodo: "email" });

    expect(etapa2.status).toBe(200);
    expect(etapa2.body.token).toBeDefined();

    const reutilizado = await request(app)
      .post("/api/auth/2fa/verificar")
      .send({ tokenTemporario: etapa1.body.tokenTemporario, codigo, metodo: "email" });
    expect(reutilizado.status).toBe(400);
  });

  it("recusa código 2FA incorreto e registra a falha", async () => {
    await criarUsuarioDeTeste();
    const etapa1 = await fazerLogin();

    const resposta = await request(app)
      .post("/api/auth/2fa/verificar")
      .send({ tokenTemporario: etapa1.body.tokenTemporario, codigo: "000000", metodo: "app" });

    expect(resposta.status).toBe(401);
    expect(await acoesRegistradas()).toContain("LOGIN_2FA_FALHA");
  });

  it("não aceita o token temporário do 2FA como token de acesso", async () => {
    await criarUsuarioDeTeste();
    const etapa1 = await fazerLogin();

    const resposta = await request(app)
      .get("/api/eventos")
      .set("Authorization", `Bearer ${etapa1.body.tokenTemporario}`);

    expect(resposta.status).toBe(401);
  });

  it("invalida o token no logout", async () => {
    const { autorizacao } = await criarUsuarioDeTeste();

    const logout = await request(app).post("/api/auth/logout").set(autorizacao);
    expect(logout.status).toBe(204);

    const depois = await request(app).get("/api/eventos").set(autorizacao);
    expect(depois.status).toBe(401);
    expect(await acoesRegistradas()).toEqual(["LOGOUT"]);
  });
});
