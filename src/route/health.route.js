import { Router } from "express";
import * as healthController from "../controller/health.controller.js";
const router = Router();

router.get("/", healthController.check);
router.get("/db", healthController.checkDb);
router.get("/redis", healthController.checkRedis);
export default router;
