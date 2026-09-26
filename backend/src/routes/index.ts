import { Router } from "express";
import authRoutes from "./authRoutes";
import lgpdRoutes from "./lgpdRoutes";
import disciplinaRoutes from "./disciplinaRoutes";
import eventoRoutes from "./eventoRoutes";
import { autenticar } from "../middlewares/autenticacao";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/auth", authRoutes);
router.use("/lgpd", lgpdRoutes);
router.use("/disciplinas", autenticar, disciplinaRoutes);
router.use("/eventos", autenticar, eventoRoutes);

export default router;
