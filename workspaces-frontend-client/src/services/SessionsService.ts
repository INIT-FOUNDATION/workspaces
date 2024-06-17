import { get } from "../api";

const SessionsService = {
  getProxyDetails: async (token: string) => {
    return await get('/api/v1/sessions/proxyDetails', {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
  },
  getAccessBySessionIdAndParticipantId: async (sessionid: string, participantId: string) => {
    return await get(`/api/v1/sessions/access/${participantId}/${sessionid}`);
  }
};

export default SessionsService;
