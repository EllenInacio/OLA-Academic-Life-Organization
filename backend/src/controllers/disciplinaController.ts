import { Request, Response } from "express";
import * as disciplinaService from "../services/disciplinaService";
import * as auditoriaService from "../services/auditoriaService";
import { ipDaRequisicao } from "../utils/requisicao";

export async function listar(req: Request, res: Response) {
  const disciplinas = await disciplinaService.listar(req.usuarioId!);
  res.json(disciplinas);
}

export async function criar(req: Request, res: Response) {
  const disciplina = await disciplinaService.criar(req.usuarioId!, req.body);
  await auditoriaService.registrar("DISCIPLINA_CRIADA", {
    usuarioId: req.usuarioId,
    entidade: "disciplina",
    entidadeId: disciplina.id,
    detalhe: disciplina.nome,
    ip: ipDaRequisicao(req),
  });
  res.status(201).json(disciplina);
}
