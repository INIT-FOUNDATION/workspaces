import React, { useEffect, useState } from "react";
import Cursors from "../Cursors/Cursors";
import WorkspacesScreen from "../WorkspacesScreen/WorkspacesScreen";
import { useParams } from "react-router-dom";
import { SESSIONS_STATUS } from "../../constants/commonConstants";
import toastUtils from "../../utils/toastUtils";
import { useSocket } from "../../contexts/SocketContext";
import SessionsService from "../../services/SessionsService";
import { useLoader } from "../../contexts/LoaderContext";
import { SessionAccess } from "../../types/custom";

const Workspaces: React.FC = () => {
  const { token } = useParams();
  const socket = useSocket();
  const { showLoader, hideLoader } = useLoader();

  const [sessionDetails, setSessionDetails] = useState({
    sessionId: "",
    participantId: "",
    participantName: "",
    agentHost: "",
    agentPort: "",
    sslEnabled: false,
    drawCursors: false,
    tcpPort: 0,
    sessionUserName: "",
    sessionPassword: "",
    sessionStatus: 0,
    access: "",
  });

  const randomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const cursorColor = randomColor();

  const fetchSessionDetails = async (token: string) => {
    try {
      showLoader();
      const response = await SessionsService.getProxyDetails(token);
      hideLoader();
      if (response.data && response.data.data) {
        setSessionDetails((prevDetails) => ({
          ...prevDetails,
          ...response.data.data,
        }));
      }
    } catch (error) {
      console.error("Workspaces :: Error fetching proxy details :: ", error);
      hideLoader();
    }
  };

  useEffect(() => {
    if (token) {
      fetchSessionDetails(token);
    } else {
      console.error("Workspaces :: Workspaces Token not found");
    }
  }, [token]);

  useEffect(() => {
    const { sessionId, participantId, participantName } = sessionDetails;
    if (!sessionId || !participantId || !participantName || !socket) return;

    socket.emit("workspaces_access", sessionId, participantId);

    socket.on("workspaces_access", (response: string) => {
      const sessionAccess: SessionAccess = JSON.parse(response);
      console.log("Workspaces :: sessionAccess :: ", sessionAccess)
      if (sessionAccess.session_status !== SESSIONS_STATUS.ACTIVE) {
        toastUtils.error("Session not found");
      } else if (!sessionAccess.access) {
        toastUtils.error("Session Unauthorized");
      } else {
        setSessionDetails((prevDetails) => ({
          ...prevDetails,
          sessionStatus: sessionAccess.session_status,
          access: sessionAccess.access,
        }));
      }
    });

    return () => {
      socket.off("workspaces_access");
      socket.disconnect();
    };
  }, [sessionDetails.sessionId, sessionDetails.participantId, sessionDetails.participantName, socket]);

  const {
    sessionId,
    participantId,
    participantName,
    agentHost,
    agentPort,
    sslEnabled,
    drawCursors,
    tcpPort,
    sessionUserName,
    sessionPassword,
    sessionStatus,
    access,
  } = sessionDetails;

  return (
    <div style={{ width: "100%", height: "100%" }}>
      {sessionStatus !== 0 && access && (
        <>
          <WorkspacesScreen
            sessionId={sessionId}
            participantId={participantId}
            agentHost={agentHost}
            agentPort={agentPort}
            agentSSLEnabled={sslEnabled}
            access={access}
            tcpPort={tcpPort}
            sessionUserName={sessionUserName}
            sessionPassword={sessionPassword}
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
    </div>
  );
};

export default Workspaces;
