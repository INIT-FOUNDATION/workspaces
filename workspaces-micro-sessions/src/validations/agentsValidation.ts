import Joi from "joi";
import { AgentDetails } from "../types/custom";
import { AGENTS_STATUS } from "../constants";

export const validateAgents = (agentDetails: AgentDetails) => {
  const agentDetailsSchema = Joi.object({
    agentId: Joi.string().required(),
    agentName: Joi.string().required(),
    agentHost: Joi.string().required(),
    agentPort: Joi.number().min(80).max(65535).required(),
    sslEnabled: Joi.boolean().required(),
    clientId: Joi.string().required(),
    isActive: Joi.boolean().default(AGENTS_STATUS.ACTIVE).required()
  });
  return agentDetailsSchema.validate(agentDetails);
};

export const validateUpdateAgents = (agentDetails: AgentDetails) => {
  const agentDetailsSchema = Joi.object({
    agentId: Joi.string().required(),
    agentName: Joi.string().allow("", null),
    agentHost: Joi.string().allow("", null),
    agentPort: Joi.number().min(1025).max(65535),
    sslEnabled: Joi.boolean().default(true),
    clientId: Joi.string().required(),
    isActive: Joi.boolean().default(AGENTS_STATUS.ACTIVE)
  });
  return agentDetailsSchema.validate(agentDetails);
};