import { CACHE_TTL, loggerUtils, mongoUtils, redisUtils } from "workspaces-micro-commons";
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
      const key = `IMAGE|ID:${imageId}`;
      const cachedData = await redisUtils.getKey(key);
      if (cachedData) {
        return JSON.parse(cachedData);
      }

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
      redisUtils.setKey(key, JSON.stringify(images), CACHE_TTL.ONE_DAY);
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
      const key = `IMAGES|CLIENT:${clientId}`;
      const cachedData = await redisUtils.getKey(key);
      if (cachedData) {
        return JSON.parse(cachedData);
      }

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
            clientId: 0
          },
          {}
        );
      redisUtils.setKey(key, JSON.stringify(images), CACHE_TTL.ONE_DAY);
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
          tcpPortRange: imageDetails.tcpPortRange || undefined,
          udpPortRange: imageDetails.udpPortRange || undefined,
          volumeMountPath: imageDetails.volumeMountPath || undefined,
          defaultEnvs: imageDetails.defaultEnvs && imageDetails.defaultEnvs.length > 0 ? imageDetails.defaultEnvs : undefined,
          proxyUrlPath: imageDetails.proxyUrlPath || undefined,
          isActive: imageDetails.isActive != undefined ? imageDetails.isActive : IMAGES_STATUS.ACTIVE,
        }
      );
      redisUtils.delKey(`IMAGE|ID:${imageDetails.imageId}`);
      redisUtils.delKey(`IMAGES|CLIENT:${imageDetails.clientId}`);
    } catch (error) {
      loggerUtils.error(
        `imagesService :: updateImageById :: image Id ${imageDetails.imageId} :: ${error}`
      );
      throw error;
    }
  },
  deleteImageById: async (imageId: string, clientId: string) => {
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
      redisUtils.delKey(`IMAGE|ID:${imageId}`);
      redisUtils.delKey(`IMAGE|CLIENT:${clientId}`);
    } catch (error) {
      loggerUtils.error(
        `imagesService :: deleteImageById :: imageId ${imageId} :: clientId ${clientId}  :: ${error}`
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
