import { criptografar, descriptografar } from "../utils/criptografia";
import { codigoConfere, gerarCodigo, hashCodigo } from "../utils/codigo";
import { gerarHashSenha, senhaConfere } from "../utils/senha";
import { gerarToken, lerToken } from "../utils/token";

describe("Utilitários de segurança", () => {
  it("criptografa e descriptografa com AES-256-GCM", () => {
    const cifrado = criptografar("SEGREDO2FA");

    expect(cifrado).not.toContain("SEGREDO2FA");
    expect(descriptografar(cifrado)).toBe("SEGREDO2FA");
  });

  it("detecta dado criptografado adulterado", () => {
    const [iv, tag, dado] = criptografar("SEGREDO2FA").split(":");
    const adulterado = `${iv}:${tag}:${dado.slice(0, -2)}00`;

    expect(descriptografar(adulterado)).toBeNull();
    expect(descriptografar("formato-invalido")).toBeNull();
  });

  it("gera códigos de 6 dígitos e compara pelo hash", () => {
    const codigo = gerarCodigo();

    expect(codigo).toMatch(/^\d{6}$/);
    expect(codigoConfere(codigo, hashCodigo(codigo))).toBe(true);
    expect(codigoConfere("abcdef", hashCodigo(codigo))).toBe(false);
  });

  it("gera hash Argon2id com salt único e valida a senha", async () => {
    const hash1 = await gerarHashSenha("MinhaSenha123");
    const hash2 = await gerarHashSenha("MinhaSenha123");

    expect(hash1).toMatch(/^\$argon2id\$v=19\$m=65536,t=3,p=1\$/);
    expect(hash1).not.toBe(hash2);
    expect(await senhaConfere(hash1, "MinhaSenha123")).toBe(true);
    expect(await senhaConfere(hash1, "outraSenha")).toBe(false);
    expect(await senhaConfere("hash-invalido", "MinhaSenha123")).toBe(false);
  });

  it("só aceita o token do tipo esperado", () => {
    const token = gerarToken(7, "2fa", "5m");

    expect(lerToken(token, "2fa")).toEqual({ usuarioId: 7, versao: undefined });
    expect(lerToken(token, "acesso")).toBeNull();
    expect(lerToken(`${token}x`, "2fa")).toBeNull();
  });
});
