export const TIPOS_EVENTO = ["PROVA", "TRABALHO", "ENTREGA"];
export const STATUS_EVENTO = ["PENDENTE", "EM_ANDAMENTO", "CONCLUIDO"];

export const ETAPAS_AVALIACAO = ["M1", "M2"];

export type TipoEvento = "PROVA" | "TRABALHO" | "ENTREGA";
export type EtapaAvaliacao = "M1" | "M2";
export type StatusEvento = "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDO";

export type DadosEvento = {
  titulo: string;
  tipo: TipoEvento;
  etapa?: EtapaAvaliacao;
  data: string;
  peso: number;
  status?: StatusEvento;
  disciplinaId: number;
  nota?: number | null;
  notaMaxima?: number;
};

export const NOTA_MAXIMA_PADRAO = 10;
export const LIMITE_NOTA = 100;

export type DadosNota = {
  nota: number;
  notaMaxima?: number;
};
