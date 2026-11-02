import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { JWT_SECRET } from "../config/seguranca";

export type TipoToken = "acesso" | "2fa" | "redefinicao";

export function gerarToken(
  usuarioId: number,
  tipo: TipoToken,
  expiraEm: string,
  versao?: number
) {
  return jwt.sign({ tipo, versao }, JWT_SECRET, {
    subject: String(usuarioId),
    expiresIn: expiraEm as SignOptions["expiresIn"],
    algorithm: "HS256",
  });
}

export function lerToken(token: string, tipoEsperado: TipoToken) {
  try {
    const conteudo = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    }) as JwtPayload;

    if (conteudo.tipo !== tipoEsperado || !conteudo.sub) {
      return null;
    }

    return {
      usuarioId: Number(conteudo.sub),
      versao: conteudo.versao as number | undefined,
    };
  } catch {
    return null;
  }
}
