import { Request, Response } from "express";
import * as eventoService from "../services/eventoService";
import * as auditoriaService from "../services/auditoriaService";
import { AcaoAuditoria } from "../types/auditoria";
import { DadosEvento } from "../types/evento";
import { ipDaRequisicao } from "../utils/requisicao";

function registrarAcao(req: Request, acao: AcaoAuditoria, evento: { id: number; titulo: string }) {
  return auditoriaService.registrar(acao, {
    usuarioId: req.usuarioId,
    entidade: "evento",
    entidadeId: evento.id,
    detalhe: evento.titulo,
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

export async function remover(req: Request, res: Response) {
  const evento = await eventoService.remover(req.usuarioId!, Number(req.params.id));
  await registrarAcao(req, "EVENTO_EXCLUIDO", evento);
  res.status(204).send();
}
