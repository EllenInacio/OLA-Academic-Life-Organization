import { randomUUID } from "crypto";
import speakeasy from "speakeasy";
import request from "supertest";
import app from "../../app";
import { prisma } from "../../config/prisma";
import { descriptografar } from "../../utils/criptografia";
import { dataRelativa } from "../datas";


const usuariosCriados: number[] = [];

export type Autorizacao = Record<string, string>;

export function sufixoUnico() {
  return randomUUID().slice(0, 8);
}

export function nomeUnico(base: string) {
  return `${base} ${sufixoUnico()}`;
}

const SENHA_INTEGRACAO = "SenhaDeIntegracao123";

export async function criarUsuarioIntegracao() {
  const email = `${randomUUID()}@integracao.ola.test`;

  const cadastro = await request(app)
    .post("/api/auth/cadastro")
    .send({ nome: "Aluna Integração", email, senha: SENHA_INTEGRACAO, aceiteTermos: true });
  expect(cadastro.status).toBe(201);

  const usuario = await prisma.usuario.findUniqueOrThrow({ where: { email } });
  usuariosCriados.push(usuario.id);

  const login = await request(app).post("/api/auth/login").send({ email, senha: SENHA_INTEGRACAO });
  expect(login.status).toBe(200);

  const codigo = speakeasy.totp({
    secret: descriptografar(usuario.segredo2fa)!,
    encoding: "base32",
  });
  const sessao = await request(app)
    .post("/api/auth/2fa/verificar")
    .send({ tokenTemporario: login.body.tokenTemporario, codigo, metodo: "app" });
  expect(sessao.status).toBe(200);

  const autorizacao: Autorizacao = { Authorization: `Bearer ${sessao.body.token}` };
  return { usuario, autorizacao };
}

export async function removerUsuariosCriados() {
  const ids = usuariosCriados.splice(0);
  if (ids.length === 0) return;

  await prisma.logAuditoria.deleteMany({ where: { usuarioId: { in: ids } } });
  await prisma.usuario.deleteMany({ where: { id: { in: ids } } });
}

export function dadosDisciplina(sobrescrever: Record<string, unknown> = {}) {
  return {
    nome: nomeUnico("Banco de Dados"),
    professor: "Profa. Helena",
    semestre: "2026.2",
    cargaHoraria: 80,
    horario: "Segundas e quartas, 19h",
    ...sobrescrever,
  };
}

export function dadosEvento(disciplinaId: number, sobrescrever: Record<string, unknown> = {}) {
  return {
    titulo: `Prova de normalização ${sufixoUnico()}`,
    tipo: "PROVA",
    data: dataRelativa(14),
    peso: 3,
    disciplinaId,
    ...sobrescrever,
  };
}

export async function criarDisciplinaPelaApi(
  autorizacao: Autorizacao,
  sobrescrever: Record<string, unknown> = {}
) {
  const resposta = await request(app)
    .post("/api/disciplinas")
    .set(autorizacao)
    .send(dadosDisciplina(sobrescrever));

  expect(resposta.status).toBe(201);
  return resposta.body as { id: number; nome: string };
}

export async function criarEventoPelaApi(
  autorizacao: Autorizacao,
  disciplinaId: number,
  sobrescrever: Record<string, unknown> = {}
) {
  const resposta = await request(app)
    .post("/api/eventos")
    .set(autorizacao)
    .send(dadosEvento(disciplinaId, sobrescrever));

  expect(resposta.status).toBe(201);
  return resposta.body as { id: number; titulo: string };
}

export function acoesDeAuditoria(usuarioId: number) {
  return prisma.logAuditoria
    .findMany({
      where: { usuarioId, entidade: { in: ["disciplina", "evento"] } },
      orderBy: { id: "asc" },
    })
    .then((logs) => logs.map((log) => ({ acao: log.acao, entidadeId: log.entidadeId, detalhe: log.detalhe })));
}
