import axios from "axios";
import { loggerUtils } from "workspaces-micro-commons";
import https from "https";
import { SessionDetails } from "../../types/custom";

const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});

export const proxyService = {
  createProxy: async (sessionDetails: SessionDetails, baseUrl: string) => {
    try {
      await axiosInstance.post(baseUrl, sessionDetails);
    } catch (error) {
      loggerUtils.error(
        `proxyService :: createProxy :: sessionId ${JSON.stringify(
          sessionDetails
        )} :: baseUrl ${baseUrl} :: ${error}`
      );
      throw error;
    }
  },
  destroyProxy: async (
    sessionId: string,
    deletePersistence: boolean,
    baseUrl: string
  ) => {
    try {
      await axiosInstance.post(baseUrl, {
        sessionId,
        deletePersistence,
      });
    } catch (error) {
      loggerUtils.error(
        `proxyService :: destroyProxy :: sessionId ${sessionId} :: deletePersistence ${deletePersistence} :: baseUrl ${baseUrl} :: ${error}`
      );
      throw error;
    }
  },
};
