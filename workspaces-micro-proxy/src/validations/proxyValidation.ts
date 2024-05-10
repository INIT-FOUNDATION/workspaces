import Joi from "joi";

export const validateCreateProxy = (proxyDetails: any) => {
  const proxyDetailsSchema = Joi.object({
    sessionId: Joi.string().required(),
    imageId: Joi.string().required(),
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