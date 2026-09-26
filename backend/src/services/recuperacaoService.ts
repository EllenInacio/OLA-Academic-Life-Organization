import { AppError } from "../errors/AppError";
import * as usuarioModel from "../models/usuarioModel";
import * as auditoriaService from "./auditoriaService";
import * as emailService from "./emailService";
import { gerarHashSenha } from "../utils/senha";
import { calcularExpiracaoCodigo, codigoConfere, gerarCodigo, hashCodigo } from "../utils/codigo";
import { gerarToken, lerToken } from "../utils/token";

const VALIDADE_REDEFINICAO = "15m";

export const MENSAGEM_SOLICITACAO =
  "Se o e-mail estiver cadastrado, enviaremos um código de validação. O código expira em 15 minutos.";

export async function solicitar(email: string, ip?: string) {
  const usuario = await usuarioModel.buscarPorEmail(email);

  if (!usuario) {
    await new Promise((resolver) => setTimeout(resolver, 400));
    return;
  }

  const codigo = gerarCodigo();
  await usuarioModel.salvarCodigoRecuperacao(
    usuario.id,
    hashCodigo(codigo),
    calcularExpiracaoCodigo()
  );

  await emailService.enviarCodigoRecuperacao(
  usuario.email,
  usuario.nome,
  codigo
);

  await auditoriaService.registrar("RECUPERACAO_SOLICITADA", {
    usuarioId: usuario.id,
    detalhe: "Código de recuperação gerado e enviado por e-mail",
    ip,
  });
}

export async function verificar(email: string, codigo: string, ip?: string) {
  const usuario = await usuarioModel.buscarPorEmail(email);

  if (!usuario?.codigoRecuperacaoHash || !usuario.codigoRecuperacaoExpiraEm) {
    throw new AppError("Código inválido ou expirado. Solicite um novo código.", 401);
  }

  if (usuario.codigoRecuperacaoExpiraEm < new Date()) {
    await auditoriaService.registrar("RECUPERACAO_FALHA", {
      usuarioId: usuario.id,
      detalhe: "Código de recuperação expirado",
      ip,
    });
    throw new AppError("Código expirado. Solicite um novo código de recuperação.", 401);
  }

  if (!codigoConfere(codigo, usuario.codigoRecuperacaoHash)) {
    await auditoriaService.registrar("RECUPERACAO_FALHA", {
      usuarioId: usuario.id,
      detalhe: "Código de recuperação inválido",
      ip,
    });
    throw new AppError("Código incorreto. Verifique o e-mail e tente novamente.", 401);
  }

  await usuarioModel.salvarCodigoRecuperacao(usuario.id, null, null);

  await auditoriaService.registrar("RECUPERACAO_VERIFICADA", {
    usuarioId: usuario.id,
    detalhe: "Identidade confirmada pelo código enviado ao e-mail",
    ip,
  });

  return {
    tokenRedefinicao: gerarToken(
      usuario.id,
      "redefinicao",
      VALIDADE_REDEFINICAO,
      usuario.versaoToken
    ),
  };
}

export async function redefinir(tokenRedefinicao: string, novaSenha: string, ip?: string) {
  const dados = lerToken(tokenRedefinicao, "redefinicao");
  const usuario = dados ? await usuarioModel.buscarPorId(dados.usuarioId) : null;

  if (!dados || !usuario || dados.versao !== usuario.versaoToken) {
    throw new AppError(
      "Sessão de recuperação inválida ou expirada. Reinicie o processo de redefinição de senha.",
      401
    );
  }

  await usuarioModel.atualizarSenha(usuario.id, await gerarHashSenha(novaSenha));

  await auditoriaService.registrar("RECUPERACAO_CONCLUIDA", {
    usuarioId: usuario.id,
    detalhe: "Senha redefinida pelo fluxo de recuperação",
    ip,
  });
}
