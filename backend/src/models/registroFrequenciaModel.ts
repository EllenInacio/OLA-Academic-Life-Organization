import { prisma } from "../config/prisma";
import { DadosFrequencia } from "../types/frequencia";

const COM_DISCIPLINA = {
  disciplina: { select: { id: true, nome: true } },
};

export function listarPorDisciplina(disciplinaId: number) {
  return prisma.registroFrequencia.findMany({
    where: { disciplinaId },
    orderBy: { data: "desc" },
  });
}

export function buscarPorId(usuarioId: number, id: number) {
  return prisma.registroFrequencia.findFirst({
    where: { id, disciplina: { usuarioId } },
    include: COM_DISCIPLINA,
  });
}

export function buscarPorData(disciplinaId: number, data: string) {
  return prisma.registroFrequencia.findUnique({
    where: { disciplinaId_data: { disciplinaId, data: new Date(data) } },
  });
}

export function criar(disciplinaId: number, dados: DadosFrequencia) {
  return prisma.registroFrequencia.create({
    data: {
      data: new Date(dados.data),
      quantidadeAulas: dados.quantidadeAulas,
      faltas: dados.faltas,
      disciplinaId,
    },
    include: COM_DISCIPLINA,
  });
}

export function atualizar(id: number, dados: DadosFrequencia) {
  return prisma.registroFrequencia.update({
    where: { id },
    data: {
      data: new Date(dados.data),
      quantidadeAulas: dados.quantidadeAulas,
      faltas: dados.faltas,
    },
    include: COM_DISCIPLINA,
  });
}

export function remover(id: number) {
  return prisma.registroFrequencia.delete({ where: { id } });
}
