import crypto from "crypto";
import { CHAVE_CRIPTOGRAFIA } from "../config/seguranca";

const ALGORITMO = "aes-256-gcm";

export function criptografar(texto: string): string {
  const iv = crypto.randomBytes(12);
  const cifra = crypto.createCipheriv(ALGORITMO, CHAVE_CRIPTOGRAFIA, iv);
  let cifrado = cifra.update(texto, "utf8", "hex");
  cifrado += cifra.final("hex");
  const authTag = cifra.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${cifrado}`;
}

export function descriptografar(dado: string): string | null {
  try {
    const partes = dado.split(":");
    if (partes.length !== 3) return null;

    const iv = Buffer.from(partes[0], "hex");
    const authTag = Buffer.from(partes[1], "hex");
    const decifra = crypto.createDecipheriv(ALGORITMO, CHAVE_CRIPTOGRAFIA, iv);
    decifra.setAuthTag(authTag);

    let texto = decifra.update(partes[2], "hex", "utf8");
    texto += decifra.final("utf8");
    return texto;
  } catch {
    return null;
  }
}
