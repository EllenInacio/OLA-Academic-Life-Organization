export const TIPOS_EVENTO = ["PROVA", "TRABALHO", "ENTREGA"];
export const STATUS_EVENTO = ["PENDENTE", "EM_ANDAMENTO", "CONCLUIDO"];

export type TipoEvento = "PROVA" | "TRABALHO" | "ENTREGA";
export type StatusEvento = "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDO";

export type DadosEvento = {
  titulo: string;
  tipo: TipoEvento;
  data: string;
  peso: number;
  status?: StatusEvento;
  disciplinaId: number;
};
