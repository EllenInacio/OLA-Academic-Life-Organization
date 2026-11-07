export const DIAS_SEMANA = [
  { sigla: "Seg", nome: "Segunda-feira" },
  { sigla: "Ter", nome: "Terça-feira" },
  { sigla: "Qua", nome: "Quarta-feira" },
  { sigla: "Qui", nome: "Quinta-feira" },
  { sigla: "Sex", nome: "Sexta-feira" },
  { sigla: "Sáb", nome: "Sábado" },
  { sigla: "Dom", nome: "Domingo" },
];

export const HORARIO_PADRAO = { inicio: "19:00", fim: "22:00" };

const FORMATO_DIA = /^(Seg|Ter|Qua|Qui|Sex|Sáb|Dom) (\d{2}:\d{2})–(\d{2}:\d{2})$/;

/** { Seg: { inicio: "19:00", fim: "22:00" } } -> "Seg 19:00–22:00" */
export function montarHorario(selecao) {
  return DIAS_SEMANA.filter((dia) => selecao[dia.sigla])
    .map((dia) => `${dia.sigla} ${selecao[dia.sigla].inicio}–${selecao[dia.sigla].fim}`)
    .join(", ");
}
export function lerHorario(texto) {
  if (!texto || !texto.trim()) return {};

  const selecao = {};
  for (const parte of texto.split(", ")) {
    const encontrado = FORMATO_DIA.exec(parte);
    if (!encontrado) return null;
    selecao[encontrado[1]] = { inicio: encontrado[2], fim: encontrado[3] };
  }
  return selecao;
}

export function validarHorario(texto) {
  const selecao = lerHorario(texto);
  if (!selecao) return "";

  for (const dia of DIAS_SEMANA) {
    const horario = selecao[dia.sigla];
    if (horario && horario.fim <= horario.inicio) {
      return `${dia.nome}: o horário de término deve ser depois do início.`;
    }
  }
  return "";
}
