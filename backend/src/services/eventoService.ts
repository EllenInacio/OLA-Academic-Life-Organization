import { AppError } from "../errors/AppError";
import * as eventoModel from "../models/eventoModel";
import * as disciplinaModel from "../models/disciplinaModel";
import { DadosEvento } from "../types/evento";

export function listar(usuarioId: number) {
  return eventoModel.listar(usuarioId);
}

export async function buscarPorId(usuarioId: number, id: number) {
  const evento = await eventoModel.buscarPorId(usuarioId, id);

  if (!evento) {
    throw new AppError("Evento não encontrado.", 404);
  }

  return evento;
}

async function garantirDisciplina(usuarioId: number, disciplinaId: number) {
  const disciplina = await disciplinaModel.buscarPorId(usuarioId, disciplinaId);

  if (!disciplina) {
    throw new AppError("Disciplina não encontrada.", 404);
  }
}

export async function criar(usuarioId: number, dados: DadosEvento) {
  await garantirDisciplina(usuarioId, dados.disciplinaId);
  return eventoModel.criar(dados);
}

export async function atualizar(usuarioId: number, id: number, dados: DadosEvento) {
  await buscarPorId(usuarioId, id);
  await garantirDisciplina(usuarioId, dados.disciplinaId);
  return eventoModel.atualizar(id, dados);
}

export async function remover(usuarioId: number, id: number) {
  const evento = await buscarPorId(usuarioId, id);
  await eventoModel.remover(id);
  return evento;
}
