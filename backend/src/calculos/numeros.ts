export function arredondar(valor: number, casas = 2) {
  const fator = 10 ** casas;
  return Math.round((valor + Number.EPSILON) * fator) / fator;
}
