import { AppError } from "../errors/AppError";
import * as disciplinaModel from "../models/disciplinaModel";
import { CARGA_HORARIA_MAXIMA, DadosDisciplina } from "../types/disciplina";
import { calcularCargaHoraria } from "../calculos/cargaHoraria";
import { dataDeHoje, diasEntre, paraDataISO } from "../calculos/prazos";
import { resumirDisciplina } from "./dashboardService";
import { plural } from "../utils/formatacao";

const NOME_REPETIDO = "Já existe uma disciplina com esse nome.";
const NAO_ENCONTRADA = "Disciplina não encontrada.";

type PeriodoSalvo = { inicioAulas: Date | null; fimAulas: Date | null };

function ehNomeRepetido(erro: unknown) {
  return (erro as { code?: string } | null)?.code === "P2002";
}

function dataDasAulas(informada: string | null | undefined, salva?: Date | null) {
  if (informada === undefined) return salva ? paraDataISO(salva) : null;
  return informada || null;
}

function comCargaHorariaCalculada(dados: DadosDisciplina, salvo?: PeriodoSalvo): DadosDisciplina {
  const calculo = calcularCargaHoraria({
    horario: dados.horario,
    inicioAulas: dataDasAulas(dados.inicioAulas, salvo?.inicioAulas),
    fimAulas: dataDasAulas(dados.fimAulas, salvo?.fimAulas),
  });

  if (calculo && calculo.horas > CARGA_HORARIA_MAXIMA) {
    throw new AppError(
      `A carga horária calculada (${calculo.horas}h) passa do limite de ${CARGA_HORARIA_MAXIMA}h. ` +
        "Confira os horários e as datas de início e fim das aulas.",
      400
    );
  }

  return { ...dados, cargaHoraria: calculo?.horas ?? null };
}

export async function listar(usuarioId: number) {
  const disciplinas = await disciplinaModel.listarComEventos(usuarioId);
  const hoje = dataDeHoje();

  return disciplinas.map(({ eventos, frequencias, ...disciplina }) => {
    const resumo = resumirDisciplina({ ...disciplina, eventos, frequencias }, hoje);

    return {
      ...disciplina,
      totalEventos: eventos.length,
      totalFrequencias: frequencias.length,
      media: resumo.desempenho.media,
      situacaoNota: resumo.desempenho.situacao,
      percentualFaltas: resumo.frequencia.percentualFaltas,
      situacaoFrequencia: resumo.frequencia.situacao,
    };
  });
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
  const completos = comCargaHorariaCalculada(dados);

  try {
    return await disciplinaModel.criar(usuarioId, completos);
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
  const completos = comCargaHorariaCalculada(dados, disciplina);

  try {
    return await disciplinaModel.atualizar(id, completos);
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

  const relacionados = await disciplinaModel.contarRelacionados(id);
  const { eventos, frequencias } = relacionados;

  if ((eventos > 0 || frequencias > 0) && !confirmar) {
    throw new AppError(
      `A disciplina "${disciplina.nome}" possui ${plural(eventos, "evento", "eventos")} no calendário e ` +
        `${plural(frequencias, "registro", "registros")} de frequência. ` +
        "Confirme a exclusão para remover a disciplina e os dados vinculados.",
      409,
      relacionados
    );
  }

  await disciplinaModel.remover(id);
  return { disciplina, removidos: relacionados };
}
