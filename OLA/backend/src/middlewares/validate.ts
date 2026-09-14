import { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";

export function validate(req: Request, res: Response, next: NextFunction) {
  const erros = validationResult(req);

  if (!erros.isEmpty()) {
    res.status(400).json({ erro: erros.array()[0].msg });
    return;
  }

  next();
}
