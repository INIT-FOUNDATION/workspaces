import express from "express";
import { proxyController } from "../controllers/proxyController";

const proxyRouter = express.Router();

proxyRouter.get("/health", proxyController.healthCheck);

proxyRouter.post("/create", proxyController.createProxy);

proxyRouter.delete("/:sessionId", proxyController.destroyProxy);

export { proxyRouter };
