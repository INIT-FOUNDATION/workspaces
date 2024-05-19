import express from "express";
import { imagesController } from "../controllers/imagesController";
import { clientMiddleware } from "../middleware/clientMiddleware";

const imagesRouter = express.Router();

imagesRouter.post("/create", clientMiddleware, imagesController.createImage);

imagesRouter.get("/list", clientMiddleware, imagesController.listImages);

imagesRouter.get("/:imageId", clientMiddleware, imagesController.getImageById);

imagesRouter.put(
  "/:imageId",
  clientMiddleware,
  imagesController.updateImageById
);

imagesRouter.delete(
  "/:imageId",
  clientMiddleware,
  imagesController.deleteImageById
);

export { imagesRouter };
