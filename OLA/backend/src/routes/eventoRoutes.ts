import { Router } from "express";
import * as eventoController from "../controllers/eventoController";
import {
  idRules,
  criarEventoRules,
  atualizarEventoRules,
} from "../validators/eventoValidator";
import { validate } from "../middlewares/validate";

const router = Router();

router.get("/", eventoController.listar);
router.get("/:id", ...idRules, validate, eventoController.buscarPorId);
router.post("/", ...criarEventoRules, validate, eventoController.criar);
router.put("/:id", ...atualizarEventoRules, validate, eventoController.atualizar);
router.delete("/:id", ...idRules, validate, eventoController.remover);

export default router;
