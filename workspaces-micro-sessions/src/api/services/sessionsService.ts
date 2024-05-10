import {
  CACHE_TTL,
  jwtUtils,
  loggerUtils,
  mongoUtils,
  redisUtils,
} from "workspaces-micro-commons";
import { randomUUID } from "crypto";
import {
  IAgent,
  IImage,
  IParticipant,
  ISession,
  SessionDetails,
} from "../../types/custom";
import { SessionModel } from "../../models/sessionsModel";
import { agentsService } from "./agentsService";
import { PARTICIPANT_ROLES } from "../../constants/participants";
import { ParticipantModel } from "../../models/participantsModel";
import { getStringEnvVariableOrDefault } from "workspaces-micro-commons/src/utils/config/envUtils";
import { SESSIONS_STATUS } from "../../constants";
import { imagesService } from "./imagesService";
import { proxyService } from "./proxyService";

export const sessionService = {
  createSession: async (
    sessionDetails: SessionDetails,
    sessionExists: boolean
  ) => {
    try {
      if (!sessionExists) {
        const agents: IAgent[] = await agentsService.listAgentsByClientId(
          sessionDetails.clientId
        );

        if (agents.length > 0) {
          const availableAgents: IAgent[] =
            await agentsService.getLeastActiveAgent(sessionDetails.clientId);
          if (availableAgents.length == 0) {
            loggerUtils.error(
              `sessionService :: createSession :: no agents are available`
            );
            throw Error;
          }

          const availableImages = await imagesService.getImageByName(
            sessionDetails.imageName
          );

          if (availableImages.length == 0) {
            loggerUtils.error(
              `sessionService :: createSession :: no images are available while creating session`
            );
            throw Error;
          }

          const image: IImage = availableImages[0];
          sessionDetails.imageId = image.imageId;

          const availableAgent = availableAgents[0];
          const baseUrl = `${availableAgent.sslEnabled ? "https" : "http"}://${
            availableAgent.agentHost
          }:${availableAgent.agentPort}/api/v1/proxy/create`;

          await proxyService.createProxy(sessionDetails, baseUrl);

          sessionDetails.agentId = availableAgent.agentId;
        } else {
          loggerUtils.error(
            `sessionService :: createSession :: no available agents are available while creating session`
          );
          throw Error;
        }
      }

      const agents: IAgent[] = await agentsService.getAgentBySessionId(
        sessionDetails.sessionId
      );
      if (agents.length == 0) {
        loggerUtils.error(
          `sessionService :: createSession :: no agents are available while joining session`
        );
        throw Error;
      }

      const agent: IAgent = agents[0];

      const participantObj: Partial<IParticipant> = {
        participantId: randomUUID(),
        participantName: sessionDetails.participantName,
        sessionId: sessionDetails.sessionId,
        role: sessionExists
          ? PARTICIPANT_ROLES.PARTICIPANT
          : PARTICIPANT_ROLES.MODERATOR,
        access: sessionDetails.participantsAccess,
      };

      await mongoUtils.insertDocument<IParticipant>(
        ParticipantModel,
        participantObj
      );

      const clientBaseUrl = getStringEnvVariableOrDefault(
        "WORKSPACESCLIENT_BASE_URL",
        "http://localhost:3000"
      );

      const sessionResponse = {
        sessionId: sessionDetails.sessionId,
        participantId: participantObj.participantId,
        participantName: participantObj.participantName,
        agentHost: agent.agentHost,
        agentPort: agent.agentPort,
        sslEnabled: agent.sslEnabled,
      };

      const jwt = jwtUtils.generateJwt(sessionResponse, CACHE_TTL.ONE_DAY);
      const clientUrl = `${clientBaseUrl}/${jwt}`;

      return {
        sessionId: sessionResponse.sessionId,
        participantId: sessionResponse.participantId,
        clientUrl,
      };
    } catch (error) {
      loggerUtils.error(`sessionsService :: createClient :: ${error}`);
      throw error;
    }
  },
  sessionExistsById: async (sessionId: string) => {
    try {
      const exists: boolean = await mongoUtils.existsDocument<ISession>(
        SessionModel,
        {
          sessionId,
          status: SESSIONS_STATUS.ACTIVE,
        }
      );
      return exists;
    } catch (error) {
      loggerUtils.error(
        `sessionsService :: sessionExistsById by sessionId ${sessionId} :: ${error}`
      );
      throw error;
    }
  },
  getSessionById: async (sessionId: string): Promise<ISession[]> => {
    try {
      const sessions: ISession[] =
        await mongoUtils.findDocumentsWithOptions<ISession>(
          SessionModel,
          {
            sessionId,
            status: SESSIONS_STATUS.ACTIVE,
          },
          {
            _id: 0,
            __v: 0,
            clientId: 0,
            createdAt: 0,
            updatedAt: 0,
            status: 0,
          },
          {}
        );
      return sessions;
    } catch (error) {
      loggerUtils.error(
        `sessionsService :: getSessionById :: sessionId ${sessionId} :: ${error}`
      );
      throw error;
    }
  },
  listSessionsByClientId: async (clientId: string): Promise<ISession[]> => {
    try {
      const sessions: ISession[] =
        await mongoUtils.findDocumentsWithOptions<ISession>(
          SessionModel,
          {
            clientId,
            status: SESSIONS_STATUS.ACTIVE,
          },
          {
            _id: 0,
            __v: 0,
            clientId: 0,
            createdAt: 0,
            updatedAt: 0,
            status: 0,
          },
          {}
        );
      return sessions;
    } catch (error) {
      loggerUtils.error(
        `sessionsService :: listSessionsByClientId :: clientId ${clientId} :: ${error}`
      );
      throw error;
    }
  },
  destroySession: async (sessionId: string, deletePersistence: boolean) => {
    try {
      const agents: IAgent[] = await agentsService.getAgentBySessionId(
        sessionId
      );
      if (agents.length == 0) {
        loggerUtils.error(
          `sessionService :: createSession :: no agents are available while joining session`
        );
        throw Error;
      }

      const agent: IAgent = agents[0];
      const baseUrl = `${agent.sslEnabled ? "https" : "http"}://${
        agent.agentHost
      }:${agent.agentPort}`;

      await proxyService.destroyProxy(sessionId, deletePersistence, baseUrl);
    } catch (error) {
      loggerUtils.error(
        `sessionsService :: destroySession :: sessionId ${sessionId} :: ${error}`
      );
      throw error;
    }
  },
  setPermissions: async (participantId: string, access: string) => {
    try {
      await mongoUtils.updateDocuments<IParticipant>(
        ParticipantModel,
        {
          participantId,
        },
        {
          access,
        }
      );
      await redisUtils.delKey(`PARTICIPANT|${participantId}`);
    } catch (error) {
      loggerUtils.error(
        `sessionsService :: setPermissions :: participantId ${participantId} :: access ${access} :: ${error}`
      );
      throw error;
    }
  },
  generateRandomParticipantName: (): string => {
    return `Guest-${
      Math.floor(Math.random() * (9999999 - 1000000 + 1)) + 1000000
    }`;
  },
  participantExistsById: async (participantId: string): Promise<boolean> => {
    try {
      const exists = await mongoUtils.existsDocument<IParticipant>(
        ParticipantModel,
        {
          participantId,
        }
      );
      return exists;
    } catch (error) {
      loggerUtils.error(
        `sessionsService :: participantExistsById :: participantId ${participantId} :: ${error}`
      );
      throw error;
    }
  },
  getParticipantById: async (
    participantId: string
  ): Promise<IParticipant[]> => {
    try {
      const participant: IParticipant[] =
        await mongoUtils.findDocumentsWithOptions<IParticipant>(
          ParticipantModel,
          {
            participantId,
          },
          {
            _id: 0,
            createdAt: 0,
            updatedAt: 0,
            __v: 0,
          },
          {}
        );
      return participant;
    } catch (error) {
      loggerUtils.error(
        `sessionsService :: getParticipantById :: participantId ${participantId} :: ${error}`
      );
      throw error;
    }
  },
  getSessionsCountByClientId: async (clientId: string): Promise<number> => {
    try {
      const sessionsCount: number = await mongoUtils.countDocuments<ISession>(
        SessionModel,
        {
          clientId,
          status: SESSIONS_STATUS.ACTIVE,
        }
      );
      return sessionsCount;
    } catch (error) {
      loggerUtils.error(
        `sessionsService :: getSessionsCountByClientId :: clientId ${clientId} :: ${error}`
      );
      throw error;
    }
  },
};
