import { Router } from "express";
import disciplinaRoutes from "./disciplinaRoutes";
import eventoRoutes from "./eventoRoutes";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/disciplinas", disciplinaRoutes);
router.use("/eventos", eventoRoutes);

export default router;
