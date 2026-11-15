import { arredondar } from "./numeros";

export const AULAS_POR_HORA = 1;
export const LIMIAR_ATENCAO = 0.75;

export type RegistroParaCalculo = {
  quantidadeAulas: number;
  faltas: number;
};

export type CriteriosDeFrequencia = {
  cargaHoraria: number | null;
  limiteFaltas: number | null;
};

export type SituacaoFrequencia =
  | "SEM_REGISTROS"
  | "SEM_LIMITE"
  | "DENTRO_DO_LIMITE"
  | "PERTO_DO_LIMITE"
  | "ACIMA_DO_LIMITE";

  export type BaseDaFrequencia = "TOTAL_DA_DISCIPLINA" | "AULAS_REGISTRADAS";

function situacaoPelaQuantidade(faltas: number, permitidas: number): SituacaoFrequencia {
  if (faltas > permitidas) return "ACIMA_DO_LIMITE";
  if (faltas > 0 && faltas >= LIMIAR_ATENCAO * permitidas) return "PERTO_DO_LIMITE";
  return "DENTRO_DO_LIMITE";
}

export function calcularFrequencia(registros: RegistroParaCalculo[], criterios: CriteriosDeFrequencia) {
  const aulasRegistradas = registros.reduce((soma, r) => soma + r.quantidadeAulas, 0);
  const faltas = registros.reduce((soma, r) => soma + r.faltas, 0);
  const temRegistros = registros.length > 0;

  const aulasPrevistas = criterios.cargaHoraria ? criterios.cargaHoraria * AULAS_POR_HORA : null;
  const base: BaseDaFrequencia = aulasPrevistas !== null ? "TOTAL_DA_DISCIPLINA" : "AULAS_REGISTRADAS";
  const totalAulas = aulasPrevistas ?? aulasRegistradas;

  const faltasAcimaDoTotal = temRegistros && faltas > totalAulas;
  const percentualFaltas =
    temRegistros && totalAulas > 0 ? arredondar(Math.min(100, (faltas / totalAulas) * 100)) : null;

  const faltasPermitidas = criterios.limiteFaltas;

  let situacao: SituacaoFrequencia = "SEM_REGISTROS";
  if (temRegistros) {
    situacao = faltasPermitidas === null ? "SEM_LIMITE" : situacaoPelaQuantidade(faltas, faltasPermitidas);
  }

  const ritmoAcimaDoLimite =
    aulasRegistradas > 0 &&
    faltas <= aulasRegistradas &&
    aulasPrevistas !== null &&
    faltasPermitidas !== null &&
    (faltas / aulasRegistradas) * aulasPrevistas > faltasPermitidas;

  return {
    limiteFaltas: criterios.limiteFaltas,
    base,
    totalAulas: temRegistros || aulasPrevistas !== null ? totalAulas : null,
    aulasRegistradas,
    faltas,
    presencas: Math.max(0, aulasRegistradas - faltas),
    percentualFaltas,
    percentualPresenca: percentualFaltas === null ? null : arredondar(100 - percentualFaltas),
    faltasAcimaDoTotal,
    aulasPrevistas,
    faltasPermitidas,
    faltasRestantes: faltasPermitidas === null ? null : faltasPermitidas - faltas,
    situacao,
    ritmoAcimaDoLimite,
    registrosAcimaDoPrevisto: aulasPrevistas !== null && aulasRegistradas > aulasPrevistas,
  };
}

export type Frequencia = ReturnType<typeof calcularFrequencia>;
