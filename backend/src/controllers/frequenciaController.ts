import { Request, Response } from "express";
import * as frequenciaService from "../services/frequenciaService";
import * as auditoriaService from "../services/auditoriaService";
import { AcaoAuditoria } from "../types/auditoria";
import { DadosFrequencia } from "../types/frequencia";
import { ipDaRequisicao } from "../utils/requisicao";

function registrarAcao(
  req: Request,
  acao: AcaoAuditoria,
  registro: Parameters<typeof frequenciaService.descrever>[0] & { id: number }
) {
  return auditoriaService.registrar(acao, {
    usuarioId: req.usuarioId,
    entidade: "registro_frequencia",
    entidadeId: registro.id,
    detalhe: frequenciaService.descrever(registro),
    ip: ipDaRequisicao(req),
  });
}

export async function listar(req: Request, res: Response) {
  const registros = await frequenciaService.listar(req.usuarioId!, Number(req.params.id));
  res.json(registros);
}

export async function criar(req: Request, res: Response) {
  const registro = await frequenciaService.criar(
    req.usuarioId!,
    Number(req.params.id),
    req.body as DadosFrequencia
  );
  await registrarAcao(req, "FREQUENCIA_REGISTRADA", registro);
  res.status(201).json(registro);
}

export async function atualizar(req: Request, res: Response) {
  const registro = await frequenciaService.atualizar(
    req.usuarioId!,
    Number(req.params.id),
    req.body as DadosFrequencia
  );
  await registrarAcao(req, "FREQUENCIA_ALTERADA", registro);
  res.json(registro);
}

export async function remover(req: Request, res: Response) {
  const registro = await frequenciaService.remover(req.usuarioId!, Number(req.params.id));
  await registrarAcao(req, "FREQUENCIA_EXCLUIDA", registro);
  res.status(204).send();
}
