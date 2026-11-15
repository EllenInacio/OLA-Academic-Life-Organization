import { calcularDesempenho, calcularNotaNecessaria, notaNaEscala, AvaliacaoParaCalculo } from "../calculos/notas";
import { calcularFrequencia } from "../calculos/frequencia";
import { DisciplinaParaCalculo, EventoParaCalculo, calcularMediaGeral, montarPainel } from "../calculos/painel";

const HOJE = "2026-10-16";

function avaliacao(peso: number, nota: number | null, dados: Partial<AvaliacaoParaCalculo> = {}): AvaliacaoParaCalculo {
  return { data: "2026-10-01", peso, nota, notaMaxima: 10, etapa: "M1", ...dados };
}

function m2(peso: number, nota: number | null, dados: Partial<AvaliacaoParaCalculo> = {}) {
  return avaliacao(peso, nota, { etapa: "M2", ...dados });
}

const PESOS_IGUAIS = { pesoM1: 1, pesoM2: 1 };
const PONDERADA_SEM_CRITERIO = { regraMedia: "PONDERADA" as const, mediaAprovacao: null, ...PESOS_IGUAIS };
const PONDERADA_MEDIA_6 = { regraMedia: "PONDERADA" as const, mediaAprovacao: 6, ...PESOS_IGUAIS };
const ARITMETICA_MEDIA_6 = { regraMedia: "ARITMETICA" as const, mediaAprovacao: 6, ...PESOS_IGUAIS };

describe("Média da disciplina", () => {
  const exemplo = [avaliacao(3, 6.5), avaliacao(1, 8), avaliacao(3, null, { data: "2026-10-20" })];

  it("calcula a média ponderada parcial só com as notas lançadas", () => {
    const desempenho = calcularDesempenho(exemplo, PONDERADA_SEM_CRITERIO, HOJE);

    expect(desempenho.media).toBe(6.88);
    expect(desempenho.final).toBe(false);
    expect(desempenho.avaliacoes).toEqual({
      total: 3,
      comNota: 2,
      semNota: 1,
      aguardandoNota: 0,
      naoAvaliativos: 0,
    });
  });

  it("não informa situação sem média de aprovação definida", () => {
    const desempenho = calcularDesempenho(exemplo, PONDERADA_SEM_CRITERIO, HOJE);

    expect(desempenho.situacao).toBe("SEM_CRITERIO");
    expect(desempenho.notaNecessaria).toBeNull();
  });

  it("informa a situação parcial e a nota necessária no que ainda falta", () => {
    const desempenho = calcularDesempenho(exemplo, PONDERADA_MEDIA_6, HOJE);

    expect(desempenho.situacao).toBe("PARCIAL_ACIMA");
    expect(desempenho.notaNecessaria).toEqual({ valor: 5.65, alcancavel: true });
  });

  it("calcula a média aritmética quando essa é a regra da disciplina", () => {
    const desempenho = calcularDesempenho(exemplo, ARITMETICA_MEDIA_6, HOJE);

    expect(desempenho.media).toBe(7.25);
    expect(desempenho.notaNecessaria).toEqual({ valor: 5.38, alcancavel: true });
  });

  it("converte notas de outra escala para 0–10 pela nota máxima", () => {
    expect(notaNaEscala(15, 20)).toBe(7.5);

    const desempenho = calcularDesempenho(
      [avaliacao(2, 15, { notaMaxima: 20 }), avaliacao(2, 9)],
      PONDERADA_SEM_CRITERIO,
      HOJE
    );
    expect(desempenho.media).toBe(8.25);
  });

  it("ignora eventos com peso 0 (não avaliativos)", () => {
    const desempenho = calcularDesempenho(
      [avaliacao(2, 7), avaliacao(0, null), m2(1, 7)],
      PONDERADA_SEM_CRITERIO,
      HOJE
    );

    expect(desempenho.media).toBe(7);
    expect(desempenho.final).toBe(true);
    expect(desempenho.avaliacoes.naoAvaliativos).toBe(1);
  });

  it("não inventa média quando nenhuma nota foi lançada", () => {
    const desempenho = calcularDesempenho([avaliacao(3, null), avaliacao(3, null)], PONDERADA_MEDIA_6, HOJE);

    expect(desempenho.media).toBeNull();
    expect(desempenho.situacao).toBe("SEM_NOTAS");
    expect(desempenho.notaNecessaria).toEqual({ valor: 6, alcancavel: true });
  });

  it("indica a situação final quando as duas etapas estão com todas as notas", () => {
    const aprovada = calcularDesempenho([avaliacao(1, 6), m2(1, 7)], PONDERADA_MEDIA_6, HOJE);
    const abaixo = calcularDesempenho([avaliacao(1, 5), m2(1, 6)], PONDERADA_MEDIA_6, HOJE);

    expect([aprovada.media, aprovada.situacao, aprovada.notaNecessaria]).toEqual([6.5, "ATINGIU_MEDIA", null]);
    expect([abaixo.media, abaixo.situacao]).toEqual([5.5, "ABAIXO_DA_MEDIA"]);
  });

  it("conta as avaliações cuja data já chegou e ainda estão sem nota", () => {
    const desempenho = calcularDesempenho(
      [avaliacao(1, null, { data: "2026-10-10" }), avaliacao(1, null, { data: HOJE }), avaliacao(1, null, { data: "2026-11-01" })],
      PONDERADA_SEM_CRITERIO,
      HOJE
    );

    expect(desempenho.avaliacoes.aguardandoNota).toBe(2);
  });

  it("indica média já garantida e média inalcançável", () => {
    const m2Fechada = (nota: number) => ({ peso: 1, somaPonderada: nota, pesoLancado: 1, pesoRestante: 0 });

    expect(
      calcularNotaNecessaria([{ peso: 1, somaPonderada: 30, pesoLancado: 3, pesoRestante: 1 }, m2Fechada(10)], 6)
    ).toEqual({ valor: 0, alcancavel: true });
    expect(
      calcularNotaNecessaria([{ peso: 1, somaPonderada: 6, pesoLancado: 3, pesoRestante: 1 }, m2Fechada(2)], 7)
    ).toEqual({ valor: 42, alcancavel: false });
    expect(calcularNotaNecessaria([m2Fechada(8), m2Fechada(5)], 6)).toBeNull();
  });
});

describe("Etapas M1 e M2", () => {
  it("calcula a média de cada etapa e a média final com pesos iguais", () => {
    const desempenho = calcularDesempenho([avaliacao(1, 6), avaliacao(1, 8), m2(1, 9)], PONDERADA_MEDIA_6, HOJE);

    expect(desempenho.etapas).toEqual([
      { etapa: "M1", peso: 1, media: 7, completa: true, avaliacoes: { total: 2, comNota: 2, semNota: 0 } },
      { etapa: "M2", peso: 1, media: 9, completa: true, avaliacoes: { total: 1, comNota: 1, semNota: 0 } },
    ]);
    expect([desempenho.media, desempenho.final, desempenho.situacao]).toEqual([8, true, "ATINGIU_MEDIA"]);
  });

  it("aplica o peso de cada etapa na média final", () => {
    const criterios = { regraMedia: "PONDERADA" as const, mediaAprovacao: 6, pesoM1: 4, pesoM2: 6 };
    const desempenho = calcularDesempenho([avaliacao(1, 7), m2(1, 9)], criterios, HOJE);

    expect(desempenho.media).toBe(8.2);
  });

  it("usa a regra da disciplina (pesos das avaliações) dentro de cada etapa", () => {
    const desempenho = calcularDesempenho(
      [avaliacao(3, 6), avaliacao(1, 10), m2(1, 4), m2(1, 8)],
      PONDERADA_SEM_CRITERIO,
      HOJE
    );

    expect(desempenho.etapas.map((etapa) => etapa.media)).toEqual([7, 6]);
    expect(desempenho.media).toBe(6.5);
  });

  it("enquanto a M2 não tem nota, a média é parcial e considera só a M1", () => {
    const criterios = { regraMedia: "PONDERADA" as const, mediaAprovacao: 6, pesoM1: 4, pesoM2: 6 };
    const desempenho = calcularDesempenho([avaliacao(1, 7), m2(1, null, { data: "2026-11-20" })], criterios, HOJE);

    expect([desempenho.media, desempenho.final, desempenho.situacao]).toEqual([7, false, "PARCIAL_ACIMA"]);
    expect(desempenho.etapas[1]).toMatchObject({ etapa: "M2", media: null, completa: false });
    expect(desempenho.notaNecessaria).toEqual({ valor: 5.33, alcancavel: true });
  });

  it("etapa ainda sem avaliações conta como em aberto", () => {
    const desempenho = calcularDesempenho([avaliacao(1, 4)], PONDERADA_MEDIA_6, HOJE);

    expect([desempenho.media, desempenho.final, desempenho.situacao]).toEqual([4, false, "PARCIAL_ABAIXO"]);
    expect(desempenho.notaNecessaria).toEqual({ valor: 8, alcancavel: true });
  });
});

describe("Médias progressivas com os pesos padrão (M1 = 1, M2 = 2)", () => {
  const PADRAO = { regraMedia: "PONDERADA" as const, mediaAprovacao: 6, pesoM1: 1, pesoM2: 2 };

  it("só a M1 preenchida: média parcial da M1, M2 sem notas e média geral parcial", () => {
    const desempenho = calcularDesempenho([avaliacao(3, 6.5), avaliacao(1, 8)], PADRAO, HOJE);

    expect(desempenho.etapas.map((etapa) => [etapa.etapa, etapa.media])).toEqual([
      ["M1", 6.88],
      ["M2", null],
    ]);
    expect([desempenho.media, desempenho.final, desempenho.situacao]).toEqual([6.88, false, "PARCIAL_ACIMA"]);
  });

  it("só a M2 preenchida: média parcial da M2, M1 sem notas e média geral parcial", () => {
    const desempenho = calcularDesempenho([m2(2, 5), m2(1, 8)], PADRAO, HOJE);

    expect(desempenho.etapas.map((etapa) => [etapa.etapa, etapa.media])).toEqual([
      ["M1", null],
      ["M2", 6],
    ]);
    expect([desempenho.media, desempenho.final, desempenho.situacao]).toEqual([6, false, "PARCIAL_ACIMA"]);
  });

  it("as duas preenchidas: média final geral = (M1 × 1 + M2 × 2) ÷ 3", () => {
    const desempenho = calcularDesempenho([avaliacao(1, 6), m2(1, 9)], PADRAO, HOJE);

    expect([desempenho.media, desempenho.final, desempenho.situacao]).toEqual([8, true, "ATINGIU_MEDIA"]);
  });

  it("avaliação sem nota não entra como zero e mantém a média como parcial", () => {
    const desempenho = calcularDesempenho(
      [avaliacao(1, 6), avaliacao(1, null), m2(1, 9), m2(1, null, { data: "2026-11-20" })],
      PADRAO,
      HOJE
    );

    expect(desempenho.etapas.map((etapa) => [etapa.media, etapa.completa])).toEqual([
      [6, false],
      [9, false],
    ]);
    expect([desempenho.media, desempenho.final, desempenho.situacao]).toEqual([8, false, "PARCIAL_ACIMA"]);
  });

  it("recalcula as médias quando uma nota ou um peso muda", () => {
    const antes = calcularDesempenho([avaliacao(3, 6), avaliacao(1, 10), m2(1, 9)], PADRAO, HOJE);
    const notaAlterada = calcularDesempenho([avaliacao(3, 8), avaliacao(1, 10), m2(1, 9)], PADRAO, HOJE);
    const pesoAlterado = calcularDesempenho([avaliacao(1, 6), avaliacao(1, 10), m2(1, 9)], PADRAO, HOJE);

    expect([antes.etapas[0].media, notaAlterada.etapas[0].media, pesoAlterado.etapas[0].media]).toEqual([7, 8.5, 8]);
    expect([antes.media, notaAlterada.media, pesoAlterado.media]).toEqual([8.33, 8.83, 8.67]);
  });
});

describe("Frequência da disciplina", () => {
  const LIMITE_18 = { cargaHoraria: 72, limiteFaltas: 18 };

  function registros(aulas: number, faltas: number) {
    return Array.from({ length: aulas }, (_, i) => ({ quantidadeAulas: 1, faltas: i < faltas ? 1 : 0 }));
  }

  it("não apresenta percentual sem registros", () => {
    const frequencia = calcularFrequencia([], LIMITE_18);

    expect(frequencia.situacao).toBe("SEM_REGISTROS");
    expect(frequencia.percentualFaltas).toBeNull();
    expect(frequencia.faltasPermitidas).toBe(18);
    expect(frequencia.faltasRestantes).toBe(18);
  });

  it("calcula o percentual sobre o total de aulas da disciplina e as faltas restantes", () => {
    const frequencia = calcularFrequencia(registros(32, 7), LIMITE_18);

    expect(frequencia).toMatchObject({
      base: "TOTAL_DA_DISCIPLINA",
      totalAulas: 72,
      aulasRegistradas: 32,
      faltas: 7,
      presencas: 25,
      percentualFaltas: 9.72,
      percentualPresenca: 90.28,
      faltasAcimaDoTotal: false,
      aulasPrevistas: 72,
      limiteFaltas: 18,
      faltasPermitidas: 18,
      faltasRestantes: 11,
      situacao: "DENTRO_DO_LIMITE",
      ritmoAcimaDoLimite: false,
    });
  });

  it("soma aulas e faltas de registros com mais de uma aula no dia", () => {
    const frequencia = calcularFrequencia(
      [
        { quantidadeAulas: 2, faltas: 2 },
        { quantidadeAulas: 2, faltas: 1 },
        { quantidadeAulas: 2, faltas: 0 },
      ],
      LIMITE_18
    );

    expect([frequencia.aulasRegistradas, frequencia.faltas, frequencia.percentualFaltas]).toEqual([6, 3, 4.17]);
    expect(frequencia.ritmoAcimaDoLimite).toBe(true);
    expect(frequencia.situacao).toBe("DENTRO_DO_LIMITE");
  });

  it("indica atenção a partir de 75% das faltas permitidas e limite ultrapassado", () => {
    expect(calcularFrequencia(registros(40, 13), LIMITE_18).situacao).toBe("DENTRO_DO_LIMITE");
    expect(calcularFrequencia(registros(40, 14), LIMITE_18).situacao).toBe("PERTO_DO_LIMITE");
    expect(calcularFrequencia(registros(40, 18), LIMITE_18).situacao).toBe("PERTO_DO_LIMITE");

    const acima = calcularFrequencia(registros(40, 19), LIMITE_18);
    expect([acima.situacao, acima.faltasRestantes]).toEqual(["ACIMA_DO_LIMITE", -1]);
  });

  it("usa a quantidade cadastrada, sem depender da carga horária", () => {
    const semCarga = { cargaHoraria: null, limiteFaltas: 7 };

    expect(calcularFrequencia([], semCarga).faltasPermitidas).toBe(7);
    expect(calcularFrequencia(registros(10, 5), semCarga).situacao).toBe("DENTRO_DO_LIMITE");
    expect(calcularFrequencia(registros(10, 6), semCarga).situacao).toBe("PERTO_DO_LIMITE");

    const acima = calcularFrequencia(registros(10, 8), semCarga);
    expect([acima.situacao, acima.faltasRestantes, acima.aulasPrevistas]).toEqual(["ACIMA_DO_LIMITE", -1, null]);
    expect(acima.ritmoAcimaDoLimite).toBe(false);
  });

  it("aceita limite de zero faltas", () => {
    const semFaltas = { cargaHoraria: 72, limiteFaltas: 0 };

    expect(calcularFrequencia(registros(4, 0), semFaltas).situacao).toBe("DENTRO_DO_LIMITE");
    expect(calcularFrequencia(registros(4, 1), semFaltas).situacao).toBe("ACIMA_DO_LIMITE");
  });

  it("sem limite de faltas, calcula os percentuais mas não avalia a situação", () => {
    const frequencia = calcularFrequencia(registros(10, 3), { cargaHoraria: 72, limiteFaltas: null });

    expect(frequencia).toMatchObject({
      percentualFaltas: 4.17,
      limiteFaltas: null,
      faltasPermitidas: null,
      faltasRestantes: null,
      situacao: "SEM_LIMITE",
      ritmoAcimaDoLimite: false,
    });
  });

  it("sem o total de aulas da disciplina, o percentual é parcial e usa as aulas registradas", () => {
    const frequencia = calcularFrequencia(registros(10, 3), { cargaHoraria: null, limiteFaltas: null });

    expect(frequencia).toMatchObject({
      base: "AULAS_REGISTRADAS",
      totalAulas: 10,
      percentualFaltas: 30,
      percentualPresenca: 70,
      faltasAcimaDoTotal: false,
    });
  });

  it("aceita várias faltas no mesmo dia, mesmo acima das aulas informadas no dia", () => {
    const frequencia = calcularFrequencia([{ quantidadeAulas: 1, faltas: 4 }], LIMITE_18);

    expect(frequencia).toMatchObject({
      faltas: 4,
      percentualFaltas: 5.56,
      percentualPresenca: 94.44,
      faltasAcimaDoTotal: false,
      faltasRestantes: 14,
      situacao: "DENTRO_DO_LIMITE",
      ritmoAcimaDoLimite: false,
    });
  });

  it("atualiza o percentual quando o total de aulas muda, sem alterar as faltas", () => {
    const antes = calcularFrequencia(registros(32, 7), { cargaHoraria: 72, limiteFaltas: 18 });
    const depois = calcularFrequencia(registros(32, 7), { cargaHoraria: 80, limiteFaltas: 18 });

    expect([antes.faltas, antes.percentualPresenca]).toEqual([7, 90.28]);
    expect([depois.faltas, depois.percentualPresenca]).toEqual([7, 91.25]);
  });

  it("faltas acima do total de aulas: aceita, avisa e não deixa o percentual negativo", () => {
    const comTotal = calcularFrequencia([{ quantidadeAulas: 4, faltas: 12 }], { cargaHoraria: 10, limiteFaltas: null });
    const semTotal = calcularFrequencia([{ quantidadeAulas: 1, faltas: 4 }], { cargaHoraria: null, limiteFaltas: null });

    expect(comTotal).toMatchObject({ faltas: 12, percentualFaltas: 100, percentualPresenca: 0, faltasAcimaDoTotal: true });
    expect(semTotal).toMatchObject({ faltas: 4, percentualFaltas: 100, percentualPresenca: 0, faltasAcimaDoTotal: true });
  });

  it("avisa quando há mais aulas registradas do que a carga horária prevê", () => {
    expect(calcularFrequencia(registros(3, 0), { cargaHoraria: 2, limiteFaltas: 1 }).registrosAcimaDoPrevisto).toBe(true);
  });
});

describe("Dashboard com notas e frequência", () => {
  let id = 1;
  function evento(dados: Partial<EventoParaCalculo>): EventoParaCalculo {
    return {
      id: id++,
      titulo: "Avaliação",
      tipo: "PROVA",
      data: "2026-10-01",
      peso: 1,
      status: "CONCLUIDO",
      nota: null,
      notaMaxima: 10,
      etapa: "M1",
      disciplina: { id: 0, nome: "" },
      ...dados,
    };
  }

  function disciplina(dados: Partial<DisciplinaParaCalculo> & { id: number; nome: string }): DisciplinaParaCalculo {
    return {
      professor: null,
      cargaHoraria: 72,
      horario: null,
      regraMedia: "PONDERADA",
      mediaAprovacao: null,
      pesoM1: 1,
      pesoM2: 1,
      limiteFaltas: 18,
      eventos: [],
      frequencias: [],
      ...dados,
    };
  }

  it("entrega ao Dashboard a M1, a M2 e a média geral de cada disciplina, parcial ou final", () => {
    const pesos = { pesoM1: 1, pesoM2: 2 };
    const soM1 = disciplina({ id: 1, nome: "Só M1", ...pesos, eventos: [evento({ nota: 6 })] });
    const soM2 = disciplina({ id: 2, nome: "Só M2", ...pesos, eventos: [evento({ etapa: "M2", nota: 9 })] });
    const asDuas = disciplina({
      id: 3,
      nome: "M1 e M2",
      ...pesos,
      eventos: [evento({ nota: 6 }), evento({ etapa: "M2", nota: 9 })],
    });

    const painel = montarPainel([soM1, soM2, asDuas], HOJE);
    const recebido = painel.disciplinas.map((d) => [
      d.nome,
      d.desempenho.etapas.map((etapa) => etapa.media),
      d.desempenho.media,
      d.desempenho.final,
    ]);

    expect(recebido).toEqual([
      ["Só M1", [6, null], 6, false],
      ["Só M2", [null, 9], 9, false],
      ["M1 e M2", [6, 9], 8, true],
    ]);
    expect(painel.resumo.mediaGeral).toEqual({ valor: 7.67, disciplinasComNota: 3 });
  });

  it("calcula a média geral como média das médias das disciplinas com nota", () => {
    expect(calcularMediaGeral([7, 8.5, null])).toEqual({ valor: 7.75, disciplinasComNota: 2 });
    expect(calcularMediaGeral([null])).toEqual({ valor: null, disciplinasComNota: 0 });
  });

  it("gera alertas de média, frequência e nota aguardando, e conta disciplinas em atenção", () => {
    const calculo = disciplina({
      id: 1,
      nome: "Cálculo I",
      mediaAprovacao: 6,
      eventos: [evento({ nota: 4 }), evento({ nota: null, status: "PENDENTE", data: "2026-11-10" })],
    });
    const banco = disciplina({
      id: 2,
      nome: "Banco de Dados",
      frequencias: Array.from({ length: 19 }, () => ({ quantidadeAulas: 1, faltas: 1 })),
      eventos: [evento({ nota: 9 }), evento({ nota: null, data: "2026-10-05" })],
    });
    const redes = disciplina({ id: 3, nome: "Redes" });

    const painel = montarPainel([calculo, banco, redes], HOJE);
    const alertas = painel.alertas.map((a) => [a.tipo, a.nivel, a.disciplina.nome]);

    expect(alertas).toEqual([
      ["FREQUENCIA_ACIMA_DO_LIMITE", "alto", "Banco de Dados"],
      ["MEDIA_ABAIXO", "medio", "Cálculo I"],
      ["NOTA_AGUARDANDO", "medio", "Banco de Dados"],
    ]);
    expect(painel.alertas[1].valores).toEqual({ media: 4, mediaAprovacao: 6, notaNecessaria: 6.67 });
    expect(painel.resumo.disciplinasEmAtencao).toBe(2);
    expect(painel.resumo.mediaGeral).toEqual({ valor: 6.5, disciplinasComNota: 2 });
    expect(painel.resumo.avaliacoesAguardandoNota).toBe(1);
    expect(painel.disciplinas[1].frequencia.situacao).toBe("ACIMA_DO_LIMITE");
  });

  it("alerta quando a média de aprovação não pode mais ser alcançada", () => {
    const painel = montarPainel(
      [
        disciplina({
          id: 1,
          nome: "Física",
          mediaAprovacao: 7,
          eventos: [
            evento({ peso: 3, nota: 2 }),
            evento({ peso: 1, nota: null, status: "PENDENTE", data: "2026-12-01" }),
            evento({ etapa: "M2", nota: 2 }),
          ],
        }),
      ],
      HOJE
    );

    expect(painel.alertas.map((a) => [a.tipo, a.nivel])).toEqual([["MEDIA_INALCANCAVEL", "alto"]]);
  });
});
