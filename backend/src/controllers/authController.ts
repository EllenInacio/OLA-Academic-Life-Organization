import { Request, Response } from "express";
import * as authService from "../services/authService";
import * as recuperacaoService from "../services/recuperacaoService";
import { ipDaRequisicao } from "../utils/requisicao";

export async function cadastrar(req: Request, res: Response) {
  const { qrCode } = await authService.cadastrar(req.body, ipDaRequisicao(req));
  res.status(201).json({
    mensagem: "Conta criada com sucesso. Escaneie o QR Code no seu aplicativo autenticador.",
    qrCode,
  });
}

export async function login(req: Request, res: Response) {
  const { tokenTemporario } = await authService.login(req.body, ipDaRequisicao(req));
  res.json({
    mensagem: "Senha validada. Informe o código de verificação para continuar.",
    exige2fa: true,
    tokenTemporario,
  });
}

export async function enviarCodigo2fa(req: Request, res: Response) {
  await authService.enviarCodigo2fa(req.body.tokenTemporario);
  res.json({
    mensagem: "Código de verificação enviado para o e-mail cadastrado. Válido por 15 minutos.",
  });
}

export async function verificar2fa(req: Request, res: Response) {
  const sessao = await authService.verificar2fa(req.body, ipDaRequisicao(req));
  res.json(sessao);
}

export async function logout(req: Request, res: Response) {
  await authService.logout(req.usuarioId!, ipDaRequisicao(req));
  res.status(204).send();
}

export async function solicitarRecuperacao(req: Request, res: Response) {
  await recuperacaoService.solicitar(req.body.email, ipDaRequisicao(req));
  res.json({ mensagem: recuperacaoService.MENSAGEM_SOLICITACAO });
}

export async function verificarRecuperacao(req: Request, res: Response) {
  const resultado = await recuperacaoService.verificar(
    req.body.email,
    req.body.codigo,
    ipDaRequisicao(req)
  );
  res.json({ mensagem: "Identidade confirmada. Defina sua nova senha.", ...resultado });
}

export async function redefinirSenha(req: Request, res: Response) {
  await recuperacaoService.redefinir(
    req.body.tokenRedefinicao,
    req.body.novaSenha,
    ipDaRequisicao(req)
  );
  res.json({ mensagem: "Senha redefinida com sucesso! Faça login com a nova senha." });
}
