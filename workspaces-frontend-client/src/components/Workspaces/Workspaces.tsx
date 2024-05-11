import React, { useEffect, useState } from "react";
import socketIOClient, { Socket } from "socket.io-client";
import { workspacesWebsocketBaseUrl } from "../../utils/config";
import Cursors from "../Cursors/Cursors";
import WorkspacesScreen from "../WorkspacesScreen/WorkspacesScreen";
import { decodeJWTToken } from "../../utils/jwtUtils";
import { useParams } from "react-router-dom";
import { SESSIONS_STATUS } from "../../constants/commonConstants";
import toastUtils from "../../utils/toastUtils";

interface SessionAccess {
  session_status: number;
  access: string;
}

const Workspaces: React.FC = () => {
  const { token } = useParams();
  const [sessionId, setSessionId] = useState<string>("");
  const [participantId, setParticipantId] = useState<string>("");
  const [participantName, setParticipantName] = useState<string>("");
  const [agentHost, setAgentHost] = useState<string>("");
  const [agentPort, setAgentPort] = useState<string>("");
  const [agentSSLEnabled, setAgentSSLEnabled] = useState<boolean>(false);
  const [drawCursors, setDrawCursors] = useState<boolean>(false);
  const [sessionStatus, setSessionStatus] = useState<number>(0);
  const [access, setAccess] = useState<string>("");

  const randomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const cursorColor = randomColor();

  useEffect(() => {
    if (token) {
      const decodedToken = decodeJWTToken(token);
      if (decodedToken !== null) {
        setSessionId(decodedToken.sessionId);
        setParticipantId(decodedToken.participantId);
        setParticipantName(decodedToken.participantName);
        setAgentHost(decodedToken.agentHost);
        setAgentPort(decodedToken.agentPort);
        setAgentSSLEnabled(decodedToken.sslEnabled);
        setDrawCursors(decodedToken.drawCursors);
      } else {
        console.error("Workspaces :: Invalid Workspaces Token");
      }
    } else {
      console.error("Workspaces :: Workspaces Token not found");
    }
  }, []);

  useEffect(() => {
    if (!sessionId || !participantId || !participantName) return;

    const socket: Socket = socketIOClient(workspacesWebsocketBaseUrl);

    socket.emit("workspaces_access", sessionId, participantId);

    socket.on("workspaces_access", (response: string) => {
      const sessionAccess: SessionAccess = JSON.parse(response);
      if (sessionAccess.session_status != SESSIONS_STATUS.ACTIVE) {
        toastUtils.error("Session not found");
      } else if (!sessionAccess.access) {
        toastUtils.error("Session Unauthorized");
      } else {
        setSessionStatus(sessionAccess.session_status);
        setAccess(sessionAccess.access);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId, participantId, participantName]);

  return (
    <>
      {sessionStatus && access && (
        <>
          <WorkspacesScreen
            sessionId={sessionId}
            participantId={participantId}
            agentHost={agentHost}
            agentPort={agentPort}
            agentSSLEnabled={agentSSLEnabled}
          />
          {drawCursors && (
            <Cursors
              participantId={participantId}
              sessionId={sessionId}
              participantName={participantName}
              cursorColor={cursorColor}
            />
          )}
        </>
      )}
    </>
  );
};

export default Workspaces;
