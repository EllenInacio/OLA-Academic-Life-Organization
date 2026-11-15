import { body, query } from "express-validator";
import { idRules } from "./eventoValidator";
import {
  FORMATO_DATA_AULAS,
  LIMITE_FALTAS_MAXIMO,
  PERIODO_NUMERO_MAXIMO,
  PESO_ETAPA_MAXIMO,
  REGRAS_MEDIA,
  TIPOS_PERIODO,
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

  body("periodoTipo")
    .optional({ values: "null" })
    .isIn(TIPOS_PERIODO)
    .withMessage("Período acadêmico inválido. Escolha um semestre ou Exame/Recuperação.")
    .bail()
    .custom((tipo, { req }) => tipo !== "SEMESTRE" || (req.body.periodoNumero ?? null) !== null)
    .withMessage("Informe qual é o semestre do período acadêmico."),

  body("periodoNumero")
    .optional({ values: "null" })
    .isInt({ min: 1, max: PERIODO_NUMERO_MAXIMO })
    .withMessage(
      `O semestre do período acadêmico deve ser um número inteiro entre 1 e ${PERIODO_NUMERO_MAXIMO}.`
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

  body(["pesoM1", "pesoM2"])
    .optional()
    .isFloat({ gt: 0, max: PESO_ETAPA_MAXIMO })
    .withMessage(`O peso da M1 e o peso da M2 devem ser números maiores que 0 e até ${PESO_ETAPA_MAXIMO}.`)
    .toFloat(),

  body("limiteFaltas")
    .optional({ values: "null" })
    .isInt({ min: 0, max: LIMITE_FALTAS_MAXIMO })
    .withMessage(
      `O limite de faltas deve ser a quantidade de faltas permitidas: um número inteiro entre 0 e ${LIMITE_FALTAS_MAXIMO}.`
    )
    .toInt(),
];

export const atualizarDisciplinaRules = [...idRules, ...criarDisciplinaRules];

export const removerDisciplinaRules = [
  ...idRules,
  query("confirmar")
    .optional()
    .isIn(["true", "false"])
    .withMessage("O parâmetro confirmar deve ser true ou false."),
];
