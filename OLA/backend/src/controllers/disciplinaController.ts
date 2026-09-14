import { Request, Response } from "express";
import * as disciplinaService from "../services/disciplinaService";

export async function listar(_req: Request, res: Response) {
  const disciplinas = await disciplinaService.listar();
  res.json(disciplinas);
}

export async function criar(req: Request, res: Response) {
  const disciplina = await disciplinaService.criar(req.body);
  res.status(201).json(disciplina);
}
