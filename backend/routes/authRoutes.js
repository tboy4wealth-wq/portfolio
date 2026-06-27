import express from "express";
import { loginAdmin, getCurrentAdmin } from "../controllers/authControllers.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", loginAdmin);
router.get("/me", protect, getCurrentAdmin);
export default router;