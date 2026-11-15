const FORMATO_ENCONTRO = /^(Seg|Ter|Qua|Qui|Sex|Sáb|Dom) ([01]\d|2[0-3]):([0-5]\d)–([01]\d|2[0-3]):([0-5]\d)$/;
const FORMATO_DATA = /^(\d{4})-(\d{2})-(\d{2})$/;
const DIA_DA_SEMANA: Record<string, number> = { Dom: 0, Seg: 1, Ter: 2, Qua: 3, Qui: 4, Sex: 5, Sáb: 6 };
const MINUTOS_POR_HORA = 60;
const UM_DIA_EM_MS = 24 * 60 * 60 * 1000;

export type AulasDaDisciplina = {
  horario?: string | null;
  inicioAulas?: string | null;
  fimAulas?: string | null;
};

type Encontro = { diaDaSemana: number; minutos: number };

function emMilissegundosUTC(dataISO: string) {
  const partes = FORMATO_DATA.exec(dataISO);
  return partes ? Date.UTC(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3])) : null;
}

export function contarDiaDaSemana(inicioISO: string, fimISO: string, diaDaSemana: number) {
  const inicio = emMilissegundosUTC(inicioISO);
  const fim = emMilissegundosUTC(fimISO);
  if (inicio === null || fim === null) return 0;

  const totalDeDias = Math.round((fim - inicio) / UM_DIA_EM_MS) + 1;
  if (totalDeDias <= 0) return 0;

  const ateAPrimeiraVez = (diaDaSemana - new Date(inicio).getUTCDay() + 7) % 7;
  if (ateAPrimeiraVez >= totalDeDias) return 0;

  return Math.floor((totalDeDias - 1 - ateAPrimeiraVez) / 7) + 1;
}

export function lerEncontros(horario?: string | null): Encontro[] | null {
  if (!horario || !horario.trim()) return null;

  const encontros: Encontro[] = [];

  for (const parte of horario.trim().split(", ")) {
    const encontrado = FORMATO_ENCONTRO.exec(parte);
    if (!encontrado) return null;

    const inicio = Number(encontrado[2]) * MINUTOS_POR_HORA + Number(encontrado[3]);
    const fim = Number(encontrado[4]) * MINUTOS_POR_HORA + Number(encontrado[5]);
    if (fim <= inicio) return null;

    encontros.push({ diaDaSemana: DIA_DA_SEMANA[encontrado[1]], minutos: fim - inicio });
  }

  return encontros;
}

export function calcularCargaHoraria({ horario, inicioAulas, fimAulas }: AulasDaDisciplina) {
  if (!inicioAulas || !fimAulas || fimAulas < inicioAulas) return null;

  const encontros = lerEncontros(horario);
  if (!encontros) return null;

  let diasDeAula = 0;
  let minutos = 0;

  for (const encontro of encontros) {
    const vezes = contarDiaDaSemana(inicioAulas, fimAulas, encontro.diaDaSemana);
    diasDeAula += vezes;
    minutos += vezes * encontro.minutos;
  }

  const horas = Math.round(minutos / MINUTOS_POR_HORA);
  if (horas < 1) return null;

  return { horas, diasDeAula, minutos };
}
