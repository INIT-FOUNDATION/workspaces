import {
  CACHE_TTL,
  envUtils,
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
import crypto from "crypto";
const environment = envUtils.getStringEnvVariableOrDefault("NODE_ENV", "Development");

export const sessionService = {
  createSession: async (
    sessionDetails: SessionDetails,
    sessionExists: boolean
  ) => {
    try {
      const clientBaseUrl = getStringEnvVariableOrDefault(
        "WORKSPACES_CLIENT_BASE_URL",
        "http://localhost:3000"
      );

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
            sessionDetails.imageName,
            sessionDetails.clientId
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

          if (environment === "Development") {
            const availablePorts = await sessionService.getAvailableTCPUDPPorts(image.imageId, image.tcpPortRange, image.udpPortRange);
            if (availablePorts.tcpPort === 0 || availablePorts.udpPort === 0) {
              loggerUtils.error(
                `sessionService :: createSession :: no ports are available to create session`
              );
              throw Error;
            }

            sessionDetails.tcpPort = availablePorts.tcpPort;
            sessionDetails.udpPort = availablePorts.udpPort;
          }
          
          const credentials = sessionService.generateSessionCredentials(envUtils.getNumberEnvVariableOrDefault("WORKSPACES_SESSIONS_CREDENTIALS_DEFAULT_LENGTH", 50));
          sessionDetails.adminPassword = credentials.adminPassword;
          sessionDetails.userPassword = credentials.userPassword;

          sessionDetails.agentId = availableAgent.agentId;

          const baseUrl = `${availableAgent.sslEnabled ? "https" : "http"}://${availableAgent.agentHost
            }:${availableAgent.agentPort}/api/v1/proxy/create`;

          await proxyService.createProxy(sessionDetails, baseUrl);

          const participantObj: Partial<IParticipant> = {
            participantId: randomUUID(),
            participantName: sessionDetails.participantName,
            sessionId: sessionDetails.sessionId,
            role: PARTICIPANT_ROLES.MODERATOR,
            access: sessionDetails.participantsAccess,
          };

          await mongoUtils.insertDocument<IParticipant>(
            ParticipantModel,
            participantObj
          );

          const sessionResponse = {
            sessionId: sessionDetails.sessionId,
            drawCursors: sessionDetails.drawCursors,
            participantId: participantObj.participantId,
            participantName: participantObj.participantName,
            agentHost: availableAgent.agentHost,
            agentPort: availableAgent.agentPort,
            sslEnabled: availableAgent.sslEnabled,
            tcpPort: sessionDetails.tcpPort,
            udpPort: sessionDetails.udpPort,
            sessionUserName: envUtils.getBooleanEnvVariableOrDefault("WORKSPACES_SESSIONS_USE_ADMIN", true) ? "admin" : "neko",
            sessionPassword: envUtils.getBooleanEnvVariableOrDefault("WORKSPACES_SESSIONS_USE_ADMIN", true) ? sessionDetails.adminPassword : sessionDetails.userPassword
          };

          const jwt = jwtUtils.generateJwt(sessionResponse, CACHE_TTL.ONE_DAY);
          const clientUrl = `${clientBaseUrl}/${jwt}`;

          return {
            sessionId: sessionResponse.sessionId,
            participantId: sessionResponse.participantId,
            clientUrl,
          };
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
      sessionDetails.agentId = agent.agentId;

      const existingSessionsData: ISession[] = await sessionService.getSessionById(sessionDetails.sessionId);
      const existingSessionData: ISession = existingSessionsData[0];

      sessionDetails.tcpPort = existingSessionData.tcpPort;
      sessionDetails.udpPort = existingSessionData.udpPort;

      sessionDetails.imageId = existingSessionData.imageId;
      sessionDetails.adminPassword = existingSessionData.adminPassword;
      sessionDetails.userPassword = existingSessionData.userPassword;

      const baseUrl = `${agent.sslEnabled ? "https" : "http"}://${agent.agentHost
        }:${agent.agentPort}/api/v1/proxy/create`;

      await proxyService.createProxy(sessionDetails, baseUrl);

      const participantObj: Partial<IParticipant> = {
        participantId: randomUUID(),
        participantName: sessionDetails.participantName,
        sessionId: sessionDetails.sessionId,
        role: PARTICIPANT_ROLES.PARTICIPANT,
        access: sessionDetails.participantsAccess,
      };

      await mongoUtils.insertDocument<IParticipant>(
        ParticipantModel,
        participantObj
      );

      const sessionResponse = {
        sessionId: sessionDetails.sessionId,
        drawCursors: existingSessionData.drawCursors,
        participantId: participantObj.participantId,
        participantName: participantObj.participantName,
        agentHost: agent.agentHost,
        agentPort: agent.agentPort,
        sslEnabled: agent.sslEnabled,
        tcpPort: existingSessionData.tcpPort,
        udpPort: existingSessionData.udpPort,
        sessionUserName: envUtils.getBooleanEnvVariableOrDefault("WORKSPACES_SESSIONS_USE_ADMIN", true) ? "admin" : "neko",
        sessionPassword: envUtils.getBooleanEnvVariableOrDefault("WORKSPACES_SESSIONS_USE_ADMIN", true) ? existingSessionData.adminPassword : existingSessionData.userPassword
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
          status: { $ne: SESSIONS_STATUS.DELETED },
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
      const key = `SESSION|ID:${sessionId}`;
      const cachedData = await redisUtils.getKey(key);
      if (cachedData) {
        return JSON.parse(cachedData);
      }

      const sessions: ISession[] =
        await mongoUtils.findDocumentsWithOptions<ISession>(
          SessionModel,
          {
            sessionId,
            status: { $ne: SESSIONS_STATUS.DELETED },
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
      redisUtils.setKey(key, JSON.stringify(sessions), CACHE_TTL.ONE_DAY);
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
      const key = `SESSIONS|CLIENT:${clientId}`;
      const cachedData = await redisUtils.getKey(key);
      if (cachedData) {
        return JSON.parse(cachedData);
      }

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
      redisUtils.setKey(key, JSON.stringify(sessions), CACHE_TTL.ONE_DAY);
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
      const baseUrl = `${agent.sslEnabled ? "https" : "http"}://${agent.agentHost
        }:${agent.agentPort}/api/v1/proxy`;

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
      loggerUtils.info(`sessionServie :: setPermissions :: participantId :: ${participantId} :: access :: ${access}`);
      await redisUtils.delKey(`PARTICIPANT|${participantId}`);
    } catch (error) {
      loggerUtils.error(
        `sessionsService :: setPermissions :: participantId ${participantId} :: access ${access} :: ${error}`
      );
      throw error;
    }
  },
  generateRandomParticipantName: (): string => {
    return `Guest-${Math.floor(Math.random() * (9999999 - 1000000 + 1)) + 1000000
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
      const key = `PARTICIPANT|${participantId}`;
      const cachedData = await redisUtils.getKey(key);

      if (cachedData) {
        return JSON.parse(cachedData);
      }

      const participants: IParticipant[] =
        await mongoUtils.findDocumentsWithOptions<IParticipant>(
          ParticipantModel,
          {
            participantId,
          },
          {
            _id: 0,
            __v: 0,
            createdAt: 0,
            updatedAt: 0,
          },
          {}
        );

      if (participants.length > 0)
        await redisUtils.setKey(
          key,
          JSON.stringify(participants),
          CACHE_TTL.ONE_HOUR
        );

      return participants;
    } catch (error) {
      loggerUtils.error(
        `sessionsService :: getParticipantById :: participantId :: ${participantId} :: ${error}`
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
  getParticipantsCountByClientId: async (
    sessionId: string
  ): Promise<number> => {
    try {
      const participantsCount: number =
        await mongoUtils.countDocuments<IParticipant>(ParticipantModel, {
          sessionId,
        });
      return participantsCount;
    } catch (error) {
      loggerUtils.error(
        `sessionsService :: getParticipantsCountByClientId :: sessionId ${sessionId} :: ${error}`
      );
      throw error;
    }
  },
  getAvailableTCPUDPPorts: async (
    imageId: string,
    tcpPortRange: string,
    udpPortRange: string
  ): Promise<{ tcpPort: number, udpPort: number }> => {
    try {
      const [tcpStartPort, tcpEndPort] = tcpPortRange.split("-").map(Number);
      const [udpStartPort, udpEndPort] = udpPortRange.split("-").map(Number);
  
      const sessions: ISession[] = await mongoUtils.findDocumentsWithOptions(
        SessionModel,
        { imageId, status: SESSIONS_STATUS.ACTIVE },
        { _id: 0, tcpPort: 1, udpPort: 1 },
        {}
      );
  
      const existingTCPPorts = new Set(sessions.map(session => session.tcpPort));
      const existingUDPPorts = new Set(sessions.map(session => session.udpPort));
  
      const generateRandomPort = (startPort: number, endPort: number, existingPorts: Set<number>): number => {
        const availablePorts: number[] = [];
        for (let port = startPort; port <= endPort; port++) {
          if (!existingPorts.has(port)) {
            availablePorts.push(port);
          }
        }
        if (availablePorts.length === 0) {
          throw new Error("No available ports in the specified range.");
        }
        return availablePorts[Math.floor(Math.random() * availablePorts.length)];
      };
  
      return {
        tcpPort: generateRandomPort(tcpStartPort, tcpEndPort, existingTCPPorts),
        udpPort: generateRandomPort(udpStartPort, udpEndPort, existingUDPPorts)
      };
    } catch (error) {
      loggerUtils.error(
        `sessionsService :: getAvailableTCPUDPPorts :: tcpPortRange ${tcpPortRange} :: udpPortRange :: ${udpPortRange} :: ${error}`
      );
      throw error;
    }
  },
  generateSessionCredentials: (length: number): { adminPassword: string, userPassword: string } => {
    try {
      return { 
        adminPassword: crypto.randomBytes(50).toString('hex').slice(0, length), 
        userPassword: crypto.randomBytes(50).toString('hex').slice(0, length) 
      }
    } catch (error) {
      loggerUtils.error(
        `sessionsService :: generateSessionCredentials :: ${error}`
      );
      throw error;
    }
  },
};
