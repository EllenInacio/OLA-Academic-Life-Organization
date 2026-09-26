import { AppError } from "../errors/AppError";
import * as disciplinaModel from "../models/disciplinaModel";

export function listar(usuarioId: number) {
  return disciplinaModel.listar(usuarioId);
}

export async function criar(
  usuarioId: number,
  dados: { nome: string; professor?: string }
) {
  const existente = await disciplinaModel.buscarPorNome(usuarioId, dados.nome);

  if (existente) {
    throw new AppError("Já existe uma disciplina com esse nome.", 409);
  }

  return disciplinaModel.criar(usuarioId, dados);
}
