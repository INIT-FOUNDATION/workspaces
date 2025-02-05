import { Response } from "express";
import {
  ERROR_MESSAGES,
  HTTP_STATUS_CODES,
  loggerUtils,
} from "workspaces-micro-commons";
import { SESSIONS_STATUS, SESSION_ERROR_RESPONSES } from "../../constants";
import { IParticipant, ISession, SessionDetails } from "../../types/custom";
import { Session } from "../../models/sessionsModel";
import {
  validateDeleteSession,
  validateSessionDetails,
  validateSetPermissions,
} from "../../validations/sessionsValidation";
import { Request } from "../../types/express";
import { sessionService } from "../services/sessionsService";

export const sessionsController = {
  healthCheck: async(req: Request, res: Response): Promise<Response> => {
    try {
      return res.status(HTTP_STATUS_CODES.OK).send({
        data: null,
        message: "Sessions Service is Up and Running!",
      });
    } catch (error) {
      loggerUtils.error(`sessionsController :: healthCheck :: ${error}`);
      return res
        .status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR)
        .send(SESSION_ERROR_RESPONSES.SESSERR000);
    }
  },
  createSession: async (req: Request, res: Response): Promise<Response> => {
    try {
      const sessionId = req.body.sessionId;
      const decodedToken = req.decodedToken;
      let sessionExists: boolean = false;

      if (sessionId) {
        sessionExists = await sessionService.sessionExistsById(
          req.body.sessionId
        );
        if (!sessionExists)
          return res
            .status(HTTP_STATUS_CODES.BAD_REQUEST)
            .send(SESSION_ERROR_RESPONSES.SESSERR003);
      }

      const sessionDetails: SessionDetails = new Session(req.body);
      sessionDetails.clientId = decodedToken.clientId;

      const { error } = await validateSessionDetails(sessionDetails);

      if (error) {
        if (error.details)
          return res.status(HTTP_STATUS_CODES.BAD_REQUEST).send({
            errorCode: SESSION_ERROR_RESPONSES.SESSERR001,
            errorMessage: error.details[0].message,
          });
        else
          return res.status(HTTP_STATUS_CODES.BAD_REQUEST).send({
            errorCode: SESSION_ERROR_RESPONSES.SESSERR001,
            errorMessage: error.message,
          });
      }

      const participantsCount: number =
        await sessionService.getParticipantsCountByClientId(
          decodedToken.clientId
        );

      if (participantsCount == decodedToken.sessionConcurrencyLimit)
        return res
          .status(HTTP_STATUS_CODES.BAD_REQUEST)
          .send(SESSION_ERROR_RESPONSES.SESSERR008);

      const session = await sessionService.createSession(
        sessionDetails,
        sessionExists
      );

      return res.status(HTTP_STATUS_CODES.OK).send({
        data: { session },
        message: "Session Initiated Successfully",
      });
    } catch (error) {
      loggerUtils.error(`sessionsController :: createSession :: ${error}`);
      return res
        .status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR)
        .send(SESSION_ERROR_RESPONSES.SESSERR000);
    }
  },
  setPermissions: async (req: Request, res: Response): Promise<Response> => {
    try {
      const permissionDetails: any = req.body;

      const { error } = validateSetPermissions(permissionDetails);

      if (error) {
        if (error.details)
          return res.status(HTTP_STATUS_CODES.BAD_REQUEST).send({
            errorCode: SESSION_ERROR_RESPONSES.SESSERR001.errorCode,
            errorMessage: error.details[0].message,
          });
        else
          return res.status(HTTP_STATUS_CODES.BAD_REQUEST).send({
            errorCode: SESSION_ERROR_RESPONSES.SESSERR001.errorCode,
            errorMessage: error.message,
          });
      }

      const participantExists: boolean =
        await sessionService.participantExistsById(
          permissionDetails.participantId
        );

      if (!participantExists)
        return res
          .status(HTTP_STATUS_CODES.NOT_FOUND)
          .send(SESSION_ERROR_RESPONSES.SESSERR005);

      const participants: IParticipant[] =
        await sessionService.getParticipantById(
          permissionDetails.participantId
        );
      const participant = participants[0];

      if (participant.sessionId) {
        const sessionExists = await sessionService.sessionExistsById(
          participant.sessionId
        );
        if (!sessionExists)
          return res
            .status(HTTP_STATUS_CODES.BAD_REQUEST)
            .send(SESSION_ERROR_RESPONSES.SESSERR003);
      }

      await sessionService.setPermissions(
        permissionDetails.participantId,
        permissionDetails.access
      );

      return res.status(HTTP_STATUS_CODES.OK).send({
        data: null,
        message: `Permissions Granted Successfully!`,
      });
    } catch (error) {
      loggerUtils.error(`sessionsController :: setPermissions :: ${error}`);
      return res
        .status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR)
        .send(SESSION_ERROR_RESPONSES.SESSERR000);
    }
  },
  destroySession: async (req: Request, res: Response): Promise<Response> => {
    try {
      const deleteSessionDetails: any = req.body;
      deleteSessionDetails.sessionId = req.params.sessionId;

      const { error } = validateDeleteSession(deleteSessionDetails);

      if (error) {
        if (error.details)
          return res.status(HTTP_STATUS_CODES.BAD_REQUEST).send({
            errorCode: SESSION_ERROR_RESPONSES.SESSERR001.errorCode,
            errorMessage: error.details[0].message,
          });
        else
          return res.status(HTTP_STATUS_CODES.BAD_REQUEST).send({
            errorCode: SESSION_ERROR_RESPONSES.SESSERR001.errorCode,
            errorMessage: error.message,
          });
      }

      const sessionExists = await sessionService.sessionExistsById(
        deleteSessionDetails.sessionId
      );

      if (!sessionExists)
        return res
          .status(HTTP_STATUS_CODES.NOT_FOUND)
          .send(SESSION_ERROR_RESPONSES.SESSERR003);

      await sessionService.destroySession(
        deleteSessionDetails.sessionId,
        deleteSessionDetails.deletePersistence
      );

      return res.status(HTTP_STATUS_CODES.OK).send({
        data: null,
        message: "Session Deleted Successfully",
      });
    } catch (error) {
      loggerUtils.error(`sessionsController :: destroySession :: ${error}`);
      return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).send({
        data: null,
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  },
  getSession: async (req: Request, res: Response): Promise<Response> => {
    try {
      const sessionId: string = req.params.sessionId;

      if (!sessionId)
        return res
          .status(HTTP_STATUS_CODES.BAD_REQUEST)
          .send(SESSION_ERROR_RESPONSES.SESSERR002);

      const sessions: ISession[] = await sessionService.getSessionById(
        sessionId
      );

      if (sessions.length == 0)
        return res
          .status(HTTP_STATUS_CODES.NOT_FOUND)
          .send(SESSION_ERROR_RESPONSES.SESSERR003);

      return res.status(HTTP_STATUS_CODES.OK).send({
        data: { session: sessions[0] },
        message: "Session Fetched Successfully",
      });
    } catch (error) {
      loggerUtils.error(`sessionsController :: getSession :: ${error}`);
      return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).send({
        data: null,
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  },
  listSessionsByClientId: async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const clientId: string = req.decodedToken.clientId;

      if (!clientId)
        return res
          .status(HTTP_STATUS_CODES.BAD_REQUEST)
          .send(SESSION_ERROR_RESPONSES.SESSERR006);

      const sessions: ISession[] = await sessionService.listSessionsByClientId(
        clientId
      );

      if (sessions.length == 0)
        return res
          .status(HTTP_STATUS_CODES.NOT_FOUND)
          .send(SESSION_ERROR_RESPONSES.SESSERR007);

      return res.status(HTTP_STATUS_CODES.OK).send({
        data: { sessions },
        message: "Sessions Fetched Successfully",
      });
    } catch (error) {
      loggerUtils.error(
        `sessionsController :: listSessionsByClientId :: ${error}`
      );
      return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).send({
        data: null,
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  },
  getAccessByParticipantIdAndSessionId: async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    try {
      const participantId = req.params.participantId;
      const sessionId = req.params.sessionId;

      if (!participantId) return res.status(HTTP_STATUS_CODES.BAD_REQUEST).send(SESSION_ERROR_RESPONSES.SESSERR009);
      if (!sessionId) return res.status(HTTP_STATUS_CODES.BAD_REQUEST).send(SESSION_ERROR_RESPONSES.SESSERR002);

      const sessionExists = await sessionService.sessionExistsById(sessionId);
      if (!sessionExists) return res.status(HTTP_STATUS_CODES.OK).send({
        data: {
          sessionStatus: SESSIONS_STATUS.INACTIVE,
          access: ""
        },
        message: "Session Status Fetched Successfully"
      });

      const participantExists = await sessionService.participantExistsById(participantId);
      if (!participantExists) return res.status(HTTP_STATUS_CODES.OK).send({
        data: {
          sessionStatus: SESSIONS_STATUS.ACTIVE,
          access: ""
        },
        message: "Session Status Fetched Successfully"
      });

      const participants = await sessionService.getParticipantById(participantId);
      const participant = participants[0];

      return res.status(HTTP_STATUS_CODES.OK).send({
        data: { sessionStatus: SESSIONS_STATUS.ACTIVE, access: participant.access },
        message: "Session Status Fetched Successfully",
      });
    } catch (error) {
      loggerUtils.error(
        `sessionsController :: getAccessByParticipantIdAndSessionId :: ${error}`
      );
      return res.status(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).send({
        data: null,
        message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    }
  },
};
