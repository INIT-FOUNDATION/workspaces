import Joi from "joi";
import { ISession } from "../types/custom";

export const validateCreateProxy = (proxyDetails: ISession) => {
  const proxyDetailsSchema = Joi.object({
    sessionId: Joi.string().required(),
    imageId: Joi.string().required(),
    imageName: Joi.string().required(),
    clientId: Joi.string().required(),
    timezone: Joi.string().required(),
    startUrl: Joi.string().required(),
    sharedMemory: Joi.number().required(),
    drawCursors: Joi.boolean().required(),
    participantsAccess: Joi.string().required(),
    participantName: Joi.string(),
    saveSession: Joi.boolean().required(),
    status: Joi.number().required(),
  });
  return proxyDetailsSchema.validate(proxyDetails);
};

export const validateJoinProxy = (proxyDetails: any) => {
  const proxyDetailsSchema = Joi.object({
    sessionId: Joi.string().required(),
    participantId: Joi.string().required(),
  });
  return proxyDetailsSchema.validate(proxyDetails);
};

export const validateDeleteProxy = (proxyDetails: any) => {
  const proxyDetailsSchema = Joi.object({
    sessionId: Joi.string().required(),
    deletePersistence: Joi.boolean().required(),
  });
  return proxyDetailsSchema.validate(proxyDetails);
};
