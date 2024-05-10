
import { Response } from "express";
import { ERROR_MESSAGES, HTTP_STATUS_CODES, loggerUtils } from "workspaces-micro-commons";;
import { IMAGE_ERROR_RESPONSES } from "../../constants";
import { ImageDetails, IImage } from "../../types/custom";
import { Request } from "../../types/express";
import { Image } from "../../models/imagesModel";
import { imagesService } from "../services";
import { validateImage, validateUpdateImage } from "../../validations";
 
export const imagesController = {
  createImage: async (req: Request, res: Response): Promise<Response> => {
    try {
      const imageDetails: ImageDetails = new Image(req.body);
      
      const { error } = validateImage(imageDetails);

      if (error) {
        if (error.details)
          return res.status(HTTP_STATUS_CODES.BAD_REQUEST).send({
            errorCode: IMAGE_ERROR_RESPONSES.IMAGEERR001,
            errorMessage: error.details[0].message,
          });
        else
          return res.status(HTTP_STATUS_CODES.BAD_REQUEST).send({
            errorCode: IMAGE_ERROR_RESPONSES.IMAGEERR001,
            errorMessage: error.message,
          });
      }

      const imageExists: boolean = await imagesService.imageExistsByName(imageDetails.imageName);

      if (imageExists) {
        return res
          .status(HTTP_STATUS_CODES.BAD_REQUEST)
          .send(IMAGE_ERROR_RESPONSES.IMAGEERR004);
      }

      await imagesService.createImage(imageDetails);

      return res.status(HTTP_STATUS_CODES.OK).send({
        data: { imageId: imageDetails.imageId },
        message: "Image Created Successfully",
      });
    } catch (error) {
      loggerUtils.error(`imagesController :: create :: ${error}`);
      return res
        .status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR)
        .send(IMAGE_ERROR_RESPONSES.IMAGEERR000);
    }
  },
  getImageById: async (req: Request, res: Response): Promise<Response> => {
    try {
      const imageId: string = req.params.imageId;

      if (!imageId) return res
      .status(HTTP_STATUS_CODES.BAD_REQUEST)
      .send(IMAGE_ERROR_RESPONSES.IMAGEERR002);
  
      const images: IImage[] = await imagesService.getImageById(imageId)

      if (images.length == 0) return res
      .status(HTTP_STATUS_CODES.BAD_REQUEST)
      .send(IMAGE_ERROR_RESPONSES.IMAGEERR003);
  
      return res.status(HTTP_STATUS_CODES.OK).send({
        data: { image: images[0] },
        message: `Image Fetched Successfully`,
      });
    } catch (error) {
      loggerUtils.error(`imagesController :: getImageById :: ${error}`);
      return res
        .status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR)
        .send(IMAGE_ERROR_RESPONSES.IMAGEERR000);
    }
  },
  deleteImageById: async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const imageId: string = req.params.imageId;

      if (!imageId) return res
      .status(HTTP_STATUS_CODES.BAD_REQUEST)
      .send(IMAGE_ERROR_RESPONSES.IMAGEERR002);

      const imageExists: boolean = await imagesService.imageExistsById(imageId)

      if (!imageExists) return res
      .status(HTTP_STATUS_CODES.BAD_REQUEST)
      .send(IMAGE_ERROR_RESPONSES.IMAGEERR003);
  
      await imagesService.deleteImageById(imageId);
  
      return res.status(HTTP_STATUS_CODES.OK).send({
        data: { imageId },
        message: "Image Deleted Successfully",
      });
    } catch (error) {
      loggerUtils.error(`imagesController :: deleteImageById :: ${error}`);
      return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).send({
        data: null,
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  },
  updateImageById: async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const imageDetails: ImageDetails = req.body;
      imageDetails.imageId = req.params.imageId;

      const { error } = validateUpdateImage(imageDetails);
  
      if (error) {
        if (error.details)
          return res.status(HTTP_STATUS_CODES.BAD_REQUEST).send({
            errorCode: IMAGE_ERROR_RESPONSES.IMAGEERR001.errorCode,
            errorMessage: error.details[0].message,
          });
        else
          return res.status(HTTP_STATUS_CODES.BAD_REQUEST).send({
            errorCode: IMAGE_ERROR_RESPONSES.IMAGEERR001.errorCode,
            errorMessage: error.message,
          });
      }

      const imageExistsById: boolean = await imagesService.imageExistsById(imageDetails.imageId)

      if (!imageExistsById) return res
      .status(HTTP_STATUS_CODES.BAD_REQUEST)
      .send(IMAGE_ERROR_RESPONSES.IMAGEERR003);

      const imageExistsByName: boolean = await imagesService.imageExistsByName(imageDetails.imageName);

      if (imageExistsByName) {
        return res
          .status(HTTP_STATUS_CODES.BAD_REQUEST)
          .send(IMAGE_ERROR_RESPONSES.IMAGEERR006);
      }
  
      await imagesService.updateImageById(imageDetails);
  
      return res.status(HTTP_STATUS_CODES.OK).send({
        data: { imageId: imageDetails.imageId },
        message: "Image Updated Successfully",
      });
    } catch (error) {
      loggerUtils.error(`imagesController :: updateImageById :: ${error}`);
      return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).send({
        data: null,
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  },
  listImages: async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const images: IImage[] = await imagesService.listImages()

      if (images.length == 0) return res
      .status(HTTP_STATUS_CODES.OK)
      .send({
        data: { images },
        message: "No Images found!",
      });
    
      return res.status(HTTP_STATUS_CODES.OK).send({
        data: { images },
        message: "Images Fetched Successfully",
      });
    } catch (error) {
      loggerUtils.error(`imagesController :: listImages :: ${error}`);
      return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).send({
        data: null,
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  },
}
