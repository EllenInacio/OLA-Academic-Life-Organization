import { prisma } from "../config/prisma";

export async function limparBanco() {
  await prisma.logAuditoria.deleteMany();
  await prisma.registroFrequencia.deleteMany();
  await prisma.evento.deleteMany();
  await prisma.disciplina.deleteMany();
  await prisma.usuario.deleteMany();
}
