import request from "supertest";
import app from "../app";
import { prisma } from "../config/prisma";
import { limparBanco } from "./banco";
import { criarUsuarioDeTeste } from "./usuarioDeTeste";

describe("Autorização e auditoria do calendário", () => {
  beforeEach(async () => {
    await limparBanco();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("bloqueia as rotas do calendário sem token", async () => {
    const disciplinas = await request(app).get("/api/disciplinas");
    const eventos = await request(app).post("/api/eventos").send({});

    expect(disciplinas.status).toBe(401);
    expect(eventos.status).toBe(401);
  });

  it("bloqueia token adulterado", async () => {
    const resposta = await request(app)
      .get("/api/eventos")
      .set("Authorization", "Bearer token.invalido.qualquer");

    expect(resposta.status).toBe(401);
  });

  it("isola disciplinas e eventos entre usuários", async () => {
    const ana = await criarUsuarioDeTeste("ana@example.com");
    const bia = await criarUsuarioDeTeste("bia@example.com");

    const disciplinaAna = await request(app)
      .post("/api/disciplinas")
      .set(ana.autorizacao)
      .send({ nome: "Cálculo I" });

    const eventoAna = await request(app).post("/api/eventos").set(ana.autorizacao).send({
      titulo: "Prova 1",
      tipo: "PROVA",
      data: "2026-10-15",
      peso: 3,
      disciplinaId: disciplinaAna.body.id,
    });

    const mesmaDisciplina = await request(app)
      .post("/api/disciplinas")
      .set(bia.autorizacao)
      .send({ nome: "Cálculo I" });
    expect(mesmaDisciplina.status).toBe(201);

    const listaBia = await request(app).get("/api/eventos").set(bia.autorizacao);
    expect(listaBia.body).toEqual([]);

    const leitura = await request(app)
      .get(`/api/eventos/${eventoAna.body.id}`)
      .set(bia.autorizacao);
    const edicao = await request(app)
      .put(`/api/eventos/${eventoAna.body.id}`)
      .set(bia.autorizacao)
      .send({
        titulo: "Invadido",
        tipo: "PROVA",
        data: "2026-10-15",
        peso: 1,
        disciplinaId: mesmaDisciplina.body.id,
      });
    const exclusao = await request(app)
      .delete(`/api/eventos/${eventoAna.body.id}`)
      .set(bia.autorizacao);
    const eventoNaDisciplinaAlheia = await request(app)
      .post("/api/eventos")
      .set(bia.autorizacao)
      .send({
        titulo: "Prova",
        tipo: "PROVA",
        data: "2026-10-15",
        peso: 1,
        disciplinaId: disciplinaAna.body.id,
      });

    expect(leitura.status).toBe(404);
    expect(edicao.status).toBe(404);
    expect(exclusao.status).toBe(404);
    expect(eventoNaDisciplinaAlheia.status).toBe(404);
  });

  it("registra criação, alteração e exclusão de eventos", async () => {
    const { usuario, autorizacao } = await criarUsuarioDeTeste();

    const disciplina = await request(app)
      .post("/api/disciplinas")
      .set(autorizacao)
      .send({ nome: "Redes" });

    const dadosEvento = {
      titulo: "Trabalho 1",
      tipo: "TRABALHO",
      data: "2026-10-01",
      peso: 2,
      disciplinaId: disciplina.body.id,
    };

    const evento = await request(app).post("/api/eventos").set(autorizacao).send(dadosEvento);
    await request(app)
      .put(`/api/eventos/${evento.body.id}`)
      .set(autorizacao)
      .send({ ...dadosEvento, status: "CONCLUIDO" });
    await request(app).delete(`/api/eventos/${evento.body.id}`).set(autorizacao);

    const logs = await prisma.logAuditoria.findMany({
      where: { usuarioId: usuario.id },
      orderBy: { id: "asc" },
    });

    expect(logs.map((log) => log.acao)).toEqual([
      "DISCIPLINA_CRIADA",
      "EVENTO_CRIADO",
      "EVENTO_ALTERADO",
      "EVENTO_EXCLUIDO",
    ]);
    expect(logs[1]).toMatchObject({ entidade: "evento", entidadeId: evento.body.id });
  });
});
