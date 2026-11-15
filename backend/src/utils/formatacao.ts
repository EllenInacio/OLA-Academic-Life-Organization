export function formatarNumero(valor: number, casas = 2) {
  return valor.toLocaleString("pt-BR", { maximumFractionDigits: casas });
}

export function formatarData(dataISO: string) {
  const [ano, mes, dia] = dataISO.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

export function plural(quantidade: number, singular: string, pluralTexto: string) {
  return `${quantidade} ${quantidade === 1 ? singular : pluralTexto}`;
}
