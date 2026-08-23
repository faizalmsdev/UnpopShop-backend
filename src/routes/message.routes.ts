import { Router } from "express";
import { listThreads, getThread, sendMessage } from "../controllers/message.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/threads", listThreads);
router.get("/thread", getThread);
router.post("/", sendMessage);

export default router;
