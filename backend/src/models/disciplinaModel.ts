import { prisma } from "../config/prisma";
import { DadosDisciplina } from "../types/disciplina";

const COM_TOTAL_EVENTOS = {
  _count: { select: { eventos: true } },
};

function camposDisciplina(dados: DadosDisciplina) {
  return {
    nome: dados.nome,
    professor: dados.professor || null,
    semestre: dados.semestre || null,
    cargaHoraria: dados.cargaHoraria ?? null,
    horario: dados.horario || null,
  };
}

export function listar(usuarioId: number) {
  return prisma.disciplina.findMany({
    where: { usuarioId },
    orderBy: { nome: "asc" },
    include: COM_TOTAL_EVENTOS,
  });
}

export function buscarPorId(usuarioId: number, id: number) {
  return prisma.disciplina.findFirst({ where: { id, usuarioId } });
}

export function buscarComEventos(usuarioId: number, id: number) {
  return prisma.disciplina.findFirst({
    where: { id, usuarioId },
    include: { eventos: { orderBy: [{ data: "asc" }, { id: "asc" }] } },
  });
}

// Mesma consulta de eventos usada pelo calendário, agrupada por disciplina (Dashboard).
export function listarComEventos(usuarioId: number) {
  return prisma.disciplina.findMany({
    where: { usuarioId },
    orderBy: { nome: "asc" },
    include: { eventos: { orderBy: [{ data: "asc" }, { id: "asc" }] } },
  });
}

export function buscarPorNome(usuarioId: number, nome: string) {
  return prisma.disciplina.findUnique({
    where: { usuarioId_nome: { usuarioId, nome } },
  });
}

export function contarEventos(id: number) {
  return prisma.evento.count({ where: { disciplinaId: id } });
}

export function criar(usuarioId: number, dados: DadosDisciplina) {
  return prisma.disciplina.create({
    data: { ...camposDisciplina(dados), usuarioId },
  });
}

export function atualizar(id: number, dados: DadosDisciplina) {
  return prisma.disciplina.update({
    where: { id },
    data: camposDisciplina(dados),
  });
}

// Os eventos vinculados são removidos pelo ON DELETE CASCADE do banco.
export function remover(id: number) {
  return prisma.disciplina.delete({ where: { id } });
}
