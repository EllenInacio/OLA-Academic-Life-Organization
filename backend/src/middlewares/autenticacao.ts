import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import * as usuarioModel from "../models/usuarioModel";
import { lerToken } from "../utils/token";

const SESSAO_INVALIDA = "Sessão expirada ou inválida. Faça login novamente.";

export async function autenticar(req: Request, _res: Response, next: NextFunction) {
  const [esquema, token] = (req.headers.authorization ?? "").split(" ");
  const dados = esquema === "Bearer" && token ? lerToken(token, "acesso") : null;

  if (!dados) {
    throw new AppError(SESSAO_INVALIDA, 401);
  }

  const usuario = await usuarioModel.buscarPorId(dados.usuarioId);

  if (!usuario || usuario.versaoToken !== dados.versao || usuario.consentimentoRevogadoEm) {
    throw new AppError(SESSAO_INVALIDA, 401);
  }

  req.usuarioId = usuario.id;
  next();
}
