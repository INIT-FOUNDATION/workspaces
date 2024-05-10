import {
  CACHE_TTL,
  jwtUtils,
  loggerUtils,
  mongoUtils,
  redisUtils,
} from "workspaces-micro-commons";
import {  ClientDetails, IClient } from "../../types/custom";
import crypto from "crypto";
import { ClientModel } from "../../models/authModel";
import { CLIENT_STATUS } from "../../constants";

export const authService = {
  createClient: async (clientDetails: ClientDetails) => {
    try {
      const clientCredentials = await authService.generateClientCredentials(
        clientDetails.clientName
      );

      const clientObj: Partial<IClient> =
      {
        clientId: clientCredentials.clientId,
        clientName: clientDetails.clientName,
        clientSecret: clientCredentials.clientSecret,
        sessionsLimit: clientDetails.sessionsLimit,
        sessionConcurrencyLimit: clientDetails.sessionConcurrencyLimit,
        accessExpiryDate: clientDetails.accessExpiryDate,
        isActive: clientDetails.isActive
      };

      await mongoUtils.insertDocument<IClient>(ClientModel, clientObj)

      return clientCredentials;
    } catch (error) {
      loggerUtils.error(`authService :: createClient :: clientObj ${JSON.stringify(clientDetails)} :: ${error}`);
      throw error;
    }
  },
  clientExistsByName: async (clientName: string) => {
    try {
      const exists: boolean = await mongoUtils.existsDocument<IClient>(ClientModel, {
        clientName,
        isActive: CLIENT_STATUS.ACTIVE
      });
      return exists;
    } catch (error) {
      loggerUtils.error(`authService :: clientExists by clientName ${clientName} :: ${error}`);
      throw error;
    }
  },
  clientExistsById: async (clientId: string): Promise<boolean> => {
    try {
      const exists: boolean = await mongoUtils.existsDocument<IClient>(ClientModel, {
        clientId,
        isActive: CLIENT_STATUS.ACTIVE
      });
      return exists;
    } catch (error) {
      loggerUtils.error(`authService :: clientExists by client Id ${clientId} :: ${error}`);
      throw error;
    }
  },
  generateClientCredentials: async (clientName: string): Promise<{clientId: string, clientSecret: string}> => {
    try {
      return {
        clientId: `${clientName.toLowerCase()}-${crypto
          .randomBytes(5)
          .toString("hex")}`,
        clientSecret: crypto.randomBytes(20).toString("base64"),
      };
    } catch (error) {
      loggerUtils.error(`authService :: generateClientCredentials by clientName ${clientName} :: ${error}`);
      throw error;
    }
  },
  generateToken: async (clientDetails: ClientDetails): Promise<{ token: string, ttl: number }> => {
    try {
      const ttl: number = CACHE_TTL.FIFTEEN_MINUTES;

      const token: string = jwtUtils.generateJwt(clientDetails, ttl);

      redisUtils.setKey(clientDetails.clientId, token, ttl);

      return { token, ttl };
    } catch (error) {
      loggerUtils.error(`authService :: generateToken :: ${error}`);
      throw error;
    }
  },
  deleteClientById: async (clientId: string) => {
    try {
      await mongoUtils.updateDocuments<IClient>(ClientModel, {
        clientId
      }, {
        isActive: CLIENT_STATUS.INACTIVE
      });
      
      redisUtils.delKey(clientId);
    } catch (error) {
      loggerUtils.error(`authService :: deleteClient by clientId ${clientId} :: ${error}`);
      throw error;
    }
  },
  getClientById: async (
    clientId: string,
  ): Promise<IClient[]> => {
    try {
      const clientDetails: IClient[] = await mongoUtils.findDocumentsWithOptions<IClient>(ClientModel, {
        clientId,
        isActive: CLIENT_STATUS.ACTIVE
      }, {
        _id: 0,
        __v: 0,
        createdAt: 0,
        updatedAt: 0,
        sessionsLimit: 1,
        sessionConcurrencyLimit: 1
      }, {});
      return clientDetails
    } catch (error) {
      loggerUtils.error(`authService :: getClientByClientId :: clientId ${clientId} :: ${error}`);
      throw error;
    }
  },
  updateClientById: async (clientDetails: ClientDetails) => {
    try {
      await mongoUtils.updateDocuments<IClient>(ClientModel, {
        clientId: clientDetails.clientId
      }, {
        sessionsLimit: clientDetails.sessionsLimit || undefined,
        sessionConcurrencyLimit: clientDetails.sessionConcurrencyLimit || undefined,
        accessExpiryDate: clientDetails.accessExpiryDate || undefined,
        isActive: clientDetails.isActive || CLIENT_STATUS.ACTIVE
      })
    } catch (error) {
      loggerUtils.error(`authService :: updateClient :: clientId ${clientDetails.clientId} :: ${error}`);
      throw error;
    }
  },
};