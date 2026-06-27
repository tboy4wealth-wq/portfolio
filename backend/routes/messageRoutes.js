import express from "express";
import 
{ getMessages, getArchivedMessages, getMessage, markAsRead, archiveMessage, restoreMessage, deleteMessage, getStats} 
from "../controllers/messageControllers.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getMessages);

router.get("/stats", protect, getStats);

router.get("/archived", protect, getArchivedMessages);

router.get("/:id", protect, getMessage);

router.put("/:id/read", protect, markAsRead);

router.put("/:id/archive", protect, archiveMessage);

router.put("/:id/restore", protect, restoreMessage);

router.delete("/:id", protect, deleteMessage);

export default router;