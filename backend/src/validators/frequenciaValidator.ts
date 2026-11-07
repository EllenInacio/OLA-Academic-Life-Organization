import { body, param } from "express-validator";
import { idRules } from "./eventoValidator";
import { MAXIMO_AULAS_POR_DIA } from "../types/frequencia";

const camposRules = [
  body("data")
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("A data deve estar no formato AAAA-MM-DD.")
    .bail()
    .isISO8601({ strict: true })
    .withMessage("Data inválida."),

  body("quantidadeAulas")
    .optional()
    .isInt({ min: 1, max: MAXIMO_AULAS_POR_DIA })
    .withMessage(`A quantidade de aulas deve ser um número inteiro entre 1 e ${MAXIMO_AULAS_POR_DIA}.`)
    .toInt(),

  body("faltas")
    .isInt({ min: 0, max: MAXIMO_AULAS_POR_DIA })
    .withMessage("Informe o número de faltas (0 se esteve presente).")
    .bail()
    .toInt()
    .custom((faltas, { req }) => faltas <= (req.body.quantidadeAulas ?? 1))
    .withMessage("O número de faltas não pode ser maior que a quantidade de aulas do dia."),
];

export const criarFrequenciaRules = [
  param("id").isInt({ min: 1 }).withMessage("Id inválido."),
  ...camposRules,
];

export const atualizarFrequenciaRules = [...idRules, ...camposRules];
