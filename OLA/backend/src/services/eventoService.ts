import { AppError } from "../errors/AppError";
import * as eventoModel from "../models/eventoModel";
import * as disciplinaModel from "../models/disciplinaModel";
import { DadosEvento } from "../types/evento";

export function listar() {
  return eventoModel.listar();
}

export async function buscarPorId(id: number) {
  const evento = await eventoModel.buscarPorId(id);

  if (!evento) {
    throw new AppError("Evento não encontrado.", 404);
  }

  return evento;
}

async function garantirDisciplina(disciplinaId: number) {
  const disciplina = await disciplinaModel.buscarPorId(disciplinaId);

  if (!disciplina) {
    throw new AppError("Disciplina não encontrada.", 404);
  }
}

export async function criar(dados: DadosEvento) {
  await garantirDisciplina(dados.disciplinaId);
  return eventoModel.criar(dados);
}

export async function atualizar(id: number, dados: DadosEvento) {
  await buscarPorId(id);
  await garantirDisciplina(dados.disciplinaId);
  return eventoModel.atualizar(id, dados);
}

export async function remover(id: number) {
  await buscarPorId(id);
  await eventoModel.remover(id);
}
