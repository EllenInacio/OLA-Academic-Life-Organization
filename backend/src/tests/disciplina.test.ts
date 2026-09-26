import request from "supertest";
import app from "../app";
import { prisma } from "../config/prisma";
import { limparBanco } from "./banco";
import { criarUsuarioDeTeste } from "./usuarioDeTeste";

let autorizacao: Record<string, string>;

describe("Disciplinas", () => {
  beforeEach(async () => {
    await limparBanco();
    ({ autorizacao } = await criarUsuarioDeTeste());
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("cadastra uma disciplina", async () => {
    const resposta = await request(app)
      .post("/api/disciplinas")
      .set(autorizacao)
      .send({ nome: "Cálculo I", professor: "Alessandro" });

    expect(resposta.status).toBe(201);
    expect(resposta.body.id).toBeDefined();
    expect(resposta.body.nome).toBe("Cálculo I");
  });

  it("recusa disciplina sem nome", async () => {
    const resposta = await request(app)
      .post("/api/disciplinas")
      .set(autorizacao)
      .send({ nome: "" });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toBeDefined();
  });

  it("recusa disciplina com nome repetido", async () => {
    await request(app)
      .post("/api/disciplinas")
      .set(autorizacao)
      .send({ nome: "Banco de Dados" });

    const resposta = await request(app)
      .post("/api/disciplinas")
      .set(autorizacao)
      .send({ nome: "Banco de Dados" });

    expect(resposta.status).toBe(409);
  });

  it("lista as disciplinas em ordem alfabética", async () => {
    await request(app)
      .post("/api/disciplinas")
      .set(autorizacao)
      .send({ nome: "Redes" });
    await request(app)
      .post("/api/disciplinas")
      .set(autorizacao)
      .send({ nome: "Algoritmos" });

    const resposta = await request(app)
      .get("/api/disciplinas")
      .set(autorizacao);

    expect(resposta.status).toBe(200);
    expect(resposta.body.map((d: { nome: string }) => d.nome)).toEqual([
      "Algoritmos",
      "Redes",
    ]);
  });
});
