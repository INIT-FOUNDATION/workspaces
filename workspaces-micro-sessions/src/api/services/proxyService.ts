import {
  loggerUtils,
} from "workspaces-micro-commons";
import axios from "axios";

export const proxyService = {
  createProxy: async (sessionId: string, imageId: string, baseUrl: string) => {
    try {
      await axios.post(baseUrl, {
        sessionId,
        imageId
      })
    } catch (error) {
      loggerUtils.error(`proxyService :: proxyService :: sessionId ${sessionId} :: imageId ${imageId} :: baseUrl ${baseUrl} :: ${error}`);
      throw error;
    }
  },
  destroyProxy: async (sessionId: string, deletePersistence: boolean, baseUrl: string) => {
    try {
      await axios.post(baseUrl, {
        sessionId,
        deletePersistence
      })
    } catch (error) {
      loggerUtils.error(`proxyService :: destroyProxy :: sessionId ${sessionId} :: deletePersistence ${deletePersistence} :: baseUrl ${baseUrl} :: ${error}`);
      throw error;
    }
  }
};