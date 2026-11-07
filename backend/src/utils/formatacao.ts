export function formatarNumero(valor: number, casas = 2) {
  return valor.toLocaleString("pt-BR", { maximumFractionDigits: casas });
}

/** "2026-10-14" -> "14/10/2026" */
export function formatarData(dataISO: string) {
  const [ano, mes, dia] = dataISO.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

/** plural(2, "evento", "eventos") -> "2 eventos" */
export function plural(quantidade: number, singular: string, pluralTexto: string) {
  return `${quantidade} ${quantidade === 1 ? singular : pluralTexto}`;
}
