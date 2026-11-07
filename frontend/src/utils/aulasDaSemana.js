import { DIAS_SEMANA, lerHorario } from "./horario";

export function aulasPorDiaDaSemana(disciplinas) {
  const aulas = {};

  for (const disciplina of disciplinas) {
    const selecao = lerHorario(disciplina.horario);
    if (!selecao) continue;

    DIAS_SEMANA.forEach(({ sigla }, posicao) => {
      const horario = selecao[sigla];
      if (!horario) return;

      // DIAS_SEMANA começa na segunda; Date.getDay() começa no domingo.
      const diaDaSemana = (posicao + 1) % 7;
      if (!aulas[diaDaSemana]) aulas[diaDaSemana] = [];
      aulas[diaDaSemana].push({
        id: disciplina.id,
        nome: disciplina.nome,
        inicio: horario.inicio,
        fim: horario.fim,
      });
    });
  }

  for (const lista of Object.values(aulas)) {
    lista.sort((a, b) => a.inicio.localeCompare(b.inicio));
  }

  return aulas;
}
