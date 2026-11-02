import { Request, Response } from "express";
import * as lgpdService from "../services/lgpdService";
import { ipDaRequisicao } from "../utils/requisicao";

export async function consultarDados(req: Request, res: Response) {
  const dados = await lgpdService.consultarDados(req.usuarioId!, ipDaRequisicao(req));
  res.json(dados);
}

export async function exportar(req: Request, res: Response) {
  const dados = await lgpdService.exportar(req.usuarioId!, ipDaRequisicao(req));
  res.setHeader("Content-Disposition", 'attachment; filename="meus-dados-ola.json"');
  res.json(dados);
}

export async function revogarConsentimento(req: Request, res: Response) {
  await lgpdService.revogarConsentimento(req.usuarioId!, ipDaRequisicao(req));
  res.json({
    mensagem:
      "Consentimento revogado. Sua sessão foi encerrada e seus dados foram marcados para exclusão (art. 16 da LGPD).",
  });
}

export async function excluirConta(req: Request, res: Response) {
  await lgpdService.excluirConta(req.usuarioId!, ipDaRequisicao(req));
  res.json({
    mensagem: "Conta e dados acadêmicos excluídos com sucesso (art. 18, VI, da LGPD).",
  });
}

export async function listarLogs(req: Request, res: Response) {
  const logs = await lgpdService.listarLogs(req.usuarioId!);
  res.json({ logs });
}
