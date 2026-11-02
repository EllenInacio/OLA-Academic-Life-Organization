export type DadosDisciplina = {
  nome: string;
  professor?: string | null;
  semestre?: string | null;
  cargaHoraria?: number | null;
  horario?: string | null;
};

// Semestre no formato AAAA.N (ex.: 2026.2).
export const FORMATO_SEMESTRE = /^\d{4}\.[1-4]$/;

export const CARGA_HORARIA_MAXIMA = 1000;
