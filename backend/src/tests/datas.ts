import { dataDeHoje } from "../calculos/prazos";

export function dataRelativa(dias: number) {
  const [ano, mes, dia] = dataDeHoje().split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia + dias)).toISOString().slice(0, 10);
}
