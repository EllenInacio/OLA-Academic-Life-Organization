import type { Server } from "http";
import type { AddressInfo } from "net";
import app from "../../app";
import { prisma } from "../../config/prisma";
import { dataRelativa } from "../datas";
import {
  Autorizacao,
  acoesDeAuditoria,
  criarUsuarioIntegracao,
  dadosDisciplina,
  dadosEvento,
  nomeUnico,
  removerUsuariosCriados,
} from "./ajudantes";
import { criarClienteHttp } from "./clienteHttp";

const MENSAGEM_SESSAO_INVALIDA = "Sessão expirada ou inválida. Faça login novamente.";
const ID_INEXISTENTE = 2147483647;

let servidor: Server;
let api: ReturnType<typeof criarClienteHttp>;
let usuario: { id: number };
let autorizacao: Autorizacao;

async function criarDisciplina(sobrescrever: Record<string, unknown> = {}) {
  const resposta = await api.post("/api/disciplinas", dadosDisciplina(sobrescrever), autorizacao);
  expect(resposta.status).toBe(201);
  return resposta.corpo as { id: number; nome: string };
}

async function criarEvento(disciplinaId: number, sobrescrever: Record<string, unknown> = {}) {
  const resposta = await api.post("/api/eventos", dadosEvento(disciplinaId, sobrescrever), autorizacao);
  expect(resposta.status).toBe(201);
  return resposta.corpo as { id: number };
}

describe("DisciplinaController (integração)", () => {
  beforeAll(async () => {
    servidor = app.listen(0);
    await new Promise<void>((resolve) => servidor.once("listening", () => resolve()));
    const { port } = servidor.address() as AddressInfo;
    api = criarClienteHttp(`http://127.0.0.1:${port}`);
  });

  beforeEach(async () => {
    ({ usuario, autorizacao } = await criarUsuarioIntegracao());
  });

  afterAll(async () => {
    servidor.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      servidor.close((erro) => (erro ? reject(erro) : resolve()))
    );
    await removerUsuariosCriados();
    await prisma.$disconnect();
  });


  it("listar_comDisciplinasDoUsuario_deveRetornar200EmOrdemAlfabeticaComTotalDeEventos", async () => {
    const redes = await criarDisciplina({ nome: nomeUnico("Redes") });
    const algoritmos = await criarDisciplina({ nome: nomeUnico("Algoritmos") });
    await criarEvento(algoritmos.id);

    const resposta = await api.get("/api/disciplinas", autorizacao);

    expect(resposta.status).toBe(200);
    expect(
      resposta.corpo.map((d: { id: number; totalEventos: number }) => [d.id, d.totalEventos])
    ).toEqual([
      [algoritmos.id, 1],
      [redes.id, 0],
    ]);
  });

  it("buscarPorId_comEventosCadastrados_deveRetornar200ComEventosOrdenadosPorDataEResumo", async () => {
    const disciplina = await criarDisciplina();
    await criarEvento(disciplina.id, { titulo: "Entrega final", tipo: "ENTREGA", data: dataRelativa(20) });
    await criarEvento(disciplina.id, { titulo: "Prova 1", tipo: "PROVA", data: dataRelativa(5) });

    const resposta = await api.get(`/api/disciplinas/${disciplina.id}`, autorizacao);

    expect(resposta.status).toBe(200);
    expect(resposta.corpo.id).toBe(disciplina.id);
    expect(resposta.corpo.eventos.map((e: { titulo: string }) => e.titulo)).toEqual([
      "Prova 1",
      "Entrega final",
    ]);
    expect(resposta.corpo.eventos.map((e: { diasRestantes: number }) => e.diasRestantes)).toEqual([5, 20]);
    expect(resposta.corpo.resumo.eventos).toMatchObject({ total: 2, pendentes: 2, concluidos: 0 });
    expect(resposta.corpo.resumo.proximoEvento).toMatchObject({ titulo: "Prova 1", diasRestantes: 5 });
  });

  it("criar_comDadosValidos_deveRetornar201ComOsCamposInformados", async () => {
    const dados = dadosDisciplina();

    const resposta = await api.post("/api/disciplinas", dados, autorizacao);

    expect(resposta.status).toBe(201);
    expect(resposta.corpo).toMatchObject({
      nome: dados.nome,
      professor: "Profa. Helena",
      semestre: "2026.2",
      cargaHoraria: 80,
      horario: "Segundas e quartas, 19h",
      usuarioId: usuario.id,
    });
    expect(resposta.corpo.id).toEqual(expect.any(Number));
  });

  it("atualizar_comDadosValidos_deveRetornar200ComOsNovosValores", async () => {
    const disciplina = await criarDisciplina();
    const novosDados = dadosDisciplina({ professor: "Prof. Marcos", semestre: "2027.1", cargaHoraria: 60 });

    const resposta = await api.put(`/api/disciplinas/${disciplina.id}`, novosDados, autorizacao);

    expect(resposta.status).toBe(200);
    expect(resposta.corpo).toMatchObject({
      id: disciplina.id,
      nome: novosDados.nome,
      professor: "Prof. Marcos",
      semestre: "2027.1",
      cargaHoraria: 60,
    });
  });

  it("remover_semEventos_deveRetornar204SemCorpo", async () => {
    const disciplina = await criarDisciplina();

    const resposta = await api.delete(`/api/disciplinas/${disciplina.id}`, autorizacao);

    expect(resposta.status).toBe(204);
    expect(resposta.corpo).toBeNull();
  });

  it("listar_comUsuarioAutenticado_deveRetornarContentTypeJsonEHeadersDeSegurancaDoHelmet", async () => {
    const resposta = await api.get("/api/disciplinas", autorizacao);

    expect(resposta.status).toBe(200);
    expect(resposta.headers.get("content-type")).toContain("application/json");
    expect(resposta.headers.get("x-content-type-options")).toBe("nosniff");
    expect(resposta.headers.get("x-powered-by")).toBeNull();
  });

  // ---------- Persistência ----------

  it("criar_comDadosValidos_devePersistirDisciplinaDoUsuarioERegistrarAuditoria", async () => {
    const dados = dadosDisciplina();

    const resposta = await api.post("/api/disciplinas", dados, autorizacao);

    expect(resposta.status).toBe(201);
    const noBanco = await prisma.disciplina.findUnique({ where: { id: resposta.corpo.id } });
    expect(noBanco).toMatchObject({
      nome: dados.nome,
      professor: "Profa. Helena",
      semestre: "2026.2",
      cargaHoraria: 80,
      usuarioId: usuario.id,
    });
    expect(await acoesDeAuditoria(usuario.id)).toEqual([
      { acao: "DISCIPLINA_CRIADA", entidadeId: resposta.corpo.id, detalhe: dados.nome },
    ]);
  });

  it("atualizar_comDadosValidos_devePersistirAlteracaoNoBancoERegistrarAuditoria", async () => {
    const disciplina = await criarDisciplina();
    const novoNome = nomeUnico("Engenharia de Software");

    const resposta = await api.put(
      `/api/disciplinas/${disciplina.id}`,
      dadosDisciplina({ nome: novoNome, professor: "Prof. Marcos" }),
      autorizacao
    );

    expect(resposta.status).toBe(200);
    const noBanco = await prisma.disciplina.findUnique({ where: { id: disciplina.id } });
    expect(noBanco).toMatchObject({ nome: novoNome, professor: "Prof. Marcos" });
    expect((await acoesDeAuditoria(usuario.id)).map((log) => log.acao)).toEqual([
      "DISCIPLINA_CRIADA",
      "DISCIPLINA_ALTERADA",
    ]);
  });

  it("remover_semEventos_deveExcluirDisciplinaDoBancoERegistrarAuditoria", async () => {
    const disciplina = await criarDisciplina();

    const resposta = await api.delete(`/api/disciplinas/${disciplina.id}`, autorizacao);

    expect(resposta.status).toBe(204);
    expect(await prisma.disciplina.findUnique({ where: { id: disciplina.id } })).toBeNull();
    expect((await acoesDeAuditoria(usuario.id)).map((log) => log.acao)).toEqual([
      "DISCIPLINA_CRIADA",
      "DISCIPLINA_EXCLUIDA",
    ]);
  });

  // ---------- Erros 4xx ----------

  it("criar_semNome_deveRetornar400ComMensagemDeCampoObrigatorioENaoPersistir", async () => {
    const resposta = await api.post("/api/disciplinas", { professor: "Profa. Helena" }, autorizacao);

    expect(resposta.status).toBe(400);
    expect(resposta.corpo).toEqual({ erro: "O nome da disciplina é obrigatório." });
    expect(await prisma.disciplina.count({ where: { usuarioId: usuario.id } })).toBe(0);
  });

  it("criar_comNomeRepetidoDoMesmoUsuario_deveRetornar409ENaoDuplicarNoBanco", async () => {
    const original = await criarDisciplina();

    const resposta = await api.post("/api/disciplinas", dadosDisciplina({ nome: original.nome }), autorizacao);

    expect(resposta.status).toBe(409);
    expect(resposta.corpo).toEqual({ erro: "Já existe uma disciplina com esse nome." });
    expect(await prisma.disciplina.count({ where: { usuarioId: usuario.id } })).toBe(1);
  });

  it("atualizar_comNomeDeOutraDisciplinaDoUsuario_deveRetornar409EManterNomeOriginalNoBanco", async () => {
    const primeira = await criarDisciplina();
    const segunda = await criarDisciplina();

    const resposta = await api.put(
      `/api/disciplinas/${segunda.id}`,
      dadosDisciplina({ nome: primeira.nome }),
      autorizacao
    );

    expect(resposta.status).toBe(409);
    expect(resposta.corpo).toEqual({ erro: "Já existe uma disciplina com esse nome." });
    const noBanco = await prisma.disciplina.findUnique({ where: { id: segunda.id } });
    expect(noBanco!.nome).toBe(segunda.nome);
  });

  it("buscarPorId_comIdInexistente_deveRetornar404ComMensagem", async () => {
    const resposta = await api.get(`/api/disciplinas/${ID_INEXISTENTE}`, autorizacao);

    expect(resposta.status).toBe(404);
    expect(resposta.corpo).toEqual({ erro: "Disciplina não encontrada." });
  });

  it("buscarPorId_comIdNaoNumerico_deveRetornar400ComMensagemDeIdInvalido", async () => {
    const resposta = await api.get("/api/disciplinas/abc", autorizacao);

    expect(resposta.status).toBe(400);
    expect(resposta.corpo).toEqual({ erro: "Id inválido." });
  });

  it("remover_comEventosSemConfirmar_deveRetornar409InformandoQuantidadeEManterOsDados", async () => {
    const disciplina = await criarDisciplina();
    await criarEvento(disciplina.id);
    await criarEvento(disciplina.id);

    const resposta = await api.delete(`/api/disciplinas/${disciplina.id}`, autorizacao);

    expect(resposta.status).toBe(409);
    expect(resposta.corpo.erro).toContain("possui 2 evento(s) no calendário");
    expect(resposta.corpo.detalhes).toEqual({ eventos: 2 });
    expect(await prisma.disciplina.count({ where: { id: disciplina.id } })).toBe(1);
    expect(await prisma.evento.count({ where: { disciplinaId: disciplina.id } })).toBe(2);
  });

  // ---------- Segurança: o mesmo endpoint (GET /api/disciplinas/:id) em 3 situações ----------

  it("buscarPorId_semToken_deveRetornar401", async () => {
    const disciplina = await criarDisciplina();

    const resposta = await api.get(`/api/disciplinas/${disciplina.id}`);

    expect(resposta.status).toBe(401);
    expect(resposta.corpo).toEqual({ erro: MENSAGEM_SESSAO_INVALIDA });
  });

  it("buscarPorId_comDisciplinaDeOutroUsuario_deveRetornar404IgualAoDeIdInexistente", async () => {
    const disciplina = await criarDisciplina();
    const outro = await criarUsuarioIntegracao();

    const resposta = await api.get(`/api/disciplinas/${disciplina.id}`, outro.autorizacao);
    const inexistente = await api.get(`/api/disciplinas/${ID_INEXISTENTE}`, outro.autorizacao);

    expect(resposta.status).toBe(404);
    expect(resposta.corpo).toEqual(inexistente.corpo);
  });

  it("buscarPorId_comDonoAutenticado_deveRetornar200ComADisciplina", async () => {
    const disciplina = await criarDisciplina();

    const resposta = await api.get(`/api/disciplinas/${disciplina.id}`, autorizacao);

    expect(resposta.status).toBe(200);
    expect(resposta.corpo).toMatchObject({ id: disciplina.id, nome: disciplina.nome, usuarioId: usuario.id });
  });
});
