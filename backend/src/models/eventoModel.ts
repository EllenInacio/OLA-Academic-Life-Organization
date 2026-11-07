import { prisma } from "../config/prisma";
import { DadosEvento } from "../types/evento";

const COM_DISCIPLINA = {
  disciplina: { select: { id: true, nome: true } },
};

export function listar(usuarioId: number) {
  return prisma.evento.findMany({
    where: { disciplina: { usuarioId } },
    orderBy: { data: "asc" },
    include: COM_DISCIPLINA,
  });
}

export function buscarPorId(usuarioId: number, id: number) {
  return prisma.evento.findFirst({
    where: { id, disciplina: { usuarioId } },
    include: COM_DISCIPLINA,
  });
}

export function criar(dados: DadosEvento) {
  return prisma.evento.create({
    data: {
      titulo: dados.titulo,
      tipo: dados.tipo,
      data: new Date(dados.data),
      peso: dados.peso,
      status: dados.status,
      disciplinaId: dados.disciplinaId,
      nota: dados.nota ?? null,
      notaMaxima: dados.notaMaxima,
    },
    include: COM_DISCIPLINA,
  });
}

export function atualizar(id: number, dados: DadosEvento) {
  return prisma.evento.update({
    where: { id },
    data: {
      titulo: dados.titulo,
      tipo: dados.tipo,
      data: new Date(dados.data),
      peso: dados.peso,
      status: dados.status,
      disciplinaId: dados.disciplinaId,
    },
    include: COM_DISCIPLINA,
  });
}

export function remover(id: number) {
  return prisma.evento.delete({ where: { id } });
}

export function lancarNota(id: number, nota: number, notaMaxima: number) {
  return prisma.evento.update({
    where: { id },
    data: { nota, notaMaxima, status: "CONCLUIDO" },
    include: COM_DISCIPLINA,
  });
}

export function removerNota(id: number) {
  return prisma.evento.update({
    where: { id },
    data: { nota: null },
    include: COM_DISCIPLINA,
  });
}
