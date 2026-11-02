import request from "supertest";
import app from "../app";
import { prisma } from "../config/prisma";
import { limparBanco } from "./banco";
import { criarUsuarioDeTeste } from "./usuarioDeTeste";
import { dataRelativa } from "./datas";

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

  it("cadastra semestre, carga horária e horário", async () => {
    const resposta = await request(app).post("/api/disciplinas").set(autorizacao).send({
      nome: "Cálculo I",
      professor: "Helena Duarte",
      semestre: "2026.2",
      cargaHoraria: 72,
      horario: "Seg e Qua · 08:00–09:40",
    });

    expect(resposta.status).toBe(201);
    expect(resposta.body).toMatchObject({
      semestre: "2026.2",
      cargaHoraria: 72,
      horario: "Seg e Qua · 08:00–09:40",
    });
  });

  it("aceita os campos complementares vazios", async () => {
    const resposta = await request(app).post("/api/disciplinas").set(autorizacao).send({
      nome: "Redes",
      professor: "",
      semestre: "",
      cargaHoraria: null,
      horario: "",
    });

    expect(resposta.status).toBe(201);
    expect(resposta.body).toMatchObject({
      professor: null,
      semestre: null,
      cargaHoraria: null,
      horario: null,
    });
  });

  it("recusa semestre fora do formato AAAA.N", async () => {
    const resposta = await request(app)
      .post("/api/disciplinas")
      .set(autorizacao)
      .send({ nome: "Cálculo I", semestre: "2º semestre" });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toContain("AAAA.N");
  });

  it.each([0, -10, 1001, 2.5, "abc"])("recusa carga horária inválida (%p)", async (cargaHoraria) => {
    const resposta = await request(app)
      .post("/api/disciplinas")
      .set(autorizacao)
      .send({ nome: "Cálculo I", cargaHoraria });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toContain("carga horária");
  });

  it("informa o total de eventos de cada disciplina na listagem", async () => {
    const id = await criarDisciplina("Banco de Dados");
    await criarEvento(id, { titulo: "Prova 1" });
    await criarEvento(id, { titulo: "Prova 2" });
    await criarDisciplina("Redes");

    const resposta = await request(app).get("/api/disciplinas").set(autorizacao);

    expect(resposta.body.map((d: { nome: string; totalEventos: number }) => [d.nome, d.totalEventos])).toEqual([
      ["Banco de Dados", 2],
      ["Redes", 0],
    ]);
  });

  it("mostra os detalhes da disciplina com os eventos e o resumo", async () => {
    const id = await criarDisciplina("Banco de Dados");
    await criarEvento(id, { titulo: "Prova de SQL", data: dataRelativa(3) });
    await criarEvento(id, { titulo: "Lista 1", data: dataRelativa(-5), status: "CONCLUIDO" });

    const resposta = await request(app).get(`/api/disciplinas/${id}`).set(autorizacao);

    expect(resposta.status).toBe(200);
    expect(resposta.body.nome).toBe("Banco de Dados");
    expect(resposta.body.eventos.map((e: { titulo: string }) => e.titulo)).toEqual([
      "Lista 1",
      "Prova de SQL",
    ]);
    expect(resposta.body.eventos.map((e: { diasRestantes: number }) => e.diasRestantes)).toEqual([-5, 3]);
    expect(resposta.body.resumo.eventos).toMatchObject({ total: 2, concluidos: 1, abertos: 1 });
    expect(resposta.body.resumo.proximoEvento).toMatchObject({
      titulo: "Prova de SQL",
      diasRestantes: 3,
    });
  });

  it("devolve 404 para disciplina inexistente", async () => {
    const detalhes = await request(app).get("/api/disciplinas/9999").set(autorizacao);
    const edicao = await request(app)
      .put("/api/disciplinas/9999")
      .set(autorizacao)
      .send({ nome: "Qualquer" });
    const exclusao = await request(app).delete("/api/disciplinas/9999").set(autorizacao);

    expect([detalhes.status, edicao.status, exclusao.status]).toEqual([404, 404, 404]);
  });

  it("edita uma disciplina, inclusive mantendo o mesmo nome", async () => {
    const id = await criarDisciplina("Cálculo I");

    const resposta = await request(app).put(`/api/disciplinas/${id}`).set(autorizacao).send({
      nome: "Cálculo I",
      professor: "Helena Duarte",
      semestre: "2026.2",
      cargaHoraria: 72,
    });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({
      id,
      nome: "Cálculo I",
      professor: "Helena Duarte",
      cargaHoraria: 72,
      horario: null,
    });
  });

  it("recusa editar para o nome de outra disciplina do usuário", async () => {
    await criarDisciplina("Redes");
    const id = await criarDisciplina("Algoritmos");

    const resposta = await request(app)
      .put(`/api/disciplinas/${id}`)
      .set(autorizacao)
      .send({ nome: "Redes" });

    expect(resposta.status).toBe(409);
  });

  it("exclui disciplina sem eventos", async () => {
    const id = await criarDisciplina("Redes");

    const resposta = await request(app).delete(`/api/disciplinas/${id}`).set(autorizacao);

    expect(resposta.status).toBe(204);
    expect(await prisma.disciplina.count()).toBe(0);
  });

  it("bloqueia a exclusão de disciplina com eventos sem confirmação", async () => {
    const id = await criarDisciplina("Banco de Dados");
    await criarEvento(id, { titulo: "Prova 1" });

    const resposta = await request(app).delete(`/api/disciplinas/${id}`).set(autorizacao);

    expect(resposta.status).toBe(409);
    expect(resposta.body.detalhes).toEqual({ eventos: 1 });
    expect(await prisma.disciplina.count()).toBe(1);
    expect(await prisma.evento.count()).toBe(1);
  });

  it("exclui a disciplina e os eventos vinculados quando confirmado", async () => {
    const id = await criarDisciplina("Banco de Dados");
    await criarEvento(id, { titulo: "Prova 1" });
    await criarEvento(id, { titulo: "Prova 2" });

    const resposta = await request(app)
      .delete(`/api/disciplinas/${id}?confirmar=true`)
      .set(autorizacao);

    expect(resposta.status).toBe(204);
    expect(await prisma.disciplina.count()).toBe(0);
    expect(await prisma.evento.count()).toBe(0);
  });

  it("registra alteração e exclusão na auditoria", async () => {
    const id = await criarDisciplina("Redes");
    await criarEvento(id, { titulo: "Trabalho" });
    await request(app).put(`/api/disciplinas/${id}`).set(autorizacao).send({ nome: "Redes II" });
    await request(app).delete(`/api/disciplinas/${id}?confirmar=true`).set(autorizacao);

    const logs = await prisma.logAuditoria.findMany({
      where: { entidade: "disciplina" },
      orderBy: { id: "asc" },
    });

    expect(logs.map((log) => [log.acao, log.detalhe])).toEqual([
      ["DISCIPLINA_CRIADA", "Redes"],
      ["DISCIPLINA_ALTERADA", "Redes II"],
      ["DISCIPLINA_EXCLUIDA", "Redes II (1 evento(s) removido(s) junto)"],
    ]);
  });
});

async function criarDisciplina(nome: string) {
  const resposta = await request(app).post("/api/disciplinas").set(autorizacao).send({ nome });
  return resposta.body.id as number;
}

async function criarEvento(
  disciplinaId: number,
  dados: { titulo: string; data?: string; status?: string }
) {
  const resposta = await request(app)
    .post("/api/eventos")
    .set(autorizacao)
    .send({ tipo: "PROVA", data: dataRelativa(10), peso: 1, disciplinaId, ...dados });
  expect(resposta.status).toBe(201);
  return resposta.body.id as number;
}
