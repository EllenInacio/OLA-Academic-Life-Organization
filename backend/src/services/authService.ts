import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { AppError } from "../errors/AppError";
import * as usuarioModel from "../models/usuarioModel";
import * as auditoriaService from "./auditoriaService";
import * as emailService from "./emailService";
import { JWT_EXPIRA_EM } from "../config/seguranca";
import { criptografar, descriptografar } from "../utils/criptografia";
import { gerarHashSenha, senhaConfere } from "../utils/senha";
import { calcularExpiracaoCodigo, codigoConfere, gerarCodigo, hashCodigo } from "../utils/codigo";
import { gerarToken, lerToken } from "../utils/token";
import { VERSAO_TERMOS } from "../types/lgpd";

const VALIDADE_ETAPA_2FA = "15m";

type DadosCadastro = { nome: string; email: string; senha: string };
type DadosLogin = { email: string; senha: string };
type DadosVerificacao = { tokenTemporario: string; codigo: string; metodo?: "app" | "email" };

export async function cadastrar(dados: DadosCadastro, ip?: string) {
  const existente = await usuarioModel.buscarPorEmail(dados.email);

  if (existente) {
    throw new AppError("Este e-mail já possui uma conta cadastrada.", 409);
  }

  const segredo = speakeasy.generateSecret({ name: `OLA (${dados.email})` });

  const usuario = await usuarioModel.criar({
    nome: dados.nome,
    email: dados.email,
    senhaHash: await gerarHashSenha(dados.senha),
    segredo2fa: criptografar(segredo.base32),
    consentimentoVersao: VERSAO_TERMOS,
  });

  const qrCode = await qrcode.toDataURL(segredo.otpauth_url!);

  void emailService.enviarBoasVindas(usuario.email, usuario.nome);

  await auditoriaService.registrar("CADASTRO", {
    usuarioId: usuario.id,
    entidade: "usuario",
    entidadeId: usuario.id,
    detalhe: `Conta criada com aceite dos termos (versão ${VERSAO_TERMOS})`,
    ip,
  });

  return { qrCode };
}

export async function login(dados: DadosLogin, ip?: string) {
  const usuario = await usuarioModel.buscarPorEmail(dados.email);

  if (!usuario || !(await senhaConfere(usuario.senhaHash, dados.senha))) {
    await auditoriaService.registrar("LOGIN_FALHA", {
      usuarioId: usuario?.id,
      detalhe: usuario ? "Senha incorreta" : "E-mail não cadastrado",
      ip,
    });
    throw new AppError("E-mail ou senha incorretos. Verifique os dados e tente novamente.", 401);
  }

  if (usuario.consentimentoRevogadoEm) {
    await auditoriaService.registrar("LOGIN_FALHA", {
      usuarioId: usuario.id,
      detalhe: "Tentativa de acesso após revogação do consentimento",
      ip,
    });
    throw new AppError(
      "O consentimento de uso dos dados desta conta foi revogado. Os dados estão marcados para exclusão.",
      403
    );
  }

  await auditoriaService.registrar("LOGIN_SENHA_VALIDA", {
    usuarioId: usuario.id,
    detalhe: "Senha validada — aguardando verificação em duas etapas",
    ip,
  });

  return { tokenTemporario: gerarToken(usuario.id, "2fa", VALIDADE_ETAPA_2FA) };
}

async function usuarioDaEtapa2fa(tokenTemporario: string) {
  const dados = lerToken(tokenTemporario, "2fa");
  const usuario = dados ? await usuarioModel.buscarPorId(dados.usuarioId) : null;

  if (!usuario) {
    throw new AppError("Sua sessão de login expirou. Faça login novamente.", 401);
  }

  return usuario;
}

export async function enviarCodigo2fa(tokenTemporario: string) {
  const usuario = await usuarioDaEtapa2fa(tokenTemporario);
  const codigo = gerarCodigo();

  await usuarioModel.salvarCodigo2fa(usuario.id, hashCodigo(codigo), calcularExpiracaoCodigo());
  void emailService.enviarCodigo2fa(usuario.email, usuario.nome, codigo);
}

export async function verificar2fa(dados: DadosVerificacao, ip?: string) {
  const usuario = await usuarioDaEtapa2fa(dados.tokenTemporario);
  const porEmail = dados.metodo === "email";

  if (porEmail) {
    if (!usuario.codigo2faHash || !usuario.codigo2faExpiraEm) {
      throw new AppError('Nenhum código foi enviado. Clique em "Enviar código" primeiro.', 400);
    }

    if (usuario.codigo2faExpiraEm < new Date()) {
      throw new AppError('Código expirado. Clique em "Enviar código" para receber um novo.', 401);
    }

    if (!codigoConfere(dados.codigo, usuario.codigo2faHash)) {
      await auditoriaService.registrar("LOGIN_2FA_FALHA", {
        usuarioId: usuario.id,
        detalhe: "Código enviado por e-mail inválido",
        ip,
      });
      throw new AppError("Código incorreto. Verifique o e-mail e tente novamente.", 401);
    }

    await usuarioModel.salvarCodigo2fa(usuario.id, null, null);
  } else {
    const segredo = descriptografar(usuario.segredo2fa);

    if (!segredo) {
      throw new AppError("Não foi possível validar o código. Tente novamente em instantes.", 500);
    }

    const valido = speakeasy.totp.verify({
      secret: segredo,
      encoding: "base32",
      token: dados.codigo,
      window: 1,
    });

    if (!valido) {
      await auditoriaService.registrar("LOGIN_2FA_FALHA", {
        usuarioId: usuario.id,
        detalhe: "Código do aplicativo autenticador inválido",
        ip,
      });
      throw new AppError(
        "Código incorreto. Verifique o aplicativo autenticador e tente novamente.",
        401
      );
    }
  }

  await auditoriaService.registrar("LOGIN_SUCESSO", {
    usuarioId: usuario.id,
    detalhe: `Login concluído com verificação por ${porEmail ? "e-mail" : "aplicativo autenticador"}`,
    ip,
  });

  return {
    token: gerarToken(usuario.id, "acesso", JWT_EXPIRA_EM, usuario.versaoToken),
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
  };
}

export async function logout(usuarioId: number, ip?: string) {
  await usuarioModel.encerrarSessoes(usuarioId);
  await auditoriaService.registrar("LOGOUT", {
    usuarioId,
    detalhe: "Sessão encerrada pelo usuário",
    ip,
  });
}
