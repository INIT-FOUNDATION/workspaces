
import express from "express";
import { sessionsController } from "../controllers/sessionsController";
import { clientMiddleware } from "../middleware/clientMiddleware";
import { sessionsMiddleware } from "../middleware/sessionsMiddleware";

const sessionsRouter = express.Router();

sessionsRouter.get("/health", sessionsController.healthCheck);

sessionsRouter.get("/proxyDetails", sessionsMiddleware);

sessionsRouter.post("/create", clientMiddleware, sessionsController.createSession);

sessionsRouter.get("/list", clientMiddleware, sessionsController.listSessionsByClientId);

sessionsRouter.get("/:sessionId", clientMiddleware, sessionsController.getSession);

sessionsRouter.put("/setPermissions", clientMiddleware, sessionsController.setPermissions);

sessionsRouter.delete("/:sessionId", clientMiddleware, sessionsController.destroySession);

sessionsRouter.get("/access/:participantId/:sessionId", sessionsController.getAccessByParticipantIdAndSessionId);

export { sessionsRouter };
