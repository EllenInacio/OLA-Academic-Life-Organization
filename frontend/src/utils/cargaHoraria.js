import { DIAS_SEMANA, lerHorario } from "./horario";

const MINUTOS_POR_HORA = 60;
const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;
const UM_DIA = 24 * 60 * 60 * 1000;

function emMinutos(hora) {
  const [horas, minutos] = hora.split(":").map(Number);
  return horas * MINUTOS_POR_HORA + minutos;
}

function emUTC(dataISO) {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  return Date.UTC(ano, mes - 1, dia);
}

export function contarDiaDaSemana(inicioISO, fimISO, diaDaSemana) {
  const inicio = emUTC(inicioISO);
  const totalDeDias = Math.round((emUTC(fimISO) - inicio) / UM_DIA) + 1;
  if (totalDeDias <= 0) return 0;

  const ateAPrimeiraVez = (diaDaSemana - new Date(inicio).getUTCDay() + 7) % 7;
  if (ateAPrimeiraVez >= totalDeDias) return 0;

  return Math.floor((totalDeDias - 1 - ateAPrimeiraVez) / 7) + 1;
}

export function calcularCargaHoraria({ horario, inicioAulas, fimAulas }) {
  if (!FORMATO_DATA.test(inicioAulas ?? "") || !FORMATO_DATA.test(fimAulas ?? "")) return null;
  if (fimAulas < inicioAulas) return null;

  const selecao = lerHorario(horario);
  if (!selecao || Object.keys(selecao).length === 0) return null;

  let diasDeAula = 0;
  let minutos = 0;

  for (const [posicao, dia] of DIAS_SEMANA.entries()) {
    const aula = selecao[dia.sigla];
    if (!aula) continue;

    const duracao = emMinutos(aula.fim) - emMinutos(aula.inicio);
    if (duracao <= 0) return null;

    const vezes = contarDiaDaSemana(inicioAulas, fimAulas, (posicao + 1) % 7);
    diasDeAula += vezes;
    minutos += vezes * duracao;
  }

  const horas = Math.round(minutos / MINUTOS_POR_HORA);
  if (horas < 1) return null;

  return { horas, diasDeAula, minutos };
}
