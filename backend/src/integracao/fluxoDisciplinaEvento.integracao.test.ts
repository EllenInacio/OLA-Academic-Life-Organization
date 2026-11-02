import request from "supertest";
import app from "../../app";
import { prisma } from "../../config/prisma";
import {
  Autorizacao,
  acoesDeAuditoria,
  criarDisciplinaPelaApi,
  criarEventoPelaApi,
  criarUsuarioIntegracao,
  dadosEvento,
  removerUsuariosCriados,
} from "./ajudantes";

// Fluxos que cruzam dois recursos relacionados: Disciplina (pai) e Evento (filho).

let usuario: { id: number };
let autorizacao: Autorizacao;

describe("Fluxo Disciplina + Evento (integração)", () => {
  beforeEach(async () => {
    ({ usuario, autorizacao } = await criarUsuarioIntegracao());
  });

  afterAll(async () => {
    await removerUsuariosCriados();
    await prisma.$disconnect();
  });

  it("fluxo_excluirDisciplinaComEventosConfirmando_deveRemoverOsEventosEmCascata", async () => {
    const disciplina = await criarDisciplinaPelaApi(autorizacao);
    const evento = await criarEventoPelaApi(autorizacao, disciplina.id);

    const detalhes = await request(app).get(`/api/disciplinas/${disciplina.id}`).set(autorizacao);
    expect(detalhes.body.eventos.map((e: { id: number }) => e.id)).toEqual([evento.id]);

    const exclusao = await request(app)
      .delete(`/api/disciplinas/${disciplina.id}?confirmar=true`)
      .set(autorizacao);

    expect(exclusao.status).toBe(204);
    const eventoDepois = await request(app).get(`/api/eventos/${evento.id}`).set(autorizacao);
    expect(eventoDepois.status).toBe(404);
    expect(await prisma.evento.count({ where: { id: evento.id } })).toBe(0);
    expect(await acoesDeAuditoria(usuario.id)).toContainEqual({
      acao: "DISCIPLINA_EXCLUIDA",
      entidadeId: disciplina.id,
      detalhe: `${disciplina.nome} (1 evento(s) removido(s) junto)`,
    });
  });

  it("fluxo_moverEventoParaOutraDisciplinaDoMesmoUsuario_deveAtualizarOTotalDeEventosDeCadaUma", async () => {
    const origem = await criarDisciplinaPelaApi(autorizacao);
    const destino = await criarDisciplinaPelaApi(autorizacao);
    const evento = await criarEventoPelaApi(autorizacao, origem.id);

    const edicao = await request(app)
      .put(`/api/eventos/${evento.id}`)
      .set(autorizacao)
      .send(dadosEvento(destino.id, { titulo: evento.titulo }));

    expect(edicao.status).toBe(200);
    expect(edicao.body.disciplina).toEqual({ id: destino.id, nome: destino.nome });

    const lista = await request(app).get("/api/disciplinas").set(autorizacao);
    const totais = Object.fromEntries(
      lista.body.map((d: { id: number; totalEventos: number }) => [d.id, d.totalEventos])
    );
    expect(totais).toEqual({ [origem.id]: 0, [destino.id]: 1 });
  });
});
