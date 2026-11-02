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

export function rotuloDe(lista, valor) {
  return lista.find((item) => item.valor === valor)?.rotulo || valor;
}
