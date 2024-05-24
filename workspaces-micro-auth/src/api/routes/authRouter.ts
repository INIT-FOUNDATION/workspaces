
import express from "express";
import { authController } from "../controllers/authController";

const authRouter = express.Router();

authRouter.get("/health", authController.healthCheck);

authRouter.post("/client", authController.createClient);

authRouter.post("/token", authController.generateToken);

authRouter.delete("/client/:clientId", authController.deleteClientById);

authRouter.get("/client/:clientId", authController.getClientById);

authRouter.put("/client/:clientId", authController.updateClientById);

export { authRouter };
