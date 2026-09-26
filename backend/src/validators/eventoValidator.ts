import { body, param } from "express-validator";
import { TIPOS_EVENTO, STATUS_EVENTO } from "../types/evento";

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

export const atualizarEventoRules = [...idRules, ...criarEventoRules];
