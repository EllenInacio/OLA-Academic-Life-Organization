import request from "supertest";
import app from "../../app";
import { prisma } from "../../config/prisma";
import { limparBanco } from "../banco";
import { criarUsuarioDeTeste } from "../usuarioDeTeste";
import { dataRelativa } from "../datas";

let autorizacao: Record<string, string>;
let disciplinaId: number;

function registrar(corpo: Record<string, unknown>, id = disciplinaId, auth = autorizacao) {
  return request(app).post(`/api/disciplinas/${id}/frequencias`).set(auth).send(corpo);
}

describe("Frequência", () => {
  beforeEach(async () => {
    await limparBanco();
    ({ autorizacao } = await criarUsuarioDeTeste());
    const disciplina = await request(app)
      .post("/api/disciplinas")
      .set(autorizacao)
      .send({ nome: "Cálculo I", cargaHoraria: 72 });
    disciplinaId = disciplina.body.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("registra presença e falta", async () => {
    const presenca = await registrar({ data: dataRelativa(-2), faltas: 0 });
    const falta = await registrar({ data: dataRelativa(-1), quantidadeAulas: 2, faltas: 2 });

    expect(presenca.status).toBe(201);
    expect(presenca.body).toMatchObject({ quantidadeAulas: 1, faltas: 0 });
    expect(falta.body).toMatchObject({ quantidadeAulas: 2, faltas: 2 });
  });

  it("lista os registros da disciplina do mais recente para o mais antigo", async () => {
    await registrar({ data: dataRelativa(-5), faltas: 0 });
    await registrar({ data: dataRelativa(-1), faltas: 1 });

    const resposta = await request(app).get(`/api/disciplinas/${disciplinaId}/frequencias`).set(autorizacao);

    expect(resposta.status).toBe(200);
    expect(resposta.body.map((r: { data: string }) => r.data.slice(0, 10))).toEqual([
      dataRelativa(-1),
      dataRelativa(-5),
    ]);
  });

  it("calcula a frequência nos detalhes da disciplina", async () => {
    await registrar({ data: dataRelativa(-3), quantidadeAulas: 2, faltas: 0 });
    await registrar({ data: dataRelativa(-2), quantidadeAulas: 2, faltas: 1 });

    const resposta = await request(app).get(`/api/disciplinas/${disciplinaId}`).set(autorizacao);

    expect(resposta.body.resumo.frequencia).toMatchObject({
      aulasRegistradas: 4,
      faltas: 1,
      percentualFaltas: 25,
      aulasPrevistas: 72,
      faltasPermitidas: 18,
      faltasRestantes: 17,
      situacao: "DENTRO_DO_LIMITE",
    });
  });

  it("recusa dois registros na mesma data", async () => {
    await registrar({ data: dataRelativa(-1), faltas: 0 });

    const resposta = await registrar({ data: dataRelativa(-1), faltas: 1 });

    expect(resposta.status).toBe(409);
    expect(resposta.body.erro).toContain("Edite o registro existente");
  });

  it("recusa aula futura", async () => {
    const resposta = await registrar({ data: dataRelativa(1), faltas: 0 });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toContain("ainda não aconteceu");
  });

  it.each([
    [{ data: dataRelativa(-1), quantidadeAulas: 2, faltas: 3 }, "maior que a quantidade de aulas"],
    [{ data: dataRelativa(-1), faltas: 2 }, "maior que a quantidade de aulas"],
    [{ data: dataRelativa(-1), quantidadeAulas: 0, faltas: 0 }, "quantidade de aulas"],
    [{ data: dataRelativa(-1) }, "número de faltas"],
    [{ data: "14/10/2026", faltas: 0 }, "AAAA-MM-DD"],
    [{ data: "2026-02-30", faltas: 0 }, "Data inválida"],
  ])("recusa registro inválido %p", async (corpo, trecho) => {
    const resposta = await registrar(corpo);

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toContain(trecho);
  });

  it("edita e exclui um registro", async () => {
    const criado = await registrar({ data: dataRelativa(-1), faltas: 0 });

    const edicao = await request(app)
      .put(`/api/frequencias/${criado.body.id}`)
      .set(autorizacao)
      .send({ data: dataRelativa(-1), quantidadeAulas: 2, faltas: 1 });
    expect(edicao.status).toBe(200);
    expect(edicao.body).toMatchObject({ quantidadeAulas: 2, faltas: 1 });

    const exclusao = await request(app).delete(`/api/frequencias/${criado.body.id}`).set(autorizacao);
    expect(exclusao.status).toBe(204);
    expect(await prisma.registroFrequencia.count()).toBe(0);
  });

  it("recusa mover um registro para uma data que já tem registro", async () => {
    await registrar({ data: dataRelativa(-2), faltas: 0 });
    const outro = await registrar({ data: dataRelativa(-1), faltas: 0 });

    const resposta = await request(app)
      .put(`/api/frequencias/${outro.body.id}`)
      .set(autorizacao)
      .send({ data: dataRelativa(-2), faltas: 0 });

    expect(resposta.status).toBe(409);
  });

  it("isola os registros entre usuários", async () => {
    const bia = await criarUsuarioDeTeste("bia@example.com");
    const criado = await registrar({ data: dataRelativa(-1), faltas: 0 });

    const lista = await request(app).get(`/api/disciplinas/${disciplinaId}/frequencias`).set(bia.autorizacao);
    const novo = await registrar({ data: dataRelativa(-2), faltas: 1 }, disciplinaId, bia.autorizacao);
    const edicao = await request(app)
      .put(`/api/frequencias/${criado.body.id}`)
      .set(bia.autorizacao)
      .send({ data: dataRelativa(-1), faltas: 1 });
    const exclusao = await request(app).delete(`/api/frequencias/${criado.body.id}`).set(bia.autorizacao);

    expect([lista.status, novo.status, edicao.status, exclusao.status]).toEqual([404, 404, 404, 404]);
    expect(await prisma.registroFrequencia.count()).toBe(1);
  });

  it("exige autenticação", async () => {
    const lista = await request(app).get(`/api/disciplinas/${disciplinaId}/frequencias`);
    const edicao = await request(app).put("/api/frequencias/1").send({});

    expect([lista.status, edicao.status]).toEqual([401, 401]);
  });

  it("registra as ações de frequência na auditoria", async () => {
    const criado = await registrar({ data: "2026-10-01", quantidadeAulas: 2, faltas: 1 });
    await request(app)
      .put(`/api/frequencias/${criado.body.id}`)
      .set(autorizacao)
      .send({ data: "2026-10-01", quantidadeAulas: 2, faltas: 0 });
    await request(app).delete(`/api/frequencias/${criado.body.id}`).set(autorizacao);

    const logs = await prisma.logAuditoria.findMany({
      where: { entidade: "registro_frequencia" },
      orderBy: { id: "asc" },
    });

    expect(logs.map((log) => [log.acao, log.detalhe])).toEqual([
      ["FREQUENCIA_REGISTRADA", "Cálculo I · 01/10/2026 · 2 aula(s), 1 falta(s)"],
      ["FREQUENCIA_ALTERADA", "Cálculo I · 01/10/2026 · 2 aula(s), 0 falta(s)"],
      ["FREQUENCIA_EXCLUIDA", "Cálculo I · 01/10/2026 · 2 aula(s), 0 falta(s)"],
    ]);
  });

  it("protege a exclusão da disciplina que tem registros de frequência", async () => {
    await registrar({ data: dataRelativa(-1), faltas: 0 });

    const semConfirmar = await request(app).delete(`/api/disciplinas/${disciplinaId}`).set(autorizacao);
    expect(semConfirmar.status).toBe(409);
    expect(semConfirmar.body.detalhes).toEqual({ eventos: 0, frequencias: 1 });

    const confirmado = await request(app)
      .delete(`/api/disciplinas/${disciplinaId}?confirmar=true`)
      .set(autorizacao);
    expect(confirmado.status).toBe(204);
    expect(await prisma.registroFrequencia.count()).toBe(0);
  });

  it("inclui a frequência na exportação LGPD", async () => {
    await registrar({ data: "2026-10-01", quantidadeAulas: 2, faltas: 1 });

    const resposta = await request(app).get("/api/lgpd/exportar").set(autorizacao);

    expect(resposta.body.disciplinas[0].frequencia).toEqual([
      { data: "2026-10-01", quantidadeAulas: 2, faltas: 1 },
    ]);
  });
});
