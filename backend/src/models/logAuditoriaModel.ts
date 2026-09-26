import { prisma } from "../config/prisma";
import { AcaoAuditoria, DadosAuditoria } from "../types/auditoria";

export function criar(acao: AcaoAuditoria, dados: DadosAuditoria) {
  return prisma.logAuditoria.create({
    data: {
      acao,
      usuarioId: dados.usuarioId ?? null,
      entidade: dados.entidade ?? null,
      entidadeId: dados.entidadeId ?? null,
      detalhe: dados.detalhe?.slice(0, 255) ?? null,
      ip: dados.ip?.slice(0, 45) ?? null,
    },
  });
}

export function listarPorUsuario(usuarioId: number, limite: number) {
  return prisma.logAuditoria.findMany({
    where: { usuarioId },
    orderBy: { criadoEm: "desc" },
    take: limite,
  });
}
