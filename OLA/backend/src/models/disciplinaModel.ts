import { prisma } from "../config/prisma";

export function listar() {
  return prisma.disciplina.findMany({
    orderBy: { nome: "asc" },
  });
}

export function buscarPorId(id: number) {
  return prisma.disciplina.findUnique({ where: { id } });
}

export function buscarPorNome(nome: string) {
  return prisma.disciplina.findUnique({ where: { nome } });
}

export function criar(dados: { nome: string; professor?: string }) {
  return prisma.disciplina.create({
    data: {
      nome: dados.nome,
      professor: dados.professor || null,
    },
  });
}
