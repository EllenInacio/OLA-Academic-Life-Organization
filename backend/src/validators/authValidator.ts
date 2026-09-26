import { body } from "express-validator";

const emailRule = body("email")
  .trim()
  .toLowerCase()
  .isEmail()
  .withMessage("Informe um e-mail válido.")
  .isLength({ max: 160 })
  .withMessage("O e-mail deve ter no máximo 160 caracteres.");

const codigoRule = body("codigo")
  .trim()
  .matches(/^\d{6}$/)
  .withMessage("Digite o código de 6 dígitos.");

function novaSenhaRule(campo: string) {
  return body(campo)
    .isString()
    .withMessage("Informe a senha.")
    .isLength({ min: 8, max: 128 })
    .withMessage("A senha deve ter entre 8 e 128 caracteres.");
}

export const cadastroRules = [
  body("nome")
    .trim()
    .notEmpty()
    .withMessage("Informe o nome de usuário.")
    .isLength({ max: 120 })
    .withMessage("O nome deve ter no máximo 120 caracteres."),

  emailRule,
  novaSenhaRule("senha"),

  body("aceiteTermos")
    .custom((valor) => valor === true)
    .withMessage(
      "É necessário concordar com os Termos de Uso e a Política de Privacidade para criar uma conta."
    ),
];

export const loginRules = [
  emailRule,
  body("senha").isString().notEmpty().withMessage("Informe a senha."),
];

export const enviarCodigo2faRules = [
  body("tokenTemporario")
    .isString()
    .notEmpty()
    .withMessage("Sua sessão de login expirou. Faça login novamente."),
];

export const verificar2faRules = [
  ...enviarCodigo2faRules,
  codigoRule,
  body("metodo")
    .optional()
    .isIn(["app", "email"])
    .withMessage("Método de verificação inválido."),
];

export const solicitarRecuperacaoRules = [emailRule];

export const verificarRecuperacaoRules = [emailRule, codigoRule];

export const redefinirSenhaRules = [
  body("tokenRedefinicao")
    .isString()
    .notEmpty()
    .withMessage("Sessão de recuperação inválida. Reinicie o processo."),
  novaSenhaRule("novaSenha"),
];
