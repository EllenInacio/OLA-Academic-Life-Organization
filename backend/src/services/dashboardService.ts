import * as disciplinaModel from "../models/disciplinaModel";
import {
  DisciplinaParaCalculo,
  calcularIndicadoresDaDisciplina,
  contarEventos,
  montarPainel,
  proximosEventos,
} from "../calculos/painel";
import { Etapa, RegraMedia } from "../calculos/notas";
import { dataDeHoje, paraDataISO } from "../calculos/prazos";
import { StatusEvento, TipoEvento } from "../types/evento";

type Decimal = { toString(): string } | number;

type DisciplinaComEventosDoBanco = {
  id: number;
  nome: string;
  professor: string | null;
  cargaHoraria: number | null;
  horario: string | null;
  inicioAulas?: Date | null;
  fimAulas?: Date | null;
  regraMedia: RegraMedia;
  mediaAprovacao: Decimal | null;
  pesoM1: Decimal;
  pesoM2: Decimal;
  limiteFaltas: number | null;
  eventos: {
    id: number;
    titulo: string;
    tipo: TipoEvento;
    data: Date;
    peso: Decimal;
    status: StatusEvento;
    nota: Decimal | null;
    notaMaxima: Decimal;
    etapa: Etapa;
  }[];
  frequencias: { quantidadeAulas: number; faltas: number }[];
};

export function prepararParaCalculo(disciplina: DisciplinaComEventosDoBanco): DisciplinaParaCalculo {
  return {
    id: disciplina.id,
    nome: disciplina.nome,
    professor: disciplina.professor,
    cargaHoraria: disciplina.cargaHoraria,
    horario: disciplina.horario,
    inicioAulas: disciplina.inicioAulas ? paraDataISO(disciplina.inicioAulas) : null,
    fimAulas: disciplina.fimAulas ? paraDataISO(disciplina.fimAulas) : null,
    regraMedia: disciplina.regraMedia,
    mediaAprovacao: disciplina.mediaAprovacao === null ? null : Number(disciplina.mediaAprovacao),
    pesoM1: Number(disciplina.pesoM1),
    pesoM2: Number(disciplina.pesoM2),
    limiteFaltas: disciplina.limiteFaltas,
    eventos: disciplina.eventos.map((evento) => ({
      id: evento.id,
      titulo: evento.titulo,
      tipo: evento.tipo,
      data: paraDataISO(evento.data),
      peso: Number(evento.peso),
      status: evento.status,
      nota: evento.nota === null ? null : Number(evento.nota),
      notaMaxima: Number(evento.notaMaxima),
      etapa: evento.etapa,
      disciplina: { id: disciplina.id, nome: disciplina.nome },
    })),
    frequencias: disciplina.frequencias.map((registro) => ({
      quantidadeAulas: registro.quantidadeAulas,
      faltas: registro.faltas,
    })),
  };
}

export function resumirDisciplina(disciplina: DisciplinaComEventosDoBanco, hoje = dataDeHoje()) {
  const preparada = prepararParaCalculo(disciplina);

  return {
    eventos: contarEventos(preparada.eventos, hoje),
    proximoEvento: proximosEventos(preparada.eventos, hoje, 1)[0] ?? null,
    ...calcularIndicadoresDaDisciplina(preparada, hoje),
  };
}

export async function obterPainel(usuarioId: number, hoje = dataDeHoje()) {
  const disciplinas = await disciplinaModel.listarComEventos(usuarioId);
  return montarPainel(disciplinas.map(prepararParaCalculo), hoje);
}
