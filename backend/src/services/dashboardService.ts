import * as disciplinaModel from "../models/disciplinaModel";
import {
  DisciplinaParaCalculo,
  contarEventos,
  montarPainel,
  proximosEventos,
} from "../calculos/painel";
import { dataDeHoje, paraDataISO } from "../calculos/prazos";
import { StatusEvento, TipoEvento } from "../types/evento";

type DisciplinaComEventosDoBanco = {
  id: number;
  nome: string;
  professor: string | null;
  semestre: string | null;
  cargaHoraria: number | null;
  horario: string | null;
  eventos: {
    id: number;
    titulo: string;
    tipo: TipoEvento;
    data: Date;
    peso: { toString(): string } | number;
    status: StatusEvento;
  }[];
};

/** Converte o registro do Prisma (DATE e DECIMAL) para os tipos usados nos cálculos. */
export function prepararParaCalculo(disciplina: DisciplinaComEventosDoBanco): DisciplinaParaCalculo {
  return {
    id: disciplina.id,
    nome: disciplina.nome,
    professor: disciplina.professor,
    semestre: disciplina.semestre,
    cargaHoraria: disciplina.cargaHoraria,
    horario: disciplina.horario,
    eventos: disciplina.eventos.map((evento) => ({
      id: evento.id,
      titulo: evento.titulo,
      tipo: evento.tipo,
      data: paraDataISO(evento.data),
      peso: Number(evento.peso),
      status: evento.status,
      disciplina: { id: disciplina.id, nome: disciplina.nome },
    })),
  };
}

export function resumirDisciplina(disciplina: DisciplinaComEventosDoBanco, hoje = dataDeHoje()) {
  const { eventos } = prepararParaCalculo(disciplina);

  return {
    eventos: contarEventos(eventos, hoje),
    proximoEvento: proximosEventos(eventos, hoje, 1)[0] ?? null,
  };
}

export async function obterPainel(usuarioId: number, hoje = dataDeHoje()) {
  const disciplinas = await disciplinaModel.listarComEventos(usuarioId);
  return montarPainel(disciplinas.map(prepararParaCalculo), hoje);
}
