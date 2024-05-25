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
    runningPorts: Joi.array().items(Joi.object({
      port: Joi.number().integer().min(80).max(65535).required(),
      protocol: Joi.string().required(),
    })).required(),
    volumeMountPath: Joi.string().allow('', null).regex(/^\/.*/),
    defaultEnvs: Joi.array().items(Joi.string()),
    isActive: Joi.boolean().default(IMAGES_STATUS.ACTIVE).required(),
    clientId: Joi.string().required(),
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
    runningPorts: Joi.array().items(Joi.number().min(80).max(65535)),
    volumeMountPath: Joi.string().allow('', null).regex(/^\/.*/),
    defaultEnvs: Joi.array().items(Joi.string()),
    isActive: Joi.boolean().default(IMAGES_STATUS.ACTIVE),
    clientId: Joi.string().required(),
  });
  return imageDetailsSchema.validate(imageDetails);
};
