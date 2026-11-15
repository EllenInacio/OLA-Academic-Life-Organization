export const REGRAS_MEDIA = ["PONDERADA", "ARITMETICA"];
export const TIPOS_PERIODO = ["SEMESTRE", "EXAME"];

export type DadosDisciplina = {
  nome: string;
  professor?: string | null;
  periodoTipo?: "SEMESTRE" | "EXAME" | null;
  periodoNumero?: number | null;
  cargaHoraria?: number | null;
  horario?: string | null;
  inicioAulas?: string | null;
  fimAulas?: string | null; 
  regraMedia?: "PONDERADA" | "ARITMETICA";
  mediaAprovacao?: number | null; 
  pesoM1?: number;
  pesoM2?: number;
  limiteFaltas?: number | null;
};

export const FORMATO_DATA_AULAS = /^\d{4}-\d{2}-\d{2}$/;
export const CARGA_HORARIA_MAXIMA = 1000;
export const LIMITE_FALTAS_MAXIMO = 1000;
export const PESO_ETAPA_MAXIMO = 100;
export const PERIODO_NUMERO_MAXIMO = 12;
