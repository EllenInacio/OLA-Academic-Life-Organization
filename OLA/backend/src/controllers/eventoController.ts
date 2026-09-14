import { Request, Response } from "express";
import * as eventoService from "../services/eventoService";
import { DadosEvento } from "../types/evento";

export async function listar(_req: Request, res: Response) {
  const eventos = await eventoService.listar();
  res.json(eventos);
}

export async function buscarPorId(req: Request, res: Response) {
  const evento = await eventoService.buscarPorId(Number(req.params.id));
  res.json(evento);
}

export async function criar(req: Request, res: Response) {
  const evento = await eventoService.criar(req.body as DadosEvento);
  res.status(201).json(evento);
}

export async function atualizar(req: Request, res: Response) {
  const evento = await eventoService.atualizar(
    Number(req.params.id),
    req.body as DadosEvento
  );
  res.json(evento);
}

export async function remover(req: Request, res: Response) {
  await eventoService.remover(Number(req.params.id));
  res.status(204).send();
}
