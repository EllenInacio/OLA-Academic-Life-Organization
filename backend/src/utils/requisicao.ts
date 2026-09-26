import { Request } from "express";

export function ipDaRequisicao(req: Request) {
  return req.ip ?? req.socket?.remoteAddress ?? undefined;
}
