import { Router } from "express";
import * as authController from "../controllers/authController";
import {
  cadastroRules,
  loginRules,
  enviarCodigo2faRules,
  verificar2faRules,
  solicitarRecuperacaoRules,
  verificarRecuperacaoRules,
  redefinirSenhaRules,
} from "../validators/authValidator";
import { validate } from "../middlewares/validate";
import { autenticar } from "../middlewares/autenticacao";
import {
  loginLimiter,
  verificacao2faLimiter,
  envioCodigo2faLimiter,
  solicitacaoRecuperacaoLimiter,
  recuperacaoLimiter,
} from "../middlewares/seguranca";

const router = Router();

router.post("/cadastro", ...cadastroRules, validate, authController.cadastrar);
router.post("/login", loginLimiter, ...loginRules, validate, authController.login);
router.post(
  "/2fa/enviar-codigo",
  envioCodigo2faLimiter,
  ...enviarCodigo2faRules,
  validate,
  authController.enviarCodigo2fa
);
router.post(
  "/2fa/verificar",
  verificacao2faLimiter,
  ...verificar2faRules,
  validate,
  authController.verificar2fa
);
router.post("/logout", autenticar, authController.logout);

router.post(
  "/recuperacao/solicitar",
  solicitacaoRecuperacaoLimiter,
  ...solicitarRecuperacaoRules,
  validate,
  authController.solicitarRecuperacao
);
router.post(
  "/recuperacao/verificar",
  recuperacaoLimiter,
  ...verificarRecuperacaoRules,
  validate,
  authController.verificarRecuperacao
);
router.post(
  "/recuperacao/redefinir",
  recuperacaoLimiter,
  ...redefinirSenhaRules,
  validate,
  authController.redefinirSenha
);

export default router;
