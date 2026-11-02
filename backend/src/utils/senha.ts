import argon2 from "argon2";

const OPCOES_ARGON2 = {
  type: argon2.argon2id,
  memoryCost: 2 ** 16,
  timeCost: 3,
  parallelism: 1,
};

export function gerarHashSenha(senha: string) {
  return argon2.hash(senha, OPCOES_ARGON2);
}

export async function senhaConfere(hash: string, senha: string) {
  try {
    return await argon2.verify(hash, senha);
  } catch {
    return false;
  }
}
