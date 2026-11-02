import speakeasy from "speakeasy";
import * as usuarioModel from "../models/usuarioModel";
import { criptografar } from "../utils/criptografia";
import { gerarHashSenha } from "../utils/senha";
import { gerarToken } from "../utils/token";
import { VERSAO_TERMOS } from "../types/lgpd";

export const SENHA_DE_TESTE = "SenhaDeTeste123";

export async function criarUsuarioDeTeste(email = "aluna@example.com") {
  const segredo = speakeasy.generateSecret();

  const usuario = await usuarioModel.criar({
    nome: "Aluna Teste",
    email,
    senhaHash: await gerarHashSenha(SENHA_DE_TESTE),
    segredo2fa: criptografar(segredo.base32),
    consentimentoVersao: VERSAO_TERMOS,
  });

  const token = gerarToken(usuario.id, "acesso", "1h", usuario.versaoToken);

  return {
    usuario,
    segredo: segredo.base32,
    autorizacao: { Authorization: `Bearer ${token}` },
  };
}
