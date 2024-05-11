import { jwtDecode } from "jwt-decode";

export interface DecodedToken {
  sessionId: string;
  participantId: string;
  participantName: string;
  agentHost: string;
  agentPort: string;
  sslEnabled: boolean;
}

export const decodeJWTToken = (token: string): DecodedToken | null => {
  try {
    const decodedToken: any = jwtDecode(token);
    const {
      sessionId,
      participantId,
      participantName,
      agentHost,
      agentPort,
      sslEnabled,
    } = decodedToken;
    return {
      sessionId,
      participantId,
      participantName,
      agentHost,
      agentPort,
      sslEnabled,
    };
  } catch (error) {
    console.error(
      "jwtUtils :: decodeJWTToken :: Error decoding JWT token:",
      error
    );
    return null;
  }
};
