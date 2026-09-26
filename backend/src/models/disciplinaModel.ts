import { prisma } from "../config/prisma";

export function listar(usuarioId: number) {
  return prisma.disciplina.findMany({
    where: { usuarioId },
    orderBy: { nome: "asc" },
  });
}

export function buscarPorId(usuarioId: number, id: number) {
  return prisma.disciplina.findFirst({ where: { id, usuarioId } });
}

export function buscarPorNome(usuarioId: number, nome: string) {
  return prisma.disciplina.findUnique({
    where: { usuarioId_nome: { usuarioId, nome } },
  });
}

export function criar(usuarioId: number, dados: { nome: string; professor?: string }) {
  return prisma.disciplina.create({
    data: {
      nome: dados.nome,
      professor: dados.professor || null,
      usuarioId,
    },
  });
}
