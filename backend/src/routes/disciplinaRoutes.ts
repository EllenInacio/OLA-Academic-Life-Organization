import { Router } from "express";
import * as disciplinaController from "../controllers/disciplinaController";
import { criarDisciplinaRules } from "../validators/disciplinaValidator";
import { validate } from "../middlewares/validate";

const router = Router();

router.get("/", disciplinaController.listar);
router.post("/", ...criarDisciplinaRules, validate, disciplinaController.criar);

export default router;
