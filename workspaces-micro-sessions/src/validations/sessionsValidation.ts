import Joi from "joi";
import { IImage, SessionDetails } from "../types/custom";
import { listTimeZones as timezoneList } from "timezone-support";
import { SESSIONS_STATUS } from "../constants";
import { PARTICIPANT_ACCESS } from "../constants/participants";
import { imagesService } from "../api/services";

export const validateSessionDetails = async (
  sessionDetails: SessionDetails
) => {
  const availableImages: IImage[] = await imagesService.listImages(
    sessionDetails.clientId
  );
  const availableImageNames: string[] = availableImages.map(
    (image) => image.imageName
  );
  const timeZones = timezoneList();

  const sessionDetailsSchema = Joi.object({
    sessionId: Joi.string().required(),
    agentId: Joi.string().allow("", null),
    clientId: Joi.string().required(),
    timezone: Joi.string()
      .valid(...timeZones)
      .required(),
    startUrl: Joi.string().uri().required(),
    sharedMemory: Joi.number().min(200).max(40000).required(),
    saveSession: Joi.boolean().required(),
    participantName: Joi.string().allow("", null),
    participantsAccess: Joi.string().allow("", null),
    drawCursors: Joi.boolean().required(),
    darkMode: Joi.boolean().required(),
    imageId: Joi.string(),
    imageName: Joi.string().valid(...availableImageNames),
    status: Joi.number().valid(...Object.values(SESSIONS_STATUS)),
  });
  return sessionDetailsSchema.validate(sessionDetails);
};

export const validateDeleteSession = (deleteSessionDetails: any) => {
  const deleteSessionSchema = Joi.object({
    sessionId: Joi.string().required(),
    deletePersistence: Joi.boolean().required(),
  });
  return deleteSessionSchema.validate(deleteSessionDetails);
};

export const validateSetPermissions = (permissionDetails: any) => {
  const permissionsSchema = Joi.object({
    participantId: Joi.string().required(),
    access: Joi.string()
      .valid(...Object.values(PARTICIPANT_ACCESS))
      .required(),
  });
  return permissionsSchema.validate(permissionDetails);
};
