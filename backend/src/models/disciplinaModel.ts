import { prisma } from "../config/prisma";
import { DadosDisciplina } from "../types/disciplina";

const COM_DADOS_ACADEMICOS = {
  eventos: { orderBy: [{ data: "asc" as const }, { id: "asc" as const }] },
  frequencias: { orderBy: { data: "desc" as const } },
};

function dataDoPeriodo(valor?: string | null) {
  if (valor === undefined) return undefined;
  return valor ? new Date(valor) : null;
}

function periodoAcademico(dados: DadosDisciplina) {
  if (dados.periodoTipo === undefined) return {};
  return {
    periodoTipo: dados.periodoTipo,
    periodoNumero: dados.periodoTipo === "SEMESTRE" ? (dados.periodoNumero ?? null) : null,
  };
}

function camposDisciplina(dados: DadosDisciplina) {
  return {
    nome: dados.nome,
    professor: dados.professor || null,
    ...periodoAcademico(dados),
    cargaHoraria: dados.cargaHoraria ?? null,
    horario: dados.horario || null,
    inicioAulas: dataDoPeriodo(dados.inicioAulas),
    fimAulas: dataDoPeriodo(dados.fimAulas),
    regraMedia: dados.regraMedia ?? undefined,
    mediaAprovacao: dados.mediaAprovacao === undefined ? undefined : dados.mediaAprovacao,
    pesoM1: dados.pesoM1 ?? undefined,
    pesoM2: dados.pesoM2 ?? undefined,
    limiteFaltas: dados.limiteFaltas === undefined ? undefined : dados.limiteFaltas,
  };
}

export function buscarPorId(usuarioId: number, id: number) {
  return prisma.disciplina.findFirst({ where: { id, usuarioId } });
}

export function buscarComEventos(usuarioId: number, id: number) {
  return prisma.disciplina.findFirst({
    where: { id, usuarioId },
    include: COM_DADOS_ACADEMICOS,
  });
}

export function listarComEventos(usuarioId: number) {
  return prisma.disciplina.findMany({
    where: { usuarioId },
    orderBy: { nome: "asc" },
    include: COM_DADOS_ACADEMICOS,
  });
}

export function buscarPorNome(usuarioId: number, nome: string) {
  return prisma.disciplina.findUnique({
    where: { usuarioId_nome: { usuarioId, nome } },
  });
}

export async function contarRelacionados(id: number) {
  const [eventos, frequencias] = await Promise.all([
    prisma.evento.count({ where: { disciplinaId: id } }),
    prisma.registroFrequencia.count({ where: { disciplinaId: id } }),
  ]);
  return { eventos, frequencias };
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

export function remover(id: number) {
  return prisma.disciplina.delete({ where: { id } });
}
