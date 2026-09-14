import request from "supertest";
import app from "../app";
import { prisma } from "../config/prisma";
import { limparBanco } from "./banco";

async function criarDisciplina(nome = "Cálculo I") {
  const resposta = await request(app).post("/api/disciplinas").send({ nome });
  return resposta.body.id as number;
}

function eventoBase(disciplinaId: number) {
  return {
    titulo: "Prova 1",
    tipo: "PROVA",
    data: "2026-10-15",
    peso: 3,
    disciplinaId,
  };
}

describe("Eventos", () => {
  beforeEach(async () => {
    await limparBanco();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("cadastra um evento vinculado a uma disciplina", async () => {
    const disciplinaId = await criarDisciplina();

    const resposta = await request(app)
      .post("/api/eventos")
      .send(eventoBase(disciplinaId));

    expect(resposta.status).toBe(201);
    expect(resposta.body.titulo).toBe("Prova 1");
    expect(resposta.body.status).toBe("PENDENTE");
    expect(Number(resposta.body.peso)).toBe(3);
    expect(resposta.body.data.slice(0, 10)).toBe("2026-10-15");
    expect(resposta.body.disciplina.nome).toBe("Cálculo I");
  });

  it("recusa evento com tipo inválido", async () => {
    const disciplinaId = await criarDisciplina();

    const resposta = await request(app)
      .post("/api/eventos")
      .send({ ...eventoBase(disciplinaId), tipo: "SEMINARIO" });

    expect(resposta.status).toBe(400);
  });

  it("recusa evento de disciplina inexistente", async () => {
    const resposta = await request(app)
      .post("/api/eventos")
      .send(eventoBase(9999));

    expect(resposta.status).toBe(404);
  });

  it("lista os eventos ordenados por data", async () => {
    const disciplinaId = await criarDisciplina();

    await request(app)
      .post("/api/eventos")
      .send({ ...eventoBase(disciplinaId), titulo: "Prova 2", data: "2026-11-20" });

    await request(app).post("/api/eventos").send({
      ...eventoBase(disciplinaId),
      titulo: "Trabalho final",
      tipo: "TRABALHO",
      data: "2026-09-05",
    });

    const resposta = await request(app).get("/api/eventos");

    expect(resposta.status).toBe(200);
    expect(resposta.body.map((e: { titulo: string }) => e.titulo)).toEqual([
      "Trabalho final",
      "Prova 2",
    ]);
  });

  it("busca um evento pelo id", async () => {
    const disciplinaId = await criarDisciplina();
    const criado = await request(app)
      .post("/api/eventos")
      .send(eventoBase(disciplinaId));

    const resposta = await request(app).get(`/api/eventos/${criado.body.id}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.id).toBe(criado.body.id);
  });

  it("devolve 404 ao buscar evento inexistente", async () => {
    const resposta = await request(app).get("/api/eventos/9999");
    expect(resposta.status).toBe(404);
  });

  it("edita um evento", async () => {
    const disciplinaId = await criarDisciplina();
    const criado = await request(app)
      .post("/api/eventos")
      .send(eventoBase(disciplinaId));

    const resposta = await request(app)
      .put(`/api/eventos/${criado.body.id}`)
      .send({
        ...eventoBase(disciplinaId),
        data: "2026-10-20",
        status: "CONCLUIDO",
      });

    expect(resposta.status).toBe(200);
    expect(resposta.body.status).toBe("CONCLUIDO");
    expect(resposta.body.data.slice(0, 10)).toBe("2026-10-20");
  });

  it("exclui um evento", async () => {
    const disciplinaId = await criarDisciplina();
    const criado = await request(app)
      .post("/api/eventos")
      .send(eventoBase(disciplinaId));

    const exclusao = await request(app).delete(`/api/eventos/${criado.body.id}`);
    expect(exclusao.status).toBe(204);

    const busca = await request(app).get(`/api/eventos/${criado.body.id}`);
    expect(busca.status).toBe(404);
  });
});
