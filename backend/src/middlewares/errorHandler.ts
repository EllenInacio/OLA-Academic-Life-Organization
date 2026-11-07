import { ErrorRequestHandler } from "express";
import { AppError } from "../errors/AppError";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res
      .status(err.status)
      .json(err.detalhes ? { erro: err.message, detalhes: err.detalhes } : { erro: err.message });
    return;
  }

  if (err?.type === "entity.too.large") {
    res.status(413).json({ erro: "O conteúdo enviado é grande demais." });
    return;
  }
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ erro: "O corpo da requisição não é um JSON válido." });
    return;
  }

  console.error(err);
  res.status(500).json({ erro: "Erro interno no servidor." });
};
