
import express from "express";
import { agentsController } from "../controllers/agentsController";
import { clientMiddleware } from "../middleware/clientMiddleware";

const agentsRouter = express.Router();

agentsRouter.post("/create", clientMiddleware, agentsController.createAgent);

agentsRouter.get("/list", clientMiddleware, agentsController.listAgentsByClientId);

agentsRouter.get("/:agentId", clientMiddleware, agentsController.getAgentById);

agentsRouter.put("/:agentId", clientMiddleware, agentsController.updateAgentById);

agentsRouter.delete("/:agentId", clientMiddleware, agentsController.deleteAgentById);

export { agentsRouter };
