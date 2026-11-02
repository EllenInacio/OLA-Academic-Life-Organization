import { Request, Response } from "express";
import * as dashboardService from "../services/dashboardService";

export async function obter(req: Request, res: Response) {
  const painel = await dashboardService.obterPainel(req.usuarioId!);
  res.json(painel);
}
