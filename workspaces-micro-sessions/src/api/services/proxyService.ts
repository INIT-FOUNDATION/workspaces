import { loggerUtils } from "workspaces-micro-commons";
import axios from "axios";
import { SessionDetails } from "../../types/custom";

export const proxyService = {
  createProxy: async (sessionDetails: SessionDetails, baseUrl: string) => {
    try {
      await axios.post(baseUrl, sessionDetails);
    } catch (error) {
      loggerUtils.error(
        `proxyService :: proxyService :: sessionId ${JSON.stringify(
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
      await axios.post(baseUrl, {
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
