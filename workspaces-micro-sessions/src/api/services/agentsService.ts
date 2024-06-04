import {
  CACHE_TTL,
  MONGO_COLLECTIONS,
  loggerUtils,
  mongoUtils,
  redisUtils,
} from "workspaces-micro-commons";
import {
  uniqueNamesGenerator,
  Config,
  adjectives,
  colors,
  animals,
  languages,
  names,
  starWars,
} from "unique-names-generator";
import { AgentDetails, IAgent, ISession } from "../../types/custom";
import { AgentModel } from "../../models/agentsModel";
import { AGENTS_STATUS, SESSIONS_STATUS } from "../../constants";
import { SessionModel } from "../../models/sessionsModel";

export const agentsService = {
  createAgent: async (agentDetails: AgentDetails) => {
    try {
      const agentObj: Partial<IAgent> = agentDetails;
      await mongoUtils.insertDocument<IAgent>(AgentModel, agentObj);
      redisUtils.delKey(`AGENTS|CLIENT:${agentDetails.clientId}`);
    } catch (error) {
      loggerUtils.error(
        `agentsService :: createAgent :: agentObj ${agentDetails} :: ${error}`
      );
      throw error;
    }
  },
  getAgentById: async (agentId: string): Promise<IAgent[]> => {
    try {
      const key = `AGENT|ID:${agentId}`;
      const cachedData = await redisUtils.getKey(key);
      if (cachedData) {
        return JSON.parse(cachedData);
      }

      const agents: IAgent[] =
        await mongoUtils.findDocumentsWithOptions<IAgent>(
          AgentModel,
          {
            agentId,
            isActive: AGENTS_STATUS.ACTIVE,
          },
          {
            _id: 0,
            __v: 0,
            clientId: 0,
            createdAt: 0,
            updatedAt: 0,
            isActive: 0,
          },
          {}
        );
      redisUtils.setKey(key, JSON.stringify(agents), CACHE_TTL.ONE_DAY);
      return agents;
    } catch (error) {
      loggerUtils.error(
        `agentsService :: getAgentById :: agentId ${agentId} :: ${error}`
      );
      throw error;
    }
  },
  agentExistsById: async (agentId: string): Promise<boolean> => {
    try {
      const exists: boolean = await mongoUtils.existsDocument<IAgent>(
        AgentModel,
        {
          agentId,
          isActive: AGENTS_STATUS.ACTIVE,
        }
      );
      return exists;
    } catch (error) {
      loggerUtils.error(
        `agentsService :: agentExistsById :: agentId ${agentId} :: ${error}`
      );
      throw error;
    }
  },
  listAgentsByClientId: async (clientId: string): Promise<IAgent[]> => {
    try {
      const key = `AGENTS|CLIENT:${clientId}`;
      const cachedData = await redisUtils.getKey(key);
      if (cachedData) {
        return JSON.parse(cachedData);
      }

      const agents: IAgent[] =
        await mongoUtils.findDocumentsWithOptions<IAgent>(
          AgentModel,
          {
            clientId,
            isActive: AGENTS_STATUS.ACTIVE,
          },
          {
            _id: 0,
            __v: 0,
            clientId: 0,
            createdAt: 0,
            updatedAt: 0,
            isActive: 0,
          },
          {}
        );
      redisUtils.setKey(key, JSON.stringify(agents), CACHE_TTL.ONE_DAY);
      return agents;
    } catch (error) {
      loggerUtils.error(
        `agentsService :: listAgentsByClientId :: clientId ${clientId} :: ${error}`
      );
      throw error;
    }
  },
  updateAgentById: async (agentDetails: AgentDetails) => {
    try {
      await mongoUtils.updateDocuments<IAgent>(
        AgentModel,
        {
          agentId: agentDetails.agentId,
        },
        {
          agentName: agentDetails.agentName || undefined,
          agentHost: agentDetails.agentHost || undefined,
          agentPort: agentDetails.agentPort || undefined,
          sslEnabled: agentDetails.sslEnabled != undefined ? agentDetails.sslEnabled : true,
          isActive: agentDetails.isActive != undefined ? agentDetails.isActive : AGENTS_STATUS.ACTIVE
        }
      );
      redisUtils.delKey(`AGENT|ID:${agentDetails.agentId}`);
      redisUtils.delKey(`AGENTS|CLIENT:${agentDetails.clientId}`);
    } catch (error) {
      loggerUtils.error(
        `authService :: updateAgentById :: agent Id ${agentDetails.agentId} :: ${error}`
      );
      throw error;
    }
  },
  deleteAgentById: async (agentId: string, clientId: string) => {
    try {
      await mongoUtils.updateDocuments<IAgent>(
        AgentModel,
        {
          agentId,
        },
        {
          isActive: AGENTS_STATUS.INACTIVE,
        }
      );
      redisUtils.delKey(`AGENT|ID:${agentId}`);
      redisUtils.delKey(`AGENTS|CLIENT:${clientId}`);
    } catch (error) {
      loggerUtils.error(
        `authService :: deleteAgentById :: agentId ${agentId} :: clientId ${clientId} :: ${error}`
      );
      throw error;
    }
  },
  generateAgentName: (): string => {
    try {
      const config: Config = {
        dictionaries: [adjectives, colors, animals, languages, names, starWars],
      };
      const agentName: string = uniqueNamesGenerator(config);
      return agentName;
    } catch (error) {
      loggerUtils.error(`agentsService :: generateAgentName :: ${error}`);
      throw error;
    }
  },
  agentExistsByHostAndPort: async (
    agentHost: string,
    agentPort: number
  ): Promise<boolean> => {
    try {
      const exists: boolean = await mongoUtils.existsDocument<IAgent>(
        AgentModel,
        {
          agentHost,
          agentPort,
          isActive: AGENTS_STATUS.ACTIVE,
        }
      );
      return exists;
    } catch (error) {
      loggerUtils.error(
        `agentsService :: agentExistsByHostAndPort :: host ${agentHost} :: port ${agentPort} :: ${error}`
      );
      throw error;
    }
  },
  getLeastActiveAgent: async (clientId: string): Promise<IAgent[]> => {
    try {
      const pipeline = [
        {
          $match: { isActive: AGENTS_STATUS.ACTIVE },
        },
        {
          $lookup: {
            from: MONGO_COLLECTIONS.SESSIONS,
            let: { agentId: "$agentId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$agentId", "$$agentId"] },
                      { $eq: ["$status", SESSIONS_STATUS.ACTIVE] },
                    ],
                  },
                },
              },
            ],
            as: MONGO_COLLECTIONS.SESSIONS,
          },
        },
        {
          $project: {
            _id: 0,
            agentId: 1,
            agentHost: 1,
            agentPort: 1,
            sslEnabled: 1,
            sessionCount: { $size: `$${MONGO_COLLECTIONS.SESSIONS}` },
          },
        },
        {
          $sort: { sessionCount: 1 },
        },
        {
          $limit: 1,
        },
      ];

      const agents: IAgent[] = await mongoUtils.aggregateDocuments<IAgent>(
        AgentModel,
        pipeline
      );
      return agents;
    } catch (error) {
      loggerUtils.error(
        `agentsService :: getActiveSessionCountsOfAgents :: clientId ${clientId} :: ${error}`
      );
      throw error;
    }
  },
  getAgentBySessionId: async (sessionId: string): Promise<IAgent[]> => {
    try {
      const pipeline = [
        {
          $match: { sessionId },
        },
        {
          $lookup: {
            from: MONGO_COLLECTIONS.AGENTS,
            pipeline: [
              {
                $match: {
                  isActive: AGENTS_STATUS.ACTIVE,
                },
              },
            ],
            localField: "agentId",
            foreignField: "agentId",
            as: MONGO_COLLECTIONS.AGENTS,
          },
        },
        {
          $unwind: `$${MONGO_COLLECTIONS.AGENTS}`,
        },
        {
          $project: {
            _id: 0,
            agentId: `$${MONGO_COLLECTIONS.AGENTS}.agentId`,
            agentHost: `$${MONGO_COLLECTIONS.AGENTS}.agentHost`,
            agentPort: `$${MONGO_COLLECTIONS.AGENTS}.agentPort`,
            sslEnabled: `$${MONGO_COLLECTIONS.AGENTS}.sslEnabled`,
          },
        },
      ];
      const agents: IAgent[] = await mongoUtils.aggregateDocuments<ISession>(
        SessionModel,
        pipeline
      );
      return agents;
    } catch (error) {
      loggerUtils.error(
        `sessionsService :: getAgentBySessionId :: sessionId ${sessionId} :: ${error}`
      );
      throw error;
    }
  },
};
