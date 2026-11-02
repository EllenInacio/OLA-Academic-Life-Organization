import "dotenv/config";

function variavelObrigatoria(nome: string) {
  const valor = process.env[nome];

  if (!valor) {
    throw new Error(`${nome} não definida. Copie o arquivo .env.example para .env.`);
  }

  return valor;
}

const chaveCriptografia = variavelObrigatoria("ENCRYPTION_KEY");

if (!/^[0-9a-fA-F]{64}$/.test(chaveCriptografia)) {
  throw new Error("ENCRYPTION_KEY deve ter 64 caracteres hexadecimais (32 bytes).");
}

export const JWT_SECRET = variavelObrigatoria("JWT_SECRET");
export const JWT_EXPIRA_EM = process.env.JWT_EXPIRES_IN || "1h";
export const CHAVE_CRIPTOGRAFIA = Buffer.from(chaveCriptografia, "hex");
