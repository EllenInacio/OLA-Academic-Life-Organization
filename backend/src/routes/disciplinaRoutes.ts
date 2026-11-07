import { Router } from "express";
import * as disciplinaController from "../controllers/disciplinaController";
import {
  criarDisciplinaRules,
  atualizarDisciplinaRules,
  removerDisciplinaRules,
} from "../validators/disciplinaValidator";
import { idRules } from "../validators/eventoValidator";
import { criarFrequenciaRules } from "../validators/frequenciaValidator";
import * as frequenciaController from "../controllers/frequenciaController";
import { validate } from "../middlewares/validate";

const router = Router();

router.get("/", disciplinaController.listar);
router.get("/:id", ...idRules, validate, disciplinaController.buscarPorId);
router.post("/", ...criarDisciplinaRules, validate, disciplinaController.criar);
router.put("/:id", ...atualizarDisciplinaRules, validate, disciplinaController.atualizar);
router.delete("/:id", ...removerDisciplinaRules, validate, disciplinaController.remover);

router.get("/:id/frequencias", ...idRules, validate, frequenciaController.listar);
router.post("/:id/frequencias", ...criarFrequenciaRules, validate, frequenciaController.criar);

export default router;
