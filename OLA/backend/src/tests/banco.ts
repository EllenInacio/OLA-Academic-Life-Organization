import { prisma } from "../config/prisma";

export async function limparBanco() {
  await prisma.evento.deleteMany();
  await prisma.disciplina.deleteMany();
}
