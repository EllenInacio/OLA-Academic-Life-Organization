export const TIPOS_EVENTO = [
  { valor: "PROVA", rotulo: "Prova" },
  { valor: "TRABALHO", rotulo: "Trabalho" },
  { valor: "ENTREGA", rotulo: "Entrega" },
];

export const STATUS_EVENTO = [
  { valor: "PENDENTE", rotulo: "Pendente" },
  { valor: "EM_ANDAMENTO", rotulo: "Em andamento" },
  { valor: "CONCLUIDO", rotulo: "Concluído" },
];

export const ETAPAS = [
  { valor: "M1", rotulo: "M1" },
  { valor: "M2", rotulo: "M2" },
];

export const ETAPA_PADRAO = "M1";

export function rotuloDe(lista, valor) {
  return lista.find((item) => item.valor === valor)?.rotulo || valor;
}
