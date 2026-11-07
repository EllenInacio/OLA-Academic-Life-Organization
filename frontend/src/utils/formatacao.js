function dataUTC(isoData) {
  const [ano, mes, dia] = String(isoData).slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia));
}

export function formatarData(isoData) {
  const [ano, mes, dia] = String(isoData).slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

export function formatarDataExtensa(isoData) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(dataUTC(isoData));
}

export function textoPrazo(dias) {
  if (dias === 0) return "hoje";
  if (dias === 1) return "amanhã";
  if (dias === -1) return "ontem";
  return dias > 0 ? `em ${dias} dias` : `há ${Math.abs(dias)} dias`;
}

export function formatarNumero(valor, casas = 2) {
  return Number(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: casas,
  });
}

export function plural(quantidade, singular, pluralTexto) {
  return `${quantidade} ${quantidade === 1 ? singular : pluralTexto}`;
}

export function formatarPercentual(valor) {
  return `${formatarNumero(valor, 1)}%`;
}

export function lerNumero(texto) {
  const limpo = String(texto ?? "").trim().replace(",", ".");
  return limpo === "" ? NaN : Number(limpo);
}

export function hojeISO() {
  const agora = new Date();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${agora.getFullYear()}-${mes}-${dia}`;
}
