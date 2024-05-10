import Joi from "joi";
import { ClientDetails, IClient } from "../types/custom";

export const validateClientDetails = (clientDetails: ClientDetails) => {
  const clientDetailsSchema = Joi.object({
    clientId: Joi.string(),
    clientName: Joi.string().required(),
    clientSecret: Joi.string(),
    sessionsLimit: Joi.number().required(),
    sessionConcurrencyLimit: Joi.number().required(),
    accessExpiryDate: Joi.string().required(),
    isActive: Joi.boolean().required()
  });
  return clientDetailsSchema.validate(clientDetails);
};

export const validateGenerateToken = (clientDetails: ClientDetails) => {
  const clientDetailsSchema = Joi.object({
    clientId: Joi.string(),
    clientSecret: Joi.string(),
  });
  return clientDetailsSchema.validate(clientDetails);
};

export const validateUpdateClientDetails = (clientDetails: ClientDetails) => {
  const clientDetailsSchema = Joi.object({
    clientId: Joi.string().required(),
    sessionsLimit: Joi.number().required(),
    sessionConcurrencyLimit: Joi.number().required(),
    accessExpiryDate: Joi.string().regex(/^\d{4}-\d{2}-\d{2}$/).required()
      .messages({
        'string.pattern.base': 'accessExpiryDate must be in YYYY-MM-DD format'
      }),
    isActive: Joi.boolean()
  });
  return clientDetailsSchema.validate(clientDetails);
};