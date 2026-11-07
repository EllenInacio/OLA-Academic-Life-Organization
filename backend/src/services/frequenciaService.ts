import { AppError } from "../errors/AppError";
import * as disciplinaModel from "../models/disciplinaModel";
import * as registroFrequenciaModel from "../models/registroFrequenciaModel";
import { dataDeHoje, paraDataISO } from "../calculos/prazos";
import { DadosFrequencia } from "../types/frequencia";
import { formatarData } from "../utils/formatacao";

function normalizar(dados: DadosFrequencia): DadosFrequencia {
  return { data: dados.data, quantidadeAulas: dados.quantidadeAulas ?? 1, faltas: dados.faltas };
}

async function garantirDisciplina(usuarioId: number, disciplinaId: number) {
  const disciplina = await disciplinaModel.buscarPorId(usuarioId, disciplinaId);

  if (!disciplina) {
    throw new AppError("Disciplina não encontrada.", 404);
  }
}

// Frequência é registro de aula que já aconteceu: não aceita data futura.
function garantirDataPassada(data: string) {
  if (data > dataDeHoje()) {
    throw new AppError("Não é possível registrar frequência de uma aula que ainda não aconteceu.", 400);
  }
}

async function garantirDataLivre(disciplinaId: number, data: string, idAtual?: number) {
  const existente = await registroFrequenciaModel.buscarPorData(disciplinaId, data);

  if (existente && existente.id !== idAtual) {
    throw new AppError(
      `Já existe um registro de frequência em ${formatarData(data)} para esta disciplina. ` +
        "Edite o registro existente.",
      409
    );
  }
}

function ehDataRepetida(erro: unknown) {
  return (erro as { code?: string } | null)?.code === "P2002";
}

export async function listar(usuarioId: number, disciplinaId: number) {
  await garantirDisciplina(usuarioId, disciplinaId);
  return registroFrequenciaModel.listarPorDisciplina(disciplinaId);
}

export async function criar(usuarioId: number, disciplinaId: number, dados: DadosFrequencia) {
  const registro = normalizar(dados);
  await garantirDisciplina(usuarioId, disciplinaId);
  garantirDataPassada(registro.data);
  await garantirDataLivre(disciplinaId, registro.data);

  try {
    return await registroFrequenciaModel.criar(disciplinaId, registro);
  } catch (erro) {
    if (ehDataRepetida(erro)) await garantirDataLivre(disciplinaId, registro.data);
    throw erro;
  }
}

async function buscarDoUsuario(usuarioId: number, id: number) {
  const registro = await registroFrequenciaModel.buscarPorId(usuarioId, id);

  if (!registro) {
    throw new AppError("Registro de frequência não encontrado.", 404);
  }

  return registro;
}

export async function atualizar(usuarioId: number, id: number, dados: DadosFrequencia) {
  const atual = await buscarDoUsuario(usuarioId, id);
  const registro = normalizar(dados);
  garantirDataPassada(registro.data);
  await garantirDataLivre(atual.disciplinaId, registro.data, id);
  return registroFrequenciaModel.atualizar(id, registro);
}

export async function remover(usuarioId: number, id: number) {
  const registro = await buscarDoUsuario(usuarioId, id);
  await registroFrequenciaModel.remover(id);
  return registro;
}

/** Texto curto para a auditoria: "Cálculo I · 14/10/2026 · 2 aula(s), 1 falta(s)". */
export function descrever(registro: {
  data: Date;
  quantidadeAulas: number;
  faltas: number;
  disciplina: { nome: string };
}) {
  return `${registro.disciplina.nome} · ${formatarData(paraDataISO(registro.data))} · ${registro.quantidadeAulas} aula(s), ${registro.faltas} falta(s)`;
}
