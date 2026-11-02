import * as logAuditoriaModel from "../models/logAuditoriaModel";
import { AcaoAuditoria, DadosAuditoria } from "../types/auditoria";

export async function registrar(acao: AcaoAuditoria, dados: DadosAuditoria = {}) {
  try {
    await logAuditoriaModel.criar(acao, dados);
  } catch (erro) {
    console.error("[auditoria] Falha ao gravar log no banco:", erro);
    console.log(
      `[auditoria] ${acao} | usuario:${dados.usuarioId ?? "-"} | ${dados.detalhe ?? ""}`
    );
  }
}

export function listarDoUsuario(usuarioId: number, limite = 50) {
  return logAuditoriaModel.listarPorUsuario(usuarioId, limite);
}
