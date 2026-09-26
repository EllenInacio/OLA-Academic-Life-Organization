import { AppError } from "../errors/AppError";
import * as usuarioModel from "../models/usuarioModel";
import * as auditoriaService from "./auditoriaService";
import { BASE_LEGAL, FINALIDADE_TRATAMENTO } from "../types/lgpd";

async function buscarTitular(usuarioId: number) {
  const titular = await usuarioModel.buscarComDadosAcademicos(usuarioId);

  if (!titular) {
    throw new AppError("Usuário não encontrado.", 404);
  }

  return titular;
}

export async function consultarDados(usuarioId: number, ip?: string) {
  const titular = await buscarTitular(usuarioId);
  const logs = await auditoriaService.listarDoUsuario(usuarioId, 20);

  await auditoriaService.registrar("LGPD_CONSULTA_DADOS", {
    usuarioId,
    detalhe: "Titular consultou seus dados pessoais",
    ip,
  });

  return {
    dadosPessoais: {
      nome: titular.nome,
      email: titular.email,
      contaCriadaEm: titular.criadoEm,
      consentimentoEm: titular.consentimentoEm,
      versaoTermos: titular.consentimentoVersao,
    },
    dadosAcademicos: {
      disciplinas: titular.disciplinas.length,
      eventos: titular.disciplinas.reduce((total, d) => total + d.eventos.length, 0),
    },
    finalidade: FINALIDADE_TRATAMENTO,
    baseLegal: BASE_LEGAL,
    historicoAuditoria: logs.map((log) => ({
      acao: log.acao,
      dataHora: log.criadoEm,
      detalhe: log.detalhe,
    })),
  };
}

export async function exportar(usuarioId: number, ip?: string) {
  const titular = await buscarTitular(usuarioId);
  const logs = await auditoriaService.listarDoUsuario(usuarioId, 100);

  await auditoriaService.registrar("LGPD_EXPORTACAO", {
    usuarioId,
    detalhe: "Titular exportou seus dados (portabilidade)",
    ip,
  });

  return {
    exportadoEm: new Date().toISOString(),
    plataforma: "OLA — Organização da Vida Acadêmica",
    finalidade: FINALIDADE_TRATAMENTO,
    baseLegal: BASE_LEGAL,
    titular: {
      nome: titular.nome,
      email: titular.email,
      contaCriadaEm: titular.criadoEm,
      consentimentoEm: titular.consentimentoEm,
      versaoTermos: titular.consentimentoVersao,
    },
    disciplinas: titular.disciplinas.map((disciplina) => ({
      nome: disciplina.nome,
      professor: disciplina.professor,
      criadaEm: disciplina.criadoEm,
      eventos: disciplina.eventos.map((evento) => ({
        titulo: evento.titulo,
        tipo: evento.tipo,
        data: evento.data.toISOString().slice(0, 10),
        peso: Number(evento.peso),
        status: evento.status,
      })),
    })),
    historicoAuditoria: logs.map((log) => ({
      acao: log.acao,
      dataHora: log.criadoEm,
      detalhe: log.detalhe,
      ip: log.ip,
    })),
    nota: "A senha e o segredo da verificação em duas etapas não são exportados por questões de segurança.",
  };
}

export async function revogarConsentimento(usuarioId: number, ip?: string) {
  await buscarTitular(usuarioId);
  await usuarioModel.revogarConsentimento(usuarioId);

  await auditoriaService.registrar("LGPD_CONSENTIMENTO_REVOGADO", {
    usuarioId,
    detalhe: "Titular revogou o consentimento de tratamento dos dados",
    ip,
  });
}

export async function excluirConta(usuarioId: number, ip?: string) {
  await buscarTitular(usuarioId);

  await auditoriaService.registrar("LGPD_CONTA_EXCLUIDA", {
    usuarioId,
    detalhe: "Titular solicitou a exclusão da conta e dos dados acadêmicos",
    ip,
  });

  await usuarioModel.remover(usuarioId);
}

export async function listarLogs(usuarioId: number) {
  const logs = await auditoriaService.listarDoUsuario(usuarioId, 50);

  return logs.map((log) => ({
    acao: log.acao,
    dataHora: log.criadoEm,
    detalhe: log.detalhe,
    ip: log.ip,
  }));
}
