import { loggerUtils, mongoUtils } from "workspaces-micro-commons";
import { ImageDetails, IImage } from "../../types/custom";
import { ImageModel } from "../../models/imagesModel";
import { IMAGES_STATUS } from "../../constants";

export const imagesService = {
  createImage: async (imageDetails: ImageDetails) => {
    try {
      const imageObj: Partial<IImage> = imageDetails;
      await mongoUtils.insertDocument<IImage>(ImageModel, imageObj);
    } catch (error) {
      loggerUtils.error(
        `imagesService :: createImage :: imageObj ${imageDetails} :: ${error}`
      );
      throw error;
    }
  },
  getImageById: async (imageId: string): Promise<IImage[]> => {
    try {
      const images: IImage[] =
        await mongoUtils.findDocumentsWithOptions<IImage>(
          ImageModel,
          {
            imageId,
            isActive: IMAGES_STATUS.ACTIVE,
          },
          {
            _id: 0,
            __v: 0,
            createdAt: 0,
            updatedAt: 0,
            isActive: 0,
          },
          {}
        );
      return images;
    } catch (error) {
      loggerUtils.error(
        `imagesService :: getImageById :: imageId ${imageId} :: ${error}`
      );
      throw error;
    }
  },
  imageExistsById: async (imageId: string): Promise<boolean> => {
    try {
      const exists: boolean = await mongoUtils.existsDocument<IImage>(
        ImageModel,
        {
          imageId,
          isActive: IMAGES_STATUS.ACTIVE,
        }
      );
      return exists;
    } catch (error) {
      loggerUtils.error(
        `imagesService :: imageExistsById :: imageId ${imageId} :: ${error}`
      );
      throw error;
    }
  },
  imageExistsByName: async (
    imageName: string,
    clientId: string
  ): Promise<boolean> => {
    try {
      const exists: boolean = await mongoUtils.existsDocument<IImage>(
        ImageModel,
        {
          imageName,
          clientId,
          isActive: IMAGES_STATUS.ACTIVE,
        }
      );
      return exists;
    } catch (error) {
      loggerUtils.error(
        `imagesService :: imageExistsById :: imageName ${imageName} :: ${error}`
      );
      throw error;
    }
  },
  listImages: async (clientId: string): Promise<IImage[]> => {
    try {
      const images: IImage[] =
        await mongoUtils.findDocumentsWithOptions<IImage>(
          ImageModel,
          {
            isActive: IMAGES_STATUS.ACTIVE,
            clientId,
          },
          {
            _id: 0,
            __v: 0,
            createdAt: 0,
            updatedAt: 0,
            isActive: 0,
          },
          {}
        );
      return images;
    } catch (error) {
      loggerUtils.error(`imagesService :: listImages :: ${error}`);
      throw error;
    }
  },
  updateImageById: async (imageDetails: ImageDetails) => {
    try {
      await mongoUtils.updateDocuments<IImage>(
        ImageModel,
        {
          imageId: imageDetails.imageId,
        },
        {
          imageName: imageDetails.imageName || undefined,
          imageRepo: imageDetails.imageRepo || undefined,
          imageTag: imageDetails.imageTag || undefined,
          registryHost: imageDetails.registryHost,
          registryUsername: imageDetails.registryUsername,
          registryPassword: imageDetails.registryPassword,
          isActive: imageDetails.isActive || IMAGES_STATUS.ACTIVE,
        }
      );
    } catch (error) {
      loggerUtils.error(
        `imagesService :: updateImageById :: image Id ${imageDetails.imageId} :: ${error}`
      );
      throw error;
    }
  },
  deleteImageById: async (imageId: string) => {
    try {
      await mongoUtils.updateDocuments<IImage>(
        ImageModel,
        {
          imageId,
        },
        {
          isActive: IMAGES_STATUS.INACTIVE,
        }
      );
    } catch (error) {
      loggerUtils.error(
        `imagesService :: deleteImageById :: image Id ${imageId} :: ${error}`
      );
      throw error;
    }
  },
  getImageByName: async (imageName: string, clientId: string) => {
    try {
      const images: IImage[] =
        await mongoUtils.findDocumentsWithOptions<IImage>(
          ImageModel,
          {
            imageName,
            clientId,
            isActive: IMAGES_STATUS.ACTIVE,
          },
          {
            _id: 0,
            __v: 0,
            createdAt: 0,
            updatedAt: 0,
            isActive: 0,
          },
          {}
        );
      return images;
    } catch (error) {
      loggerUtils.error(
        `imagesService :: getImageByName :: imageName ${imageName} :: ${error}`
      );
      throw error;
    }
  },
};
