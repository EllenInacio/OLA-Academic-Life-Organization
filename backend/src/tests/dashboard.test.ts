import request from "supertest";
import app from "../app";
import { prisma } from "../config/prisma";
import { limparBanco } from "./banco";
import { criarUsuarioDeTeste } from "./usuarioDeTeste";
import { dataRelativa } from "./datas";

let autorizacao: Record<string, string>;

async function criarDisciplina(nome: string, extras: Record<string, unknown> = {}, auth = autorizacao) {
  const resposta = await request(app)
    .post("/api/disciplinas")
    .set(auth)
    .send({ nome, ...extras });
  return resposta.body.id as number;
}

async function criarEvento(
  disciplinaId: number,
  titulo: string,
  dias: number,
  status = "PENDENTE",
  auth = autorizacao
) {
  const resposta = await request(app)
    .post("/api/eventos")
    .set(auth)
    .send({ titulo, tipo: "PROVA", data: dataRelativa(dias), peso: 2, status, disciplinaId });
  return resposta.body.id as number;
}

describe("Dashboard", () => {
  beforeEach(async () => {
    await limparBanco();
    ({ autorizacao } = await criarUsuarioDeTeste());
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("exige autenticação", async () => {
    const resposta = await request(app).get("/api/dashboard");
    expect(resposta.status).toBe(401);
  });

  it("devolve indicadores zerados para quem ainda não cadastrou nada", async () => {
    const resposta = await request(app).get("/api/dashboard").set(autorizacao);

    expect(resposta.status).toBe(200);
    expect(resposta.body.resumo.disciplinas).toBe(0);
    expect(resposta.body.resumo.eventos.total).toBe(0);
    expect(resposta.body.proximosEventos).toEqual([]);
    expect(resposta.body.alertas).toEqual([]);
    expect(resposta.body.hoje).toBe(dataRelativa(0));
  });

  it("calcula os indicadores a partir dos eventos do calendário", async () => {
    const banco = await criarDisciplina("Banco de Dados", { semestre: "2026.2" });
    const calculo = await criarDisciplina("Cálculo I", { semestre: "2026.2" });

    await criarEvento(banco, "Prova de SQL", 2);
    await criarEvento(banco, "Lista 1", -10, "CONCLUIDO");
    await criarEvento(calculo, "Prova 2", 11, "EM_ANDAMENTO");
    await criarEvento(calculo, "Lista atrasada", -1);

    const resposta = await request(app).get("/api/dashboard").set(autorizacao);
    const painel = resposta.body;

    expect(painel.semestres).toEqual(["2026.2"]);
    expect(painel.resumo).toEqual({
      disciplinas: 2,
      eventos: { total: 4, pendentes: 2, emAndamento: 1, concluidos: 1, abertos: 3, atrasados: 1 },
      prazosProximos: 1,
    });
    expect(painel.proximosEventos.map((e: { titulo: string; diasRestantes: number }) => [e.titulo, e.diasRestantes])).toEqual([
      ["Prova de SQL", 2],
      ["Prova 2", 11],
    ]);
    expect(painel.proximosEventos[0].disciplina).toEqual({ id: banco, nome: "Banco de Dados" });
    expect(painel.alertas.map((a: { tipo: string; nivel: string; evento: { titulo: string } }) => [a.tipo, a.nivel, a.evento.titulo])).toEqual([
      ["PRAZO_PROXIMO", "alto", "Prova de SQL"],
      ["PRAZO_VENCIDO", "medio", "Lista atrasada"],
    ]);
    expect(painel.disciplinas.map((d: { nome: string; eventos: { total: number } }) => [d.nome, d.eventos.total])).toEqual([
      ["Banco de Dados", 2],
      ["Cálculo I", 2],
    ]);
  });

  it("reflete as alterações feitas no calendário", async () => {
    const banco = await criarDisciplina("Banco de Dados");
    const eventoId = await criarEvento(banco, "Prova de SQL", 3);

    const antes = await request(app).get("/api/dashboard").set(autorizacao);
    expect(antes.body.proximosEventos).toHaveLength(1);

    await request(app).put(`/api/eventos/${eventoId}`).set(autorizacao).send({
      titulo: "Prova de SQL",
      tipo: "PROVA",
      data: dataRelativa(3),
      peso: 2,
      status: "CONCLUIDO",
      disciplinaId: banco,
    });

    const depois = await request(app).get("/api/dashboard").set(autorizacao);
    expect(depois.body.proximosEventos).toEqual([]);
    expect(depois.body.resumo.eventos.concluidos).toBe(1);
    expect(depois.body.alertas).toEqual([]);
  });

  it("mostra somente os dados do usuário autenticado", async () => {
    const bia = await criarUsuarioDeTeste("bia@example.com");
    const disciplinaBia = await criarDisciplina("Física", {}, bia.autorizacao);
    await criarEvento(disciplinaBia, "Prova da Bia", 1, "PENDENTE", bia.autorizacao);

    await criarDisciplina("Cálculo I");

    const resposta = await request(app).get("/api/dashboard").set(autorizacao);

    expect(resposta.body.resumo.disciplinas).toBe(1);
    expect(resposta.body.resumo.eventos.total).toBe(0);
    expect(JSON.stringify(resposta.body)).not.toContain("Prova da Bia");
  });
});
