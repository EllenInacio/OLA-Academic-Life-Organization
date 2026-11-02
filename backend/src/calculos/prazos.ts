export const FUSO_PADRAO = "America/Sao_Paulo";
export const DIAS_PARA_ALERTA = 7;
export const DIAS_URGENTE = 2;

const UM_DIA_EM_MS = 24 * 60 * 60 * 1000;
const FORMATO_DATA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

export function dataDeHoje(agora = new Date(), fuso = process.env.APP_TIMEZONE || FUSO_PADRAO) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: fuso,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora);
}
export function paraDataISO(data: Date | string) {
  return typeof data === "string" ? data.slice(0, 10) : data.toISOString().slice(0, 10);
}

function paraMilissegundosUTC(dataISO: string) {
  const partes = FORMATO_DATA_ISO.exec(dataISO);

  if (!partes) {
    throw new Error(`Data inválida: ${dataISO}`);
  }

  return Date.UTC(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]));
}

export function diasEntre(inicioISO: string, fimISO: string) {
  return Math.round((paraMilissegundosUTC(fimISO) - paraMilissegundosUTC(inicioISO)) / UM_DIA_EM_MS);
}
