import { DIAS_SEMANA, lerHorario } from "./horario";
import { formatarData } from "./formatacao";

function dataDoPeriodo(valor) {
  return valor ? String(valor).slice(0, 10) : null;
}

export function aulasPorDiaDaSemana(disciplinas) {
  const aulas = {};

  for (const disciplina of disciplinas) {
    const selecao = lerHorario(disciplina.horario);
    if (!selecao) continue;

    DIAS_SEMANA.forEach(({ sigla }, posicao) => {
      const horario = selecao[sigla];
      if (!horario) return;

      const diaDaSemana = (posicao + 1) % 7;
      if (!aulas[diaDaSemana]) aulas[diaDaSemana] = [];
      aulas[diaDaSemana].push({
        id: disciplina.id,
        nome: disciplina.nome,
        inicio: horario.inicio,
        fim: horario.fim,
        inicioAulas: dataDoPeriodo(disciplina.inicioAulas),
        fimAulas: dataDoPeriodo(disciplina.fimAulas),
      });
    });
  }

  for (const lista of Object.values(aulas)) {
    lista.sort((a, b) => a.inicio.localeCompare(b.inicio));
  }

  return aulas;
}

export function aulaValeNaData(aula, dataISO) {
  return (!aula.inicioAulas || dataISO >= aula.inicioAulas) && (!aula.fimAulas || dataISO <= aula.fimAulas);
}

export function textoPeriodo({ inicioAulas, fimAulas }) {
  if (inicioAulas && fimAulas) return `Aulas de ${formatarData(inicioAulas)} a ${formatarData(fimAulas)}`;
  if (inicioAulas) return `Aulas a partir de ${formatarData(inicioAulas)}`;
  if (fimAulas) return `Aulas até ${formatarData(fimAulas)}`;
  return "";
}
