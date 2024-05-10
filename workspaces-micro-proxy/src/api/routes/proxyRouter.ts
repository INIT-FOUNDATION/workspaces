
import express from "express";
import { proxyController } from "../controllers/proxyController";

const proxyRouter = express.Router();

proxyRouter.post("/create", proxyController.createProxy);

proxyRouter.get("/:sessionId/:participantId", proxyController.joinProxy);

proxyRouter.delete("/:sessionId", proxyController.destroyProxy);

export { proxyRouter };
