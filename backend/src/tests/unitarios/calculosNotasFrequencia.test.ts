import { calcularDesempenho, calcularNotaNecessaria, notaNaEscala, AvaliacaoParaCalculo } from "../../calculos/notas";
import { calcularFrequencia } from "../../calculos/frequencia";
import { DisciplinaParaCalculo, EventoParaCalculo, calcularMediaGeral, montarPainel } from "../../calculos/painel";

const HOJE = "2026-10-16";

function avaliacao(peso: number, nota: number | null, dados: Partial<AvaliacaoParaCalculo> = {}): AvaliacaoParaCalculo {
  return { data: "2026-10-01", peso, nota, notaMaxima: 10, ...dados };
}

const PONDERADA_SEM_CRITERIO = { regraMedia: "PONDERADA" as const, mediaAprovacao: null };
const PONDERADA_MEDIA_6 = { regraMedia: "PONDERADA" as const, mediaAprovacao: 6 };
const ARITMETICA_MEDIA_6 = { regraMedia: "ARITMETICA" as const, mediaAprovacao: 6 };

describe("Média da disciplina", () => {
  // Exemplo do protótipo: Prova 1 (peso 3) = 6,5; Lista (peso 1) = 8,0; Prova 2 (peso 3) sem nota.
  const exemplo = [avaliacao(3, 6.5), avaliacao(1, 8), avaliacao(3, null, { data: "2026-10-20" })];

  it("calcula a média ponderada parcial só com as notas lançadas", () => {
    const desempenho = calcularDesempenho(exemplo, PONDERADA_SEM_CRITERIO, HOJE);

    // (6,5 × 3 + 8 × 1) ÷ (3 + 1) = 27,5 ÷ 4 = 6,875
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

  it("informa a situação parcial e a nota necessária nas avaliações restantes", () => {
    const desempenho = calcularDesempenho(exemplo, PONDERADA_MEDIA_6, HOJE);

    expect(desempenho.situacao).toBe("PARCIAL_ACIMA");
    // (6 × 7 − 27,5) ÷ 3 = 4,833...
    expect(desempenho.notaNecessaria).toEqual({ valor: 4.83, alcancavel: true });
  });

  it("calcula a média aritmética quando essa é a regra da disciplina", () => {
    const desempenho = calcularDesempenho(exemplo, ARITMETICA_MEDIA_6, HOJE);

    // (6,5 + 8) ÷ 2 = 7,25; para fechar 6 em 3 avaliações: 6 × 3 − 14,5 = 3,5
    expect(desempenho.media).toBe(7.25);
    expect(desempenho.notaNecessaria).toEqual({ valor: 3.5, alcancavel: true });
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
      [avaliacao(2, 7), avaliacao(0, null)],
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

  it("indica a situação final quando todas as notas foram lançadas", () => {
    const aprovada = calcularDesempenho([avaliacao(1, 6), avaliacao(1, 7)], PONDERADA_MEDIA_6, HOJE);
    const abaixo = calcularDesempenho([avaliacao(1, 5), avaliacao(1, 6)], PONDERADA_MEDIA_6, HOJE);

    expect([aprovada.situacao, aprovada.notaNecessaria]).toEqual(["ATINGIU_MEDIA", null]);
    expect(abaixo.situacao).toBe("ABAIXO_DA_MEDIA");
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
    // 10 no peso 3; falta peso 1 para média 6: (6 × 4 − 30) ÷ 1 < 0
    expect(calcularNotaNecessaria(30, 3, 1, 6)).toEqual({ valor: 0, alcancavel: true });
    // 2 no peso 3; falta peso 1 para média 7: (7 × 4 − 6) ÷ 1 = 22
    expect(calcularNotaNecessaria(6, 3, 1, 7)).toEqual({ valor: 22, alcancavel: false });
    expect(calcularNotaNecessaria(30, 3, 0, 6)).toBeNull();
  });
});

describe("Frequência da disciplina", () => {
  const LIMITE_25 = { cargaHoraria: 72, limiteFaltas: 25 };

  function registros(aulas: number, faltas: number) {
    // Um registro por aula: as primeiras `faltas` são faltas.
    return Array.from({ length: aulas }, (_, i) => ({ quantidadeAulas: 1, faltas: i < faltas ? 1 : 0 }));
  }

  it("não apresenta percentual sem registros", () => {
    const frequencia = calcularFrequencia([], LIMITE_25);

    expect(frequencia.situacao).toBe("SEM_REGISTROS");
    expect(frequencia.percentualFaltas).toBeNull();
    expect(frequencia.faltasPermitidas).toBe(18);
    expect(frequencia.faltasRestantes).toBe(18);
  });

  it("calcula percentual parcial e faltas restantes pela carga horária", () => {
    // Exemplo do protótipo: 7 faltas em 32 aulas registradas, 72h, limite 25%.
    const frequencia = calcularFrequencia(registros(32, 7), LIMITE_25);

    expect(frequencia).toMatchObject({
      aulasRegistradas: 32,
      faltas: 7,
      presencas: 25,
      percentualFaltas: 21.88,
      percentualPresenca: 78.12,
      aulasPrevistas: 72,
      faltasPermitidas: 18, // 72 × 25% = 18
      faltasRestantes: 11,
      situacao: "DENTRO_DO_LIMITE",
      base: "CARGA_HORARIA",
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
      LIMITE_25
    );

    expect([frequencia.aulasRegistradas, frequencia.faltas, frequencia.percentualFaltas]).toEqual([6, 3, 50]);
    expect(frequencia.ritmoAcimaDoLimite).toBe(true); // 50% no ritmo atual, mas só 3 de 18 faltas
    expect(frequencia.situacao).toBe("DENTRO_DO_LIMITE");
  });

  it("indica atenção a partir de 75% das faltas permitidas e limite ultrapassado", () => {
    expect(calcularFrequencia(registros(40, 13), LIMITE_25).situacao).toBe("DENTRO_DO_LIMITE");
    expect(calcularFrequencia(registros(40, 14), LIMITE_25).situacao).toBe("PERTO_DO_LIMITE"); // 14 ≥ 13,5
    expect(calcularFrequencia(registros(40, 18), LIMITE_25).situacao).toBe("PERTO_DO_LIMITE");

    const acima = calcularFrequencia(registros(40, 19), LIMITE_25);
    expect([acima.situacao, acima.faltasRestantes]).toEqual(["ACIMA_DO_LIMITE", -1]);
  });

  it("arredonda as faltas permitidas para baixo", () => {
    expect(calcularFrequencia([], { cargaHoraria: 30, limiteFaltas: 25 }).faltasPermitidas).toBe(7);
  });

  it("sem carga horária, usa só o percentual parcial", () => {
    const semCarga = { cargaHoraria: null, limiteFaltas: 25 };

    expect(calcularFrequencia(registros(10, 1), semCarga).situacao).toBe("DENTRO_DO_LIMITE");
    expect(calcularFrequencia(registros(10, 2), semCarga).situacao).toBe("PERTO_DO_LIMITE"); // 20% ≥ 18,75%
    const acima = calcularFrequencia(registros(10, 3), semCarga);
    expect([acima.situacao, acima.base, acima.faltasPermitidas]).toEqual(["ACIMA_DO_LIMITE", "AULAS_REGISTRADAS", null]);
  });

  it("avisa quando há mais aulas registradas do que a carga horária prevê", () => {
    expect(calcularFrequencia(registros(3, 0), { cargaHoraria: 2, limiteFaltas: 25 }).registrosAcimaDoPrevisto).toBe(true);
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
      disciplina: { id: 0, nome: "" },
      ...dados,
    };
  }

  function disciplina(dados: Partial<DisciplinaParaCalculo> & { id: number; nome: string }): DisciplinaParaCalculo {
    return {
      professor: null,
      semestre: null,
      cargaHoraria: 72,
      horario: null,
      regraMedia: "PONDERADA",
      mediaAprovacao: null,
      limiteFaltas: 25,
      eventos: [],
      frequencias: [],
      ...dados,
    };
  }

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
      eventos: [evento({ nota: 9 }), evento({ nota: null, data: "2026-10-05" })], // concluída sem nota
    });
    const redes = disciplina({ id: 3, nome: "Redes" });

    const painel = montarPainel([calculo, banco, redes], HOJE);
    const alertas = painel.alertas.map((a) => [a.tipo, a.nivel, a.disciplina.nome]);

    expect(alertas).toEqual([
      ["FREQUENCIA_ACIMA_DO_LIMITE", "alto", "Banco de Dados"],
      ["MEDIA_ABAIXO", "medio", "Cálculo I"],
      ["NOTA_AGUARDANDO", "medio", "Banco de Dados"],
    ]);
    expect(painel.alertas[1].valores).toEqual({ media: 4, mediaAprovacao: 6, notaNecessaria: 8 });
    expect(painel.resumo.disciplinasEmAtencao).toBe(2);
    expect(painel.resumo.mediaGeral).toEqual({ valor: 6.5, disciplinasComNota: 2 });
    expect(painel.resumo.avaliacoesAguardandoNota).toBe(1);
    expect(painel.disciplinas[1].frequencia.situacao).toBe("ACIMA_DO_LIMITE"); // Banco de Dados
  });

  it("alerta quando a média de aprovação não pode mais ser alcançada", () => {
    const painel = montarPainel(
      [
        disciplina({
          id: 1,
          nome: "Física",
          mediaAprovacao: 7,
          eventos: [evento({ peso: 3, nota: 2 }), evento({ peso: 1, nota: null, status: "PENDENTE", data: "2026-12-01" })],
        }),
      ],
      HOJE
    );

    expect(painel.alertas.map((a) => [a.tipo, a.nivel])).toEqual([["MEDIA_INALCANCAVEL", "alto"]]);
  });
});
