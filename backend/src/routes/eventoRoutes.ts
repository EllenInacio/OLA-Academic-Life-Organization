import { Router } from "express";
import * as eventoController from "../controllers/eventoController";
import {
  idRules,
  criarEventoComNotaRules,
  atualizarEventoRules,
  lancarNotaRules,
} from "../validators/eventoValidator";
import { validate } from "../middlewares/validate";

const router = Router();

router.get("/", eventoController.listar);
router.get("/:id", ...idRules, validate, eventoController.buscarPorId);
router.post("/", ...criarEventoComNotaRules, validate, eventoController.criar);
router.put("/:id", ...atualizarEventoRules, validate, eventoController.atualizar);
router.delete("/:id", ...idRules, validate, eventoController.remover);
router.put("/:id/nota", ...lancarNotaRules, validate, eventoController.lancarNota);
router.delete("/:id/nota", ...idRules, validate, eventoController.removerNota);

export default router;
