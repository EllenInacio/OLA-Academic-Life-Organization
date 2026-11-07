import { body, query } from "express-validator";
import { idRules } from "./eventoValidator";
import {
  CARGA_HORARIA_MAXIMA,
  FORMATO_DATA_AULAS,
  FORMATO_SEMESTRE,
  REGRAS_MEDIA,
} from "../types/disciplina";

const MENSAGEM_DATA_AULAS = "As datas do período das aulas devem estar no formato AAAA-MM-DD.";

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

  body("inicioAulas")
    .optional({ values: "falsy" })
    .trim()
    .matches(FORMATO_DATA_AULAS)
    .withMessage(MENSAGEM_DATA_AULAS)
    .bail()
    .isISO8601({ strict: true })
    .withMessage(MENSAGEM_DATA_AULAS),

  body("fimAulas")
    .optional({ values: "falsy" })
    .trim()
    .matches(FORMATO_DATA_AULAS)
    .withMessage(MENSAGEM_DATA_AULAS)
    .bail()
    .isISO8601({ strict: true })
    .withMessage(MENSAGEM_DATA_AULAS)
    .bail()
    .custom((fim: string, { req }) => {
      const inicio = req.body.inicioAulas;
      if (typeof inicio === "string" && FORMATO_DATA_AULAS.test(inicio.trim()) && fim < inicio.trim()) {
        throw new Error("A data final das aulas não pode ser anterior à data inicial.");
      }
      return true;
    }),

  body("regraMedia")
    .optional()
    .isIn(REGRAS_MEDIA)
    .withMessage("Regra da média inválida. Use PONDERADA ou ARITMETICA."),

  body("mediaAprovacao")
    .optional({ values: "null" })
    .isFloat({ min: 0, max: 10 })
    .withMessage("A média de aprovação deve ser um número entre 0 e 10.")
    .toFloat(),

  body("limiteFaltas")
    .optional()
    .isFloat({ gt: 0, max: 100 })
    .withMessage("O limite de faltas deve ser um percentual maior que 0 e até 100.")
    .toFloat(),
];

export const atualizarDisciplinaRules = [...idRules, ...criarDisciplinaRules];

export const removerDisciplinaRules = [
  ...idRules,
  query("confirmar")
    .optional()
    .isIn(["true", "false"])
    .withMessage("O parâmetro confirmar deve ser true ou false."),
];
