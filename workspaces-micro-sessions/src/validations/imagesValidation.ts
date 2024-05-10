import Joi from "joi";
import { ImageDetails } from "../types/custom";
import { IMAGES_STATUS } from "../constants";

export const validateImage = (imageDetails: ImageDetails) => {
  const imageDetailsSchema = Joi.object({
    imageId: Joi.string().required(),
    imageName: Joi.string().required(),
    imageRepo: Joi.string().required(),
    imageTag: Joi.string().required(),
    registryHost: Joi.string().allow("", null),
    registryUsername: Joi.string().allow("", null),
    registryPassword: Joi.string().allow("", null),
    isActive: Joi.boolean().default(IMAGES_STATUS.ACTIVE).required(),
  });
  return imageDetailsSchema.validate(imageDetails);
};

export const validateUpdateImage = (imageDetails: ImageDetails) => {
  const imageDetailsSchema = Joi.object({
    imageId: Joi.string().required(),
    imageName: Joi.string(),
    imageRepo: Joi.string(),
    imageTag: Joi.boolean(),
    registryHost: Joi.string().allow("", null),
    registryUsername: Joi.string().allow("", null),
    registryPassword: Joi.string().allow("", null),
    isActive: Joi.boolean().default(IMAGES_STATUS.ACTIVE),
  });
  return imageDetailsSchema.validate(imageDetails);
};