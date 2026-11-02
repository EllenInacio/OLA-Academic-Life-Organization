// Formatação de datas e números no padrão pt-BR.

function dataUTC(isoData) {
  const [ano, mes, dia] = String(isoData).slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia));
}

/** "2026-10-15" -> "15/10/2026" */
export function formatarData(isoData) {
  const [ano, mes, dia] = String(isoData).slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

/** "2026-10-13" -> "terça-feira, 13 de outubro de 2026" */
export function formatarDataExtensa(isoData) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(dataUTC(isoData));
}

/** Dias restantes até o evento em texto: hoje, amanhã, em 3 dias, ontem, há 2 dias. */
export function textoPrazo(dias) {
  if (dias === 0) return "hoje";
  if (dias === 1) return "amanhã";
  if (dias === -1) return "ontem";
  return dias > 0 ? `em ${dias} dias` : `há ${Math.abs(dias)} dias`;
}

export function formatarNumero(valor, casas = 1) {
  return Number(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: casas,
  });
}

/** Plural simples: plural(2, "evento", "eventos") -> "2 eventos" */
export function plural(quantidade, singular, pluralTexto) {
  return `${quantidade} ${quantidade === 1 ? singular : pluralTexto}`;
}
