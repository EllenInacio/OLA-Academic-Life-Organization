import { body } from "express-validator";

export const criarDisciplinaRules = [
  body("nome")
    .trim()
    .notEmpty()
    .withMessage("O nome da disciplina é obrigatório.")
    .isLength({ max: 120 })
    .withMessage("O nome deve ter no máximo 120 caracteres."),

  body("professor")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 120 })
    .withMessage("O nome do professor deve ter no máximo 120 caracteres."),
];
