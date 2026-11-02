import request from "supertest";
import app from "../../app";
import { prisma } from "../../config/prisma";
import { dataRelativa } from "../datas";
import {
  Autorizacao,
  acoesDeAuditoria,
  criarDisciplinaPelaApi,
  criarEventoPelaApi,
  criarUsuarioIntegracao,
  dadosEvento,
  removerUsuariosCriados,
} from "./ajudantes";


let usuario: { id: number };
let autorizacao: Autorizacao;

describe("EventoController (integração)", () => {
  beforeEach(async () => {
    ({ usuario, autorizacao } = await criarUsuarioIntegracao());
  });

  afterAll(async () => {
    await removerUsuariosCriados();
    await prisma.$disconnect();
  });

  it("listar_comEventosCadastradosForaDeOrdem_deveRetornar200OrdenadoPorDataComDisciplina", async () => {
    const disciplina = await criarDisciplinaPelaApi(autorizacao);
    const tardio = await criarEventoPelaApi(autorizacao, disciplina.id, { data: dataRelativa(30) });
    const cedo = await criarEventoPelaApi(autorizacao, disciplina.id, { data: dataRelativa(2) });

    const resposta = await request(app).get("/api/eventos").set(autorizacao);

    expect(resposta.status).toBe(200);
    expect(resposta.body.map((e: { id: number }) => e.id)).toEqual([cedo.id, tardio.id]);
    expect(resposta.body[0].disciplina).toEqual({ id: disciplina.id, nome: disciplina.nome });
  });

  it("buscarPorId_comEventoExistente_deveRetornar200ComADisciplinaVinculada", async () => {
    const disciplina = await criarDisciplinaPelaApi(autorizacao);
    const evento = await criarEventoPelaApi(autorizacao, disciplina.id, {
      titulo: "Trabalho de modelagem",
      tipo: "TRABALHO",
      peso: 2.5,
    });

    const resposta = await request(app).get(`/api/eventos/${evento.id}`).set(autorizacao);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({
      id: evento.id,
      titulo: "Trabalho de modelagem",
      tipo: "TRABALHO",
      status: "PENDENTE",
      disciplina: { id: disciplina.id, nome: disciplina.nome },
    });
    expect(Number(resposta.body.peso)).toBe(2.5);
  });

  it("criar_comDadosValidos_deveRetornar201ComStatusPendentePorPadrao", async () => {
    const disciplina = await criarDisciplinaPelaApi(autorizacao);
    const dados = dadosEvento(disciplina.id, { data: "2031-03-15", peso: 4 });

    const resposta = await request(app).post("/api/eventos").set(autorizacao).send(dados);

    expect(resposta.status).toBe(201);
    expect(resposta.body).toMatchObject({
      titulo: dados.titulo,
      tipo: "PROVA",
      status: "PENDENTE",
      disciplina: { id: disciplina.id, nome: disciplina.nome },
    });
    expect(resposta.body.data.slice(0, 10)).toBe("2031-03-15");
    expect(Number(resposta.body.peso)).toBe(4);
  });

  it("atualizar_comNovoTituloStatusEPeso_deveRetornar200ComOsValoresAtualizados", async () => {
    const disciplina = await criarDisciplinaPelaApi(autorizacao);
    const evento = await criarEventoPelaApi(autorizacao, disciplina.id);

    const resposta = await request(app)
      .put(`/api/eventos/${evento.id}`)
      .set(autorizacao)
      .send(dadosEvento(disciplina.id, { titulo: "Prova substitutiva", status: "CONCLUIDO", peso: 1 }));

    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({
      id: evento.id,
      titulo: "Prova substitutiva",
      status: "CONCLUIDO",
    });
    expect(Number(resposta.body.peso)).toBe(1);
  });

  it("remover_comEventoExistente_deveRetornar204SemCorpo", async () => {
    const disciplina = await criarDisciplinaPelaApi(autorizacao);
    const evento = await criarEventoPelaApi(autorizacao, disciplina.id);

    const resposta = await request(app).delete(`/api/eventos/${evento.id}`).set(autorizacao);

    expect(resposta.status).toBe(204);
    expect(resposta.text).toBe("");
  });

  it("criar_comDadosValidos_devePersistirEventoNaDisciplinaCorretaERegistrarAuditoria", async () => {
    const disciplina = await criarDisciplinaPelaApi(autorizacao);
    const dados = dadosEvento(disciplina.id, { tipo: "ENTREGA", data: "2031-06-01", peso: 1.5 });

    const resposta = await request(app).post("/api/eventos").set(autorizacao).send(dados);

    expect(resposta.status).toBe(201);
    const noBanco = await prisma.evento.findUnique({ where: { id: resposta.body.id } });
    expect(noBanco).toMatchObject({
      titulo: dados.titulo,
      tipo: "ENTREGA",
      status: "PENDENTE",
      disciplinaId: disciplina.id,
    });
    expect(noBanco!.data.toISOString().slice(0, 10)).toBe("2031-06-01");
    expect(Number(noBanco!.peso)).toBe(1.5);
    expect(await acoesDeAuditoria(usuario.id)).toContainEqual({
      acao: "EVENTO_CRIADO",
      entidadeId: resposta.body.id,
      detalhe: dados.titulo,
    });
  });

  it("atualizar_comNovoStatus_devePersistirAlteracaoNoBanco", async () => {
    const disciplina = await criarDisciplinaPelaApi(autorizacao);
    const evento = await criarEventoPelaApi(autorizacao, disciplina.id);

    const resposta = await request(app)
      .put(`/api/eventos/${evento.id}`)
      .set(autorizacao)
      .send(dadosEvento(disciplina.id, { titulo: "Prova remarcada", status: "EM_ANDAMENTO", data: "2031-09-10" }));

    expect(resposta.status).toBe(200);
    const noBanco = await prisma.evento.findUnique({ where: { id: evento.id } });
    expect(noBanco).toMatchObject({ titulo: "Prova remarcada", status: "EM_ANDAMENTO" });
    expect(noBanco!.data.toISOString().slice(0, 10)).toBe("2031-09-10");
    expect((await acoesDeAuditoria(usuario.id)).map((log) => log.acao)).toContain("EVENTO_ALTERADO");
  });

  it("remover_comEventoExistente_deveExcluirEventoDoBancoMantendoADisciplina", async () => {
    const disciplina = await criarDisciplinaPelaApi(autorizacao);
    const evento = await criarEventoPelaApi(autorizacao, disciplina.id);

    const resposta = await request(app).delete(`/api/eventos/${evento.id}`).set(autorizacao);

    expect(resposta.status).toBe(204);
    expect(await prisma.evento.findUnique({ where: { id: evento.id } })).toBeNull();
    expect(await prisma.disciplina.findUnique({ where: { id: disciplina.id } })).not.toBeNull();
    expect((await acoesDeAuditoria(usuario.id)).map((log) => log.acao)).toContain("EVENTO_EXCLUIDO");
  });


  it("criar_comTipoInvalido_deveRetornar400ComOsTiposAceitosENaoPersistir", async () => {
    const disciplina = await criarDisciplinaPelaApi(autorizacao);

    const resposta = await request(app)
      .post("/api/eventos")
      .set(autorizacao)
      .send(dadosEvento(disciplina.id, { tipo: "SEMINARIO" }));

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({ erro: "Tipo inválido. Use PROVA, TRABALHO ou ENTREGA." });
    expect(await prisma.evento.count({ where: { disciplinaId: disciplina.id } })).toBe(0);
  });

  it("criar_comDataForaDoFormato_deveRetornar400ComMensagemDeFormato", async () => {
    const disciplina = await criarDisciplinaPelaApi(autorizacao);

    const resposta = await request(app)
      .post("/api/eventos")
      .set(autorizacao)
      .send(dadosEvento(disciplina.id, { data: "15/10/2031" }));

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({ erro: "A data deve estar no formato AAAA-MM-DD." });
  });

  it("buscarPorId_comIdInexistente_deveRetornar404ComMensagem", async () => {
    const resposta = await request(app).get("/api/eventos/2147483647").set(autorizacao);

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({ erro: "Evento não encontrado." });
  });

  it("remover_comIdInexistente_deveRetornar404SemAfetarOsEventosExistentes", async () => {
    const disciplina = await criarDisciplinaPelaApi(autorizacao);
    const evento = await criarEventoPelaApi(autorizacao, disciplina.id);

    const resposta = await request(app).delete("/api/eventos/2147483647").set(autorizacao);

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({ erro: "Evento não encontrado." });
    expect(await prisma.evento.count({ where: { id: evento.id } })).toBe(1);
  });

  it("listar_semToken_deveRetornar401ComMensagemDeSessaoInvalida", async () => {
    const resposta = await request(app).get("/api/eventos");

    expect(resposta.status).toBe(401);
    expect(resposta.body).toEqual({ erro: "Sessão expirada ou inválida. Faça login novamente." });
  });

  it("criar_emDisciplinaDeOutroUsuario_deveRetornar404ENaoCriarEvento", async () => {
    const disciplinaAlheia = await criarDisciplinaPelaApi((await criarUsuarioIntegracao()).autorizacao);

    const resposta = await request(app)
      .post("/api/eventos")
      .set(autorizacao)
      .send(dadosEvento(disciplinaAlheia.id));

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({ erro: "Disciplina não encontrada." });
    expect(await prisma.evento.count({ where: { disciplinaId: disciplinaAlheia.id } })).toBe(0);
  });

  it("atualizar_movendoParaDisciplinaDeOutroUsuario_deveRetornar404EManterEventoIntacto", async () => {
    const disciplina = await criarDisciplinaPelaApi(autorizacao);
    const evento = await criarEventoPelaApi(autorizacao, disciplina.id, { titulo: "Prova original" });
    const disciplinaAlheia = await criarDisciplinaPelaApi((await criarUsuarioIntegracao()).autorizacao);

    const resposta = await request(app)
      .put(`/api/eventos/${evento.id}`)
      .set(autorizacao)
      .send(dadosEvento(disciplinaAlheia.id, { titulo: "Prova sequestrada" }));

    expect(resposta.status).toBe(404);
    const noBanco = await prisma.evento.findUnique({ where: { id: evento.id } });
    expect(noBanco).toMatchObject({ titulo: "Prova original", disciplinaId: disciplina.id });
  });
});
