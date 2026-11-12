import { arredondar } from "./numeros";

export const AULAS_POR_HORA = 1;
export const LIMIAR_ATENCAO = 0.75;

export type RegistroParaCalculo = {
  quantidadeAulas: number;
  faltas: number;
};

export type CriteriosDeFrequencia = {
  cargaHoraria: number | null;
  limiteFaltas: number;
};

export type SituacaoFrequencia =
  | "SEM_REGISTROS"
  | "DENTRO_DO_LIMITE"
  | "PERTO_DO_LIMITE"
  | "ACIMA_DO_LIMITE";

function situacaoPelaQuantidade(faltas: number, permitidas: number): SituacaoFrequencia {
  if (faltas > permitidas) {return "ACIMA_DO_LIMITE";}
  if (faltas > 0 && faltas >= LIMIAR_ATENCAO * permitidas) {return "PERTO_DO_LIMITE";}
  return "DENTRO_DO_LIMITE";
}

function situacaoPeloPercentual(percentual: number, limite: number): SituacaoFrequencia {
  if (percentual > limite) {return "ACIMA_DO_LIMITE";}
  if (percentual > 0 && percentual >= LIMIAR_ATENCAO * limite) {return "PERTO_DO_LIMITE";}
  return "DENTRO_DO_LIMITE";
}

export function calcularFrequencia(registros: RegistroParaCalculo[], criterios: CriteriosDeFrequencia) {
  const aulasRegistradas = registros.reduce((soma, r) => soma + r.quantidadeAulas, 0);
  const faltas = registros.reduce((soma, r) => soma + r.faltas, 0);

  const percentualFaltas =
    aulasRegistradas > 0 ? arredondar((faltas / aulasRegistradas) * 100) : null;

  const aulasPrevistas = criterios.cargaHoraria ? criterios.cargaHoraria * AULAS_POR_HORA : null;
  const faltasPermitidas =
    aulasPrevistas !== null ? Math.floor((aulasPrevistas * criterios.limiteFaltas) / 100) : null;

  let situacao: SituacaoFrequencia = "SEM_REGISTROS";
  if (aulasRegistradas > 0) {
    situacao =
      faltasPermitidas !== null
        ? situacaoPelaQuantidade(faltas, faltasPermitidas)
        : situacaoPeloPercentual(percentualFaltas!, criterios.limiteFaltas);
  }

  return {
    limiteFaltas: criterios.limiteFaltas,
    aulasRegistradas,
    faltas,
    presencas: aulasRegistradas - faltas,
    percentualFaltas,
    percentualPresenca: percentualFaltas === null ? null
      : arredondar(100 - percentualFaltas),
    aulasPrevistas,
    faltasPermitidas,
    faltasRestantes: faltasPermitidas === null ? null : faltasPermitidas - faltas,
    situacao,
    base: faltasPermitidas === null ? "AULAS_REGISTRADAS" : "CARGA_HORARIA",
    ritmoAcimaDoLimite: percentualFaltas !== null && percentualFaltas > criterios.limiteFaltas,
    registrosAcimaDoPrevisto: aulasPrevistas !== null && aulasRegistradas > aulasPrevistas,
  };
}

export type Frequencia = ReturnType<typeof calcularFrequencia>;
