import { AppError } from "../errors/AppError";
import * as disciplinaModel from "../models/disciplinaModel";
import { DadosDisciplina } from "../types/disciplina";
import { dataDeHoje, diasEntre, paraDataISO } from "../calculos/prazos";
import { resumirDisciplina } from "./dashboardService";

const NOME_REPETIDO = "Já existe uma disciplina com esse nome.";
const NAO_ENCONTRADA = "Disciplina não encontrada.";

function ehNomeRepetido(erro: unknown) {
  return (erro as { code?: string } | null)?.code === "P2002";
}

export async function listar(usuarioId: number) {
  const disciplinas = await disciplinaModel.listar(usuarioId);

  return disciplinas.map(({ _count, ...disciplina }) => ({
    ...disciplina,
    totalEventos: _count.eventos,
  }));
}

export async function buscarDetalhes(usuarioId: number, id: number) {
  const disciplina = await disciplinaModel.buscarComEventos(usuarioId, id);

  if (!disciplina) {
    throw new AppError(NAO_ENCONTRADA, 404);
  }

  const hoje = dataDeHoje();

  return {
    ...disciplina,
    eventos: disciplina.eventos.map((evento) => ({
      ...evento,
      diasRestantes: diasEntre(hoje, paraDataISO(evento.data)),
    })),
    resumo: resumirDisciplina(disciplina, hoje),
  };
}

async function garantirNomeDisponivel(usuarioId: number, nome: string, idAtual?: number) {
  const existente = await disciplinaModel.buscarPorNome(usuarioId, nome);

  if (existente && existente.id !== idAtual) {
    throw new AppError(NOME_REPETIDO, 409);
  }
}

export async function criar(usuarioId: number, dados: DadosDisciplina) {
  await garantirNomeDisponivel(usuarioId, dados.nome);

  try {
    return await disciplinaModel.criar(usuarioId, dados);
  } catch (erro) {
    if (ehNomeRepetido(erro)) throw new AppError(NOME_REPETIDO, 409);
    throw erro;
  }
}

export async function atualizar(usuarioId: number, id: number, dados: DadosDisciplina) {
  const disciplina = await disciplinaModel.buscarPorId(usuarioId, id);

  if (!disciplina) {
    throw new AppError(NAO_ENCONTRADA, 404);
  }

  await garantirNomeDisponivel(usuarioId, dados.nome, id);

  try {
    return await disciplinaModel.atualizar(id, dados);
  } catch (erro) {
    if (ehNomeRepetido(erro)) throw new AppError(NOME_REPETIDO, 409);
    throw erro;
  }
}
export async function remover(usuarioId: number, id: number, confirmar: boolean) {
  const disciplina = await disciplinaModel.buscarPorId(usuarioId, id);

  if (!disciplina) {
    throw new AppError(NAO_ENCONTRADA, 404);
  }

  const eventos = await disciplinaModel.contarEventos(id);

  if (eventos > 0 && !confirmar) {
    throw new AppError(
      `A disciplina "${disciplina.nome}" possui ${eventos} evento(s) no calendário. ` +
        "Confirme a exclusão para remover a disciplina e os eventos vinculados.",
      409,
      { eventos }
    );
  }

  await disciplinaModel.remover(id);
  return { disciplina, eventosRemovidos: eventos };
}
