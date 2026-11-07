import { Request, Response } from "express";
import * as eventoService from "../services/eventoService";
import * as auditoriaService from "../services/auditoriaService";
import { AcaoAuditoria } from "../types/auditoria";
import { DadosEvento, DadosNota } from "../types/evento";
import { formatarNumero } from "../utils/formatacao";
import { ipDaRequisicao } from "../utils/requisicao";

function registrarAcao(
  req: Request,
  acao: AcaoAuditoria,
  evento: { id: number; titulo: string },
  detalhe = evento.titulo
) {
  return auditoriaService.registrar(acao, {
    usuarioId: req.usuarioId,
    entidade: "evento",
    entidadeId: evento.id,
    detalhe,
    ip: ipDaRequisicao(req),
  });
}

export async function listar(req: Request, res: Response) {
  const eventos = await eventoService.listar(req.usuarioId!);
  res.json(eventos);
}

export async function buscarPorId(req: Request, res: Response) {
  const evento = await eventoService.buscarPorId(req.usuarioId!, Number(req.params.id));
  res.json(evento);
}

export async function criar(req: Request, res: Response) {
  const evento = await eventoService.criar(req.usuarioId!, req.body as DadosEvento);
  await registrarAcao(req, "EVENTO_CRIADO", evento);
  if (evento.nota !== null) {
    await registrarAcao(
      req,
      "NOTA_LANCADA",
      evento,
      `${evento.titulo}: ${formatarNumero(Number(evento.nota))} de ${formatarNumero(Number(evento.notaMaxima))}`
    );
  }
  res.status(201).json(evento);
}

export async function atualizar(req: Request, res: Response) {
  const evento = await eventoService.atualizar(
    req.usuarioId!,
    Number(req.params.id),
    req.body as DadosEvento
  );
  await registrarAcao(req, "EVENTO_ALTERADO", evento);
  res.json(evento);
}

export async function lancarNota(req: Request, res: Response) {
  const evento = await eventoService.lancarNota(
    req.usuarioId!,
    Number(req.params.id),
    req.body as DadosNota
  );
  await registrarAcao(
    req,
    "NOTA_LANCADA",
    evento,
    `${evento.titulo}: ${formatarNumero(Number(evento.nota))} de ${formatarNumero(Number(evento.notaMaxima))}`
  );
  res.json(evento);
}

export async function removerNota(req: Request, res: Response) {
  const evento = await eventoService.removerNota(req.usuarioId!, Number(req.params.id));
  await registrarAcao(req, "NOTA_REMOVIDA", evento);
  res.json(evento);
}

export async function remover(req: Request, res: Response) {
  const evento = await eventoService.remover(req.usuarioId!, Number(req.params.id));
  await registrarAcao(req, "EVENTO_EXCLUIDO", evento);
  res.status(204).send();
}
