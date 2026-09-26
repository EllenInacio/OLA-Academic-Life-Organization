import { prisma } from "../config/prisma";

type NovoUsuario = {
  nome: string;
  email: string;
  senhaHash: string;
  segredo2fa: string;
  consentimentoVersao: string;
};

export function buscarPorId(id: number) {
  return prisma.usuario.findUnique({ where: { id } });
}

export function buscarPorEmail(email: string) {
  return prisma.usuario.findUnique({ where: { email } });
}

export function criar(dados: NovoUsuario) {
  return prisma.usuario.create({
    data: { ...dados, consentimentoEm: new Date() },
  });
}

export function salvarCodigo2fa(id: number, hash: string | null, expiraEm: Date | null) {
  return prisma.usuario.update({
    where: { id },
    data: { codigo2faHash: hash, codigo2faExpiraEm: expiraEm },
  });
}

export function salvarCodigoRecuperacao(
  id: number,
  hash: string | null,
  expiraEm: Date | null
) {
  return prisma.usuario.update({
    where: { id },
    data: { codigoRecuperacaoHash: hash, codigoRecuperacaoExpiraEm: expiraEm },
  });
}

export function atualizarSenha(id: number, senhaHash: string) {
  return prisma.usuario.update({
    where: { id },
    data: {
      senhaHash,
      codigoRecuperacaoHash: null,
      codigoRecuperacaoExpiraEm: null,
      versaoToken: { increment: 1 },
    },
  });
}

export function encerrarSessoes(id: number) {
  return prisma.usuario.update({
    where: { id },
    data: { versaoToken: { increment: 1 } },
  });
}

export function revogarConsentimento(id: number) {
  return prisma.usuario.update({
    where: { id },
    data: {
      consentimentoRevogadoEm: new Date(),
      versaoToken: { increment: 1 },
    },
  });
}

export function buscarComDadosAcademicos(id: number) {
  return prisma.usuario.findUnique({
    where: { id },
    select: {
      nome: true,
      email: true,
      criadoEm: true,
      consentimentoEm: true,
      consentimentoVersao: true,
      disciplinas: {
        orderBy: { nome: "asc" },
        select: {
          nome: true,
          professor: true,
          criadoEm: true,
          eventos: {
            orderBy: { data: "asc" },
            select: { titulo: true, tipo: true, data: true, peso: true, status: true },
          },
        },
      },
    },
  });
}

export function remover(id: number) {
  return prisma.usuario.delete({ where: { id } });
}
