import { Request, Response } from "express";
import * as disciplinaService from "../services/disciplinaService";
import * as auditoriaService from "../services/auditoriaService";
import { AcaoAuditoria } from "../types/auditoria";
import { DadosDisciplina } from "../types/disciplina";
import { ipDaRequisicao } from "../utils/requisicao";

function registrarAcao(
  req: Request,
  acao: AcaoAuditoria,
  disciplina: { id: number; nome: string },
  detalhe = disciplina.nome
) {
  return auditoriaService.registrar(acao, {
    usuarioId: req.usuarioId,
    entidade: "disciplina",
    entidadeId: disciplina.id,
    detalhe,
    ip: ipDaRequisicao(req),
  });
}

export async function listar(req: Request, res: Response) {
  const disciplinas = await disciplinaService.listar(req.usuarioId!);
  res.json(disciplinas);
}

export async function buscarPorId(req: Request, res: Response) {
  const disciplina = await disciplinaService.buscarDetalhes(req.usuarioId!, Number(req.params.id));
  res.json(disciplina);
}

export async function criar(req: Request, res: Response) {
  const disciplina = await disciplinaService.criar(req.usuarioId!, req.body as DadosDisciplina);
  await registrarAcao(req, "DISCIPLINA_CRIADA", disciplina);
  res.status(201).json(disciplina);
}

export async function atualizar(req: Request, res: Response) {
  const disciplina = await disciplinaService.atualizar(
    req.usuarioId!,
    Number(req.params.id),
    req.body as DadosDisciplina
  );
  await registrarAcao(req, "DISCIPLINA_ALTERADA", disciplina);
  res.json(disciplina);
}

export async function remover(req: Request, res: Response) {
  const { disciplina, eventosRemovidos } = await disciplinaService.remover(
    req.usuarioId!,
    Number(req.params.id),
    req.query.confirmar === "true"
  );
  await registrarAcao(
    req,
    "DISCIPLINA_EXCLUIDA",
    disciplina,
    `${disciplina.nome} (${eventosRemovidos} evento(s) removido(s) junto)`
  );
  res.status(204).send();
}
