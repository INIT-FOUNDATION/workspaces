
import express from "express";
import { imagesController } from "../controllers/imagesController";

const imagesRouter = express.Router();

imagesRouter.post("/create", imagesController.createImage);

imagesRouter.get("/list", imagesController.listImages);

imagesRouter.get("/:imageId", imagesController.getImageById);

imagesRouter.put("/:imageId", imagesController.updateImageById);

imagesRouter.delete("/:imageId", imagesController.deleteImageById);

export { imagesRouter };
