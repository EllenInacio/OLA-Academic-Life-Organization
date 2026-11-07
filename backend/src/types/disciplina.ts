export const REGRAS_MEDIA = ["PONDERADA", "ARITMETICA"];

export type DadosDisciplina = {
  nome: string;
  professor?: string | null;
  semestre?: string | null;
  cargaHoraria?: number | null;
  horario?: string | null;
  inicioAulas?: string | null;
  fimAulas?: string | null; 
  regraMedia?: "PONDERADA" | "ARITMETICA";
  mediaAprovacao?: number | null; 
  limiteFaltas?: number; 
};

export const FORMATO_SEMESTRE = /^\d{4}\.[1-4]$/;
export const FORMATO_DATA_AULAS = /^\d{4}-\d{2}-\d{2}$/;
export const CARGA_HORARIA_MAXIMA = 1000;
