import crypto from "crypto";

export const VALIDADE_CODIGO_MINUTOS = 15;

export function gerarCodigo() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashCodigo(codigo: string) {
  return crypto.createHash("sha256").update(codigo).digest("hex");
}

export function calcularExpiracaoCodigo() {
  return new Date(Date.now() + VALIDADE_CODIGO_MINUTOS * 60 * 1000);
}

export function codigoConfere(codigo: string, hashSalvo: string) {
  const recebido = Buffer.from(hashCodigo(codigo), "hex");
  const esperado = Buffer.from(hashSalvo, "hex");
  return recebido.length === esperado.length && crypto.timingSafeEqual(recebido, esperado);
}
