import { Router } from "express";
import * as frequenciaController from "../controllers/frequenciaController";
import { atualizarFrequenciaRules } from "../validators/frequenciaValidator";
import { idRules } from "../validators/eventoValidator";
import { validate } from "../middlewares/validate";

const router = Router();

router.put("/:id", ...atualizarFrequenciaRules, validate, frequenciaController.atualizar);
router.delete("/:id", ...idRules, validate, frequenciaController.remover);

export default router;
