import request from "supertest";
import app from "../app";
import { prisma } from "../config/prisma";
import { limparBanco } from "./banco";
import { criarUsuarioDeTeste } from "./usuarioDeTeste";
import { dataRelativa } from "./datas";
import { AULAS_72H, AULAS_80H } from "./aulas";

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

  it("calcula a carga horária pelos dias, horários e datas das aulas", async () => {
    const resposta = await request(app).post("/api/disciplinas").set(autorizacao).send({
      nome: "Cálculo I",
      professor: "Helena Duarte",
      horario: "Seg 19:00–22:00, Qua 19:00–22:00",
      inicioAulas: "2026-08-03",
      fimAulas: "2026-12-18",
    });

    expect(resposta.status).toBe(201);
    expect(resposta.body).not.toHaveProperty("semestre");
    expect(resposta.body).not.toHaveProperty("duracaoAula");
    expect(resposta.body).not.toHaveProperty("aulasDescontadas");
    expect(resposta.body).toMatchObject({
      cargaHoraria: 120,
      horario: "Seg 19:00–22:00, Qua 19:00–22:00",
    });
  });

  it("ignora a carga horária enviada pelo usuário e usa a calculada", async () => {
    const calculada = await request(app)
      .post("/api/disciplinas")
      .set(autorizacao)
      .send({ nome: "Cálculo I", ...AULAS_72H, cargaHoraria: 999 });
    const semAulas = await request(app)
      .post("/api/disciplinas")
      .set(autorizacao)
      .send({ nome: "Redes", cargaHoraria: 72 });

    expect(calculada.body.cargaHoraria).toBe(72);
    expect(semAulas.body.cargaHoraria).toBeNull();
  });

  it("fica sem carga horária quando faltam os dias, os horários ou as datas", async () => {
    const enviar = (nome: string, campos: Record<string, unknown>) =>
      request(app).post("/api/disciplinas").set(autorizacao).send({ nome, ...campos });

    const semDatas = await enviar("A", { horario: AULAS_72H.horario });
    const semHorario = await enviar("B", { inicioAulas: AULAS_72H.inicioAulas, fimAulas: AULAS_72H.fimAulas });
    const soInicio = await enviar("C", { horario: AULAS_72H.horario, inicioAulas: AULAS_72H.inicioAulas });
    const horarioLivre = await enviar("D", { ...AULAS_72H, horario: "Seg e Qua · 08:00–09:40" });

    expect([semDatas, semHorario, soInicio, horarioLivre].map((r) => [r.status, r.body.cargaHoraria])).toEqual([
      [201, null],
      [201, null],
      [201, null],
      [201, null],
    ]);
    expect(horarioLivre.body.horario).toBe("Seg e Qua · 08:00–09:40");
  });

  it("recalcula a carga horária quando os dias, os horários ou as datas mudam", async () => {
    const criada = await request(app).post("/api/disciplinas").set(autorizacao).send({ nome: "Cálculo I", ...AULAS_72H });
    const editar = (campos: Record<string, unknown>) =>
      request(app).put(`/api/disciplinas/${criada.body.id}`).set(autorizacao).send({ nome: "Cálculo I", ...campos });

    const novaData = await editar(AULAS_80H);
    const novoHorario = await editar({ ...AULAS_80H, horario: "Seg 19:00–22:00, Qua 19:00–22:00" });
    const datasMantidas = await editar({ horario: AULAS_80H.horario });
    const semHorario = await editar({});

    expect(criada.body.cargaHoraria).toBe(72);
    expect(novaData.body.cargaHoraria).toBe(80);
    expect(novoHorario.body.cargaHoraria).toBe(117);
    expect(datasMantidas.body.cargaHoraria).toBe(80);
    expect(semHorario.body).toMatchObject({ horario: null, cargaHoraria: null });
  });

  it("recusa aulas que somam mais horas que o limite de carga horária", async () => {
    const resposta = await request(app).post("/api/disciplinas").set(autorizacao).send({
      nome: "Cálculo I",
      horario: "Seg 00:00–23:59, Ter 00:00–23:59, Qua 00:00–23:59",
      inicioAulas: "2026-01-01",
      fimAulas: "2026-12-31",
    });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toContain("carga horária calculada");
  });

  it("cadastra o período das aulas", async () => {
    const resposta = await request(app).post("/api/disciplinas").set(autorizacao).send({
      nome: "Cálculo I",
      horario: "Seg 19:00–22:00",
      inicioAulas: "2026-08-03",
      fimAulas: "2026-12-12",
    });

    expect(resposta.status).toBe(201);
    expect(resposta.body.inicioAulas.slice(0, 10)).toBe("2026-08-03");
    expect(resposta.body.fimAulas.slice(0, 10)).toBe("2026-12-12");
  });

  it("aceita só a data de início, só a de término, aulas em um único dia ou nenhuma data", async () => {
    const enviar = (nome: string, periodo: Record<string, unknown>) =>
      request(app).post("/api/disciplinas").set(autorizacao).send({ nome, ...periodo });

    const soInicio = await enviar("A", { inicioAulas: "2026-08-03" });
    const soFim = await enviar("B", { fimAulas: "2026-12-12" });
    const umDia = await enviar("C", { inicioAulas: "2026-09-01", fimAulas: "2026-09-01" });
    const vazio = await enviar("D", { inicioAulas: "", fimAulas: null });

    expect([soInicio.status, soFim.status, umDia.status, vazio.status]).toEqual([201, 201, 201, 201]);
    expect(soInicio.body.fimAulas).toBeNull();
    expect(soFim.body.inicioAulas).toBeNull();
    expect(vazio.body).toMatchObject({ inicioAulas: null, fimAulas: null });
  });

  it.each(["03/08/2026", "2026-02-30", "amanhã", "2026-08-03T10:00"])(
    "recusa data de início do período fora do formato AAAA-MM-DD (%p)",
    async (inicioAulas) => {
      const resposta = await request(app)
        .post("/api/disciplinas")
        .set(autorizacao)
        .send({ nome: "Cálculo I", inicioAulas });

      expect(resposta.status).toBe(400);
      expect(resposta.body.erro).toContain("período das aulas");
    }
  );

  it("recusa data final do período anterior à data inicial", async () => {
    const resposta = await request(app)
      .post("/api/disciplinas")
      .set(autorizacao)
      .send({ nome: "Cálculo I", inicioAulas: "2026-12-12", fimAulas: "2026-08-03" });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toContain("anterior");
  });

  it("na edição mantém o período se não for enviado e remove se vier vazio", async () => {
    const criada = await request(app).post("/api/disciplinas").set(autorizacao).send({
      nome: "Cálculo I",
      inicioAulas: "2026-08-03",
      fimAulas: "2026-12-12",
    });
    const id = criada.body.id;

    const semPeriodo = await request(app)
      .put(`/api/disciplinas/${id}`)
      .set(autorizacao)
      .send({ nome: "Cálculo I", professor: "Helena" });
    expect(semPeriodo.status).toBe(200);
    expect(semPeriodo.body.inicioAulas.slice(0, 10)).toBe("2026-08-03");
    expect(semPeriodo.body.fimAulas.slice(0, 10)).toBe("2026-12-12");

    const novoFim = await request(app)
      .put(`/api/disciplinas/${id}`)
      .set(autorizacao)
      .send({ nome: "Cálculo I", inicioAulas: "2026-08-03", fimAulas: "2026-11-30" });
    expect(novoFim.body.fimAulas.slice(0, 10)).toBe("2026-11-30");

    const removido = await request(app)
      .put(`/api/disciplinas/${id}`)
      .set(autorizacao)
      .send({ nome: "Cálculo I", inicioAulas: "", fimAulas: null });
    expect(removido.body).toMatchObject({ inicioAulas: null, fimAulas: null });
  });

  it("aceita os campos complementares vazios", async () => {
    const resposta = await request(app).post("/api/disciplinas").set(autorizacao).send({
      nome: "Redes",
      professor: "",
      cargaHoraria: null,
      horario: "",
    });

    expect(resposta.status).toBe(201);
    expect(resposta.body).toMatchObject({
      professor: null,
      cargaHoraria: null,
      horario: null,
    });
  });

  it("usa critérios padrão (média ponderada, sem média de aprovação, sem limite de faltas)", async () => {
    const resposta = await request(app).post("/api/disciplinas").set(autorizacao).send({ nome: "Redes" });

    expect(resposta.body).toMatchObject({ regraMedia: "PONDERADA", mediaAprovacao: null, limiteFaltas: null });
  });

  it("salva e mantém os critérios de avaliação", async () => {
    const criada = await request(app).post("/api/disciplinas").set(autorizacao).send({
      nome: "Cálculo I",
      regraMedia: "ARITMETICA",
      mediaAprovacao: 6,
      limiteFaltas: 20,
    });

    const editada = await request(app)
      .put(`/api/disciplinas/${criada.body.id}`)
      .set(autorizacao)
      .send({ nome: "Cálculo I", professor: "Helena" });

    expect(editada.body.regraMedia).toBe("ARITMETICA");
    expect(Number(editada.body.mediaAprovacao)).toBe(6);
    expect(editada.body.limiteFaltas).toBe(20);

    const semCriterios = await request(app)
      .put(`/api/disciplinas/${criada.body.id}`)
      .set(autorizacao)
      .send({ nome: "Cálculo I", mediaAprovacao: null, limiteFaltas: null });
    expect(semCriterios.body.mediaAprovacao).toBeNull();
    expect(semCriterios.body.limiteFaltas).toBeNull();
  });

  it("aceita limite de zero faltas", async () => {
    const resposta = await request(app)
      .post("/api/disciplinas")
      .set(autorizacao)
      .send({ nome: "Estágio", limiteFaltas: 0 });

    expect(resposta.status).toBe(201);
    expect(resposta.body.limiteFaltas).toBe(0);
  });

  it.each([
    [{ regraMedia: "MEDIANA" }, "Regra da média"],
    [{ mediaAprovacao: 11 }, "média de aprovação"],
    [{ limiteFaltas: -1 }, "limite de faltas"],
    [{ limiteFaltas: 4.5 }, "limite de faltas"],
    [{ limiteFaltas: 1001 }, "limite de faltas"],
  ])("recusa critério inválido %p", async (criterio, trecho) => {
    const resposta = await request(app)
      .post("/api/disciplinas")
      .set(autorizacao)
      .send({ nome: "Cálculo I", ...criterio });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toContain(trecho);
  });

  it("informa média e frequência de cada disciplina na listagem", async () => {
    const id = await criarDisciplina("Banco de Dados", { limiteFaltas: 1 });
    await criarEvento(id, { titulo: "Prova 1", data: dataRelativa(-3) });
    const eventos = await prisma.evento.findMany();
    await request(app).put(`/api/eventos/${eventos[0].id}/nota`).set(autorizacao).send({ nota: 7.5 });
    await request(app)
      .post(`/api/disciplinas/${id}/frequencias`)
      .set(autorizacao)
      .send({ data: dataRelativa(-3), quantidadeAulas: 4, faltas: 1 });

    const resposta = await request(app).get("/api/disciplinas").set(autorizacao);

    expect(resposta.body[0]).toMatchObject({
      nome: "Banco de Dados",
      media: 7.5,
      situacaoNota: "SEM_CRITERIO",
      percentualFaltas: 25,
      situacaoFrequencia: "PERTO_DO_LIMITE",
    });
  });

  it("usa peso 1 para a M1 e peso 2 para a M2 quando os pesos não são informados", async () => {
    const resposta = await request(app).post("/api/disciplinas").set(autorizacao).send({ nome: "Redes" });

    expect([Number(resposta.body.pesoM1), Number(resposta.body.pesoM2)]).toEqual([1, 2]);
  });

  it("cadastra o período acadêmico como semestre do curso ou como Exame/Recuperação", async () => {
    const semestre = await request(app)
      .post("/api/disciplinas")
      .set(autorizacao)
      .send({ nome: "Cálculo I", periodoTipo: "SEMESTRE", periodoNumero: 2 });
    const exame = await request(app)
      .post("/api/disciplinas")
      .set(autorizacao)
      .send({ nome: "Física (exame)", periodoTipo: "EXAME", periodoNumero: 3 });
    const semPeriodo = await request(app).post("/api/disciplinas").set(autorizacao).send({ nome: "Redes" });

    expect(semestre.body).toMatchObject({ periodoTipo: "SEMESTRE", periodoNumero: 2 });
    expect(exame.body).toMatchObject({ periodoTipo: "EXAME", periodoNumero: null });
    expect(semPeriodo.body).toMatchObject({ periodoTipo: null, periodoNumero: null });
  });

  it("mantém o período acadêmico quando ele não é enviado na edição e limpa com null", async () => {
    const criada = await request(app)
      .post("/api/disciplinas")
      .set(autorizacao)
      .send({ nome: "Cálculo I", periodoTipo: "SEMESTRE", periodoNumero: 8 });

    const mantida = await request(app)
      .put(`/api/disciplinas/${criada.body.id}`)
      .set(autorizacao)
      .send({ nome: "Cálculo I", professor: "Helena" });
    const limpa = await request(app)
      .put(`/api/disciplinas/${criada.body.id}`)
      .set(autorizacao)
      .send({ nome: "Cálculo I", periodoTipo: null });

    expect(mantida.body).toMatchObject({ periodoTipo: "SEMESTRE", periodoNumero: 8 });
    expect(limpa.body).toMatchObject({ periodoTipo: null, periodoNumero: null });
  });

  it.each([
    [{ periodoTipo: "TRIMESTRE" }, "Período acadêmico inválido"],
    [{ periodoTipo: "SEMESTRE" }, "qual é o semestre"],
    [{ periodoTipo: "SEMESTRE", periodoNumero: 0 }, "entre 1 e 12"],
    [{ periodoTipo: "SEMESTRE", periodoNumero: 13 }, "entre 1 e 12"],
  ])("recusa período acadêmico inválido %p", async (campos, trecho) => {
    const resposta = await request(app)
      .post("/api/disciplinas")
      .set(autorizacao)
      .send({ nome: "Cálculo I", ...campos });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toContain(trecho);
  });

  it("salva e mantém os pesos da M1 e da M2", async () => {
    const criada = await request(app)
      .post("/api/disciplinas")
      .set(autorizacao)
      .send({ nome: "Cálculo I", pesoM1: 4, pesoM2: 6 });

    const editada = await request(app)
      .put(`/api/disciplinas/${criada.body.id}`)
      .set(autorizacao)
      .send({ nome: "Cálculo I", professor: "Helena" });

    expect([Number(editada.body.pesoM1), Number(editada.body.pesoM2)]).toEqual([4, 6]);
  });

  it.each([{ pesoM1: 0 }, { pesoM2: -1 }, { pesoM1: 101 }, { pesoM2: "abc" }])(
    "recusa peso de etapa inválido %p",
    async (pesos) => {
      const resposta = await request(app)
        .post("/api/disciplinas")
        .set(autorizacao)
        .send({ nome: "Cálculo I", ...pesos });

      expect(resposta.status).toBe(400);
      expect(resposta.body.erro).toContain("peso da M1 e o peso da M2");
    }
  );

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
      ...AULAS_72H,
    });

    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({
      id,
      nome: "Cálculo I",
      professor: "Helena Duarte",
      cargaHoraria: 72,
      horario: AULAS_72H.horario,
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
    expect(resposta.body.detalhes).toEqual({ eventos: 1, frequencias: 0 });
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
      [
        "DISCIPLINA_EXCLUIDA",
        "Redes II (removidos junto: 1 evento(s), 0 registro(s) de frequência)",
      ],
    ]);
  });
});

async function criarDisciplina(nome: string, criterios: Record<string, unknown> = {}) {
  const resposta = await request(app).post("/api/disciplinas").set(autorizacao).send({ nome, ...criterios });
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
