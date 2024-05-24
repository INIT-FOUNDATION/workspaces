
import express from "express";
import { sessionsController } from "../controllers/sessionsController";
import { clientMiddleware } from "../middleware/clientMiddleware";

const sessionsRouter = express.Router();

sessionsRouter.get("/health", sessionsController.healthCheck);

sessionsRouter.post("/create", clientMiddleware, sessionsController.createSession);

sessionsRouter.get("/list", clientMiddleware, sessionsController.listSessionsByClientId);

sessionsRouter.get("/:sessionId", clientMiddleware, sessionsController.getSession);

sessionsRouter.put("/setPermissions", clientMiddleware, sessionsController.setPermissions);

sessionsRouter.delete("/:sessionId", clientMiddleware, sessionsController.destroySession);

export { sessionsRouter };
