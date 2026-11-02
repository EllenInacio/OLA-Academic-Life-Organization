import { Router } from "express";
import * as lgpdController from "../controllers/lgpdController";
import { autenticar } from "../middlewares/autenticacao";
import { lgpdLimiter } from "../middlewares/seguranca";

const router = Router();

router.use(autenticar, lgpdLimiter);

router.get("/dados", lgpdController.consultarDados);
router.get("/exportar", lgpdController.exportar);
router.get("/logs", lgpdController.listarLogs);
router.post("/revogar-consentimento", lgpdController.revogarConsentimento);
router.delete("/conta", lgpdController.excluirConta);

export default router;
