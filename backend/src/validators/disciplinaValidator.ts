import { body, query } from "express-validator";
import { idRules } from "./eventoValidator";
import { CARGA_HORARIA_MAXIMA, FORMATO_SEMESTRE } from "../types/disciplina";

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

  body("semestre")
    .optional({ values: "falsy" })
    .trim()
    .matches(FORMATO_SEMESTRE)
    .withMessage("Informe o semestre no formato AAAA.N (ex.: 2026.2)."),

  body("cargaHoraria")
    .optional({ values: "null" })
    .isInt({ min: 1, max: CARGA_HORARIA_MAXIMA })
    .withMessage(
      `A carga horária deve ser um número inteiro de horas entre 1 e ${CARGA_HORARIA_MAXIMA}.`
    )
    .toInt(),

  body("horario")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 120 })
    .withMessage("O horário deve ter no máximo 120 caracteres."),
];

export const atualizarDisciplinaRules = [...idRules, ...criarDisciplinaRules];

export const removerDisciplinaRules = [
  ...idRules,
  query("confirmar")
    .optional()
    .isIn(["true", "false"])
    .withMessage("O parâmetro confirmar deve ser true ou false."),
];
