import { ErrorRequestHandler } from "express";
import { AppError } from "../errors/AppError";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res
      .status(err.status)
      .json(err.detalhes ? { erro: err.message, detalhes: err.detalhes } : { erro: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({ erro: "Erro interno no servidor." });
};
