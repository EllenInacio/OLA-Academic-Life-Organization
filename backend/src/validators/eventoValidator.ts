import { body, param } from "express-validator";
import { TIPOS_EVENTO, STATUS_EVENTO, LIMITE_NOTA, NOTA_MAXIMA_PADRAO } from "../types/evento";

export const idRules = [
  param("id").isInt({ min: 1 }).withMessage("Id inválido."),
];

export const criarEventoRules = [
  body("titulo")
    .trim()
    .notEmpty()
    .withMessage("O título é obrigatório.")
    .isLength({ max: 150 })
    .withMessage("O título deve ter no máximo 150 caracteres."),

  body("tipo")
    .isIn(TIPOS_EVENTO)
    .withMessage("Tipo inválido. Use PROVA, TRABALHO ou ENTREGA."),

  body("data")
    .isISO8601()
    .withMessage("A data deve estar no formato AAAA-MM-DD."),

  body("peso")
    .isFloat({ min: 0, max: 999.99 })
    .withMessage("O peso deve ser um número maior ou igual a zero.")
    .toFloat(),

  body("status")
    .optional()
    .isIn(STATUS_EVENTO)
    .withMessage("Status inválido."),

  body("disciplinaId")
    .isInt({ min: 1 })
    .withMessage("Informe uma disciplina válida.")
    .toInt(),
];

const notaMaximaRule = body("notaMaxima")
  .optional()
  .isFloat({ gt: 0, max: LIMITE_NOTA })
  .withMessage(`A nota máxima deve ser maior que 0 e até ${LIMITE_NOTA}.`)
  .toFloat();

function notaRule(obrigatoria: boolean) {
  const campo = body("nota");
  return (obrigatoria ? campo : campo.optional({ values: "null" }))
    .isFloat({ min: 0, max: LIMITE_NOTA })
    .withMessage("A nota deve ser um número maior ou igual a zero.")
    .bail()
    .toFloat();
}

export const criarEventoComNotaRules = [
  ...criarEventoRules,
  notaMaximaRule,
  notaRule(false)
    .custom((nota, { req }) => nota <= (req.body.notaMaxima ?? NOTA_MAXIMA_PADRAO))
    .withMessage("A nota não pode ser maior que a nota máxima."),
];

export const atualizarEventoRules = [...idRules, ...criarEventoRules];
export const lancarNotaRules = [...idRules, notaMaximaRule, notaRule(true)];
