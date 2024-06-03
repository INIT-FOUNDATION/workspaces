import React, { useEffect, useState } from "react";
import Cursors from "../Cursors/Cursors";
import WorkspacesScreen from "../WorkspacesScreen/WorkspacesScreen";
import { useParams } from "react-router-dom";
import { SESSIONS_STATUS } from "../../constants/commonConstants";
import toastUtils from "../../utils/toastUtils";
import { useSocket } from "../../contexts/SocketContext";
import SessionsService from "../../services/SessionsService";
import { useLoader } from "../../contexts/LoaderContext";
import { workspacesWebsocketBaseUrl } from "../../utils/config";

interface SessionAccess {
  session_status: number;
  access: string;
}

const Workspaces: React.FC = () => {
  const { token } = useParams();
  const socket = useSocket(workspacesWebsocketBaseUrl);
  const [sessionId, setSessionId] = useState<string>("");
  const [participantId, setParticipantId] = useState<string>("");
  const [participantName, setParticipantName] = useState<string>("");
  const [agentHost, setAgentHost] = useState<string>("");
  const [agentPort, setAgentPort] = useState<string>("");
  const [agentSSLEnabled, setAgentSSLEnabled] = useState<boolean>(false);
  const [drawCursors, setDrawCursors] = useState<boolean>(false);
  const [sessionStatus, setSessionStatus] = useState<number>(0);
  const [access, setAccess] = useState<string>("");
  const { showLoader, hideLoader } = useLoader();

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
      (async () => {
        try {
          showLoader();
          const response = await SessionsService.getProxyDetails(token);
          hideLoader();
          if (response.data && response.data.data) {
            setSessionId(response.data.data.sessionId);
            setParticipantId(response.data.data.participantId);
            setParticipantName(response.data.data.participantName);
            setAgentHost(response.data.data.agentHost);
            setAgentPort(response.data.data.agentPort);
            setAgentSSLEnabled(response.data.data.sslEnabled);
            setDrawCursors(response.data.data.drawCursors);
          }
        } catch (error) {
          console.error("Workspaces :: Error fetching proxy details :: ", error);
        }
      })();
    } else {
      console.error("Workspaces :: Workspaces Token not found");
    }
  }, [token]);

  useEffect(() => {
    if (!sessionId || !participantId || !participantName || !socket) return;

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
      socket.off("workspaces_access");
    };
  }, [sessionId, participantId, participantName, socket]);

  return (
    <>
      {sessionStatus != 0 && access && (
        <>
          <WorkspacesScreen
            sessionId={sessionId}
            participantId={participantId}
            agentHost={agentHost}
            agentPort={agentPort}
            agentSSLEnabled={agentSSLEnabled}
            access={access}
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
