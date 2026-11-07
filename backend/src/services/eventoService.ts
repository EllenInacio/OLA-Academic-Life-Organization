import { AppError } from "../errors/AppError";
import * as eventoModel from "../models/eventoModel";
import * as disciplinaModel from "../models/disciplinaModel";
import { DadosEvento, DadosNota, NOTA_MAXIMA_PADRAO } from "../types/evento";
import { formatarNumero } from "../utils/formatacao";

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

function garantirAvaliativo(peso: number) {
  if (peso <= 0) {
    throw new AppError(
      "Este evento tem peso 0, então não é avaliativo. Altere o peso no calendário para lançar a nota.",
      400
    );
  }
}

export async function criar(usuarioId: number, dados: DadosEvento) {
  await garantirDisciplina(usuarioId, dados.disciplinaId);

  if (dados.nota !== undefined && dados.nota !== null) {
    garantirAvaliativo(dados.peso);
    // Avaliação cadastrada já com nota: está concluída.
    return eventoModel.criar({ ...dados, status: "CONCLUIDO" });
  }

  return eventoModel.criar(dados);
}

export async function atualizar(usuarioId: number, id: number, dados: DadosEvento) {
  await buscarPorId(usuarioId, id);
  await garantirDisciplina(usuarioId, dados.disciplinaId);
  return eventoModel.atualizar(id, dados);
}

export async function lancarNota(usuarioId: number, id: number, dados: DadosNota) {
  const evento = await buscarPorId(usuarioId, id);
  garantirAvaliativo(Number(evento.peso));

  const notaMaxima = dados.notaMaxima ?? Number(evento.notaMaxima ?? NOTA_MAXIMA_PADRAO);

  if (dados.nota > notaMaxima) {
    throw new AppError(
      `A nota não pode ser maior que a nota máxima da avaliação (${formatarNumero(notaMaxima)}).`,
      400
    );
  }

  return eventoModel.lancarNota(id, dados.nota, notaMaxima);
}

export async function removerNota(usuarioId: number, id: number) {
  await buscarPorId(usuarioId, id);
  return eventoModel.removerNota(id);
}

export async function remover(usuarioId: number, id: number) {
  const evento = await buscarPorId(usuarioId, id);
  await eventoModel.remover(id);
  return evento;
}
