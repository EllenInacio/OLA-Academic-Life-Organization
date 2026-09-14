import { AppError } from "../errors/AppError";
import * as disciplinaModel from "../models/disciplinaModel";

export function listar() {
  return disciplinaModel.listar();
}

export async function criar(dados: { nome: string; professor?: string }) {
  const existente = await disciplinaModel.buscarPorNome(dados.nome);

  if (existente) {
    throw new AppError("Já existe uma disciplina com esse nome.", 409);
  }

  return disciplinaModel.criar(dados);
}
