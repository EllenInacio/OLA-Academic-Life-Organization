import request from "supertest";
import app from "../../app";
import { prisma } from "../../config/prisma";
import { limparBanco } from "../banco";
import { criarUsuarioDeTeste } from "../usuarioDeTeste";
import { dataRelativa } from "../datas";

let autorizacao: Record<string, string>;

async function criarDisciplina(extras: Record<string, unknown> = {}, auth = autorizacao) {
  const resposta = await request(app)
    .post("/api/disciplinas")
    .set(auth)
    .send({ nome: "Cálculo I", ...extras });
  return resposta.body.id as number;
}

async function criarAvaliacao(disciplinaId: number, dados: Record<string, unknown> = {}, auth = autorizacao) {
  const resposta = await request(app)
    .post("/api/eventos")
    .set(auth)
    .send({ titulo: "Prova 1", tipo: "PROVA", data: dataRelativa(-3), peso: 3, disciplinaId, ...dados });
  return resposta;
}

function lancarNota(eventoId: number, corpo: Record<string, unknown>, auth = autorizacao) {
  return request(app).put(`/api/eventos/${eventoId}/nota`).set(auth).send(corpo);
}

describe("Notas", () => {
  beforeEach(async () => {
    await limparBanco();
    ({ autorizacao } = await criarUsuarioDeTeste());
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("lança a nota de uma avaliação e a marca como concluída", async () => {
    const disciplinaId = await criarDisciplina();
    const avaliacao = await criarAvaliacao(disciplinaId);

    const resposta = await lancarNota(avaliacao.body.id, { nota: 6.5 });

    expect(resposta.status).toBe(200);
    expect(Number(resposta.body.nota)).toBe(6.5);
    expect(Number(resposta.body.notaMaxima)).toBe(10);
    expect(resposta.body.status).toBe("CONCLUIDO");
  });

  it("aceita nota máxima diferente de 10", async () => {
    const disciplinaId = await criarDisciplina();
    const avaliacao = await criarAvaliacao(disciplinaId);

    const resposta = await lancarNota(avaliacao.body.id, { nota: 15, notaMaxima: 20 });

    expect(resposta.status).toBe(200);
    expect(Number(resposta.body.notaMaxima)).toBe(20);
  });

  it.each([
    [{ nota: 11 }, "nota máxima"],
    [{ nota: -1 }, "maior ou igual a zero"],
    [{ nota: "abc" }, "maior ou igual a zero"],
    [{}, "maior ou igual a zero"],
    [{ nota: 5, notaMaxima: 0 }, "nota máxima"],
  ])("recusa nota inválida %p", async (corpo, trecho) => {
    const disciplinaId = await criarDisciplina();
    const avaliacao = await criarAvaliacao(disciplinaId);

    const resposta = await lancarNota(avaliacao.body.id, corpo);

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toContain(trecho);
  });

  it("não lança nota em evento com peso 0 (não avaliativo)", async () => {
    const disciplinaId = await criarDisciplina();
    const entrega = await criarAvaliacao(disciplinaId, { titulo: "Entrega", tipo: "ENTREGA", peso: 0 });

    const resposta = await lancarNota(entrega.body.id, { nota: 8 });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toContain("peso 0");
  });

  it("cadastra a avaliação já com nota (fica concluída)", async () => {
    const disciplinaId = await criarDisciplina();

    const resposta = await criarAvaliacao(disciplinaId, { nota: 8, status: "PENDENTE" });

    expect(resposta.status).toBe(201);
    expect(Number(resposta.body.nota)).toBe(8);
    expect(resposta.body.status).toBe("CONCLUIDO");
  });

  it("recusa cadastro com nota maior que a nota máxima", async () => {
    const disciplinaId = await criarDisciplina();

    const resposta = await criarAvaliacao(disciplinaId, { nota: 12, notaMaxima: 10 });

    expect(resposta.status).toBe(400);
  });

  it("remove a nota sem apagar a avaliação", async () => {
    const disciplinaId = await criarDisciplina();
    const avaliacao = await criarAvaliacao(disciplinaId, { nota: 7 });

    const resposta = await request(app).delete(`/api/eventos/${avaliacao.body.id}/nota`).set(autorizacao);

    expect(resposta.status).toBe(200);
    expect(resposta.body.nota).toBeNull();
    expect(await prisma.evento.count()).toBe(1);
  });

  it("editar o evento pelo calendário não apaga a nota", async () => {
    const disciplinaId = await criarDisciplina();
    const avaliacao = await criarAvaliacao(disciplinaId, { nota: 7 });

    await request(app).put(`/api/eventos/${avaliacao.body.id}`).set(autorizacao).send({
      titulo: "Prova 1 (remarcada)",
      tipo: "PROVA",
      data: dataRelativa(-2),
      peso: 3,
      status: "CONCLUIDO",
      disciplinaId,
    });

    const evento = await prisma.evento.findUnique({ where: { id: avaliacao.body.id } });
    expect(Number(evento!.nota)).toBe(7);
  });

  it("calcula a média nos detalhes da disciplina conforme a regra configurada", async () => {
    const disciplinaId = await criarDisciplina({ mediaAprovacao: 6 });
    const p1 = await criarAvaliacao(disciplinaId, { titulo: "Prova 1", peso: 3 });
    const lista = await criarAvaliacao(disciplinaId, { titulo: "Lista", tipo: "TRABALHO", peso: 1 });
    await criarAvaliacao(disciplinaId, { titulo: "Prova 2", peso: 3, data: dataRelativa(10) });

    await lancarNota(p1.body.id, { nota: 6.5 });
    await lancarNota(lista.body.id, { nota: 8 });

    const ponderada = await request(app).get(`/api/disciplinas/${disciplinaId}`).set(autorizacao);
    expect(ponderada.body.resumo.desempenho).toMatchObject({
      regraMedia: "PONDERADA",
      media: 6.88,
      situacao: "PARCIAL_ACIMA",
      notaNecessaria: { valor: 4.83, alcancavel: true },
      avaliacoes: { total: 3, comNota: 2, semNota: 1 },
    });

    await request(app)
      .put(`/api/disciplinas/${disciplinaId}`)
      .set(autorizacao)
      .send({ nome: "Cálculo I", regraMedia: "ARITMETICA" });

    const aritmetica = await request(app).get(`/api/disciplinas/${disciplinaId}`).set(autorizacao);
    expect(aritmetica.body.resumo.desempenho).toMatchObject({ regraMedia: "ARITMETICA", media: 7.25 });
    expect(aritmetica.body.mediaAprovacao).toBe("6"); // mantida, pois não foi enviada na edição
  });

  it("isola as notas entre usuários", async () => {
    const bia = await criarUsuarioDeTeste("bia@example.com");
    const disciplinaId = await criarDisciplina();
    const avaliacao = await criarAvaliacao(disciplinaId);

    const lancar = await lancarNota(avaliacao.body.id, { nota: 10 }, bia.autorizacao);
    const remover = await request(app).delete(`/api/eventos/${avaliacao.body.id}/nota`).set(bia.autorizacao);

    expect([lancar.status, remover.status]).toEqual([404, 404]);
    const evento = await prisma.evento.findUnique({ where: { id: avaliacao.body.id } });
    expect(evento!.nota).toBeNull();
  });

  it("registra lançamento e remoção de nota na auditoria", async () => {
    const disciplinaId = await criarDisciplina();
    const avaliacao = await criarAvaliacao(disciplinaId);
    await lancarNota(avaliacao.body.id, { nota: 6.5 });
    await request(app).delete(`/api/eventos/${avaliacao.body.id}/nota`).set(autorizacao);

    const logs = await prisma.logAuditoria.findMany({
      where: { acao: { in: ["NOTA_LANCADA", "NOTA_REMOVIDA"] } },
      orderBy: { id: "asc" },
    });

    expect(logs.map((log) => [log.acao, log.detalhe])).toEqual([
      ["NOTA_LANCADA", "Prova 1: 6,5 de 10"],
      ["NOTA_REMOVIDA", "Prova 1"],
    ]);
  });

  it("inclui notas e critérios na exportação LGPD", async () => {
    const disciplinaId = await criarDisciplina({ mediaAprovacao: 6, limiteFaltas: 20 });
    await criarAvaliacao(disciplinaId, { nota: 9 });

    const resposta = await request(app).get("/api/lgpd/exportar").set(autorizacao);

    expect(resposta.body.disciplinas[0].criteriosDeAvaliacao).toEqual({
      regraMedia: "PONDERADA",
      mediaAprovacao: 6,
      limiteFaltas: 20,
    });
    expect(resposta.body.disciplinas[0].eventos[0]).toMatchObject({ nota: 9, notaMaxima: 10 });
  });
});
