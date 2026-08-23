import { Router } from "express";
import { registerBuyer, registerManufacturer, login, me } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/register/buyer", registerBuyer);
router.post("/register/manufacturer", registerManufacturer);
router.post("/login", login);
router.get("/me", requireAuth, me);

export default router;
