import React, { useEffect, useState } from "react";
import { useLoader } from "../../contexts/LoaderContext";
import WebsocketHeartbeatJs from 'websocket-heartbeat-js';

interface WorkspacesScreenProps {
  sessionId: string;
  participantId: string;
  agentHost: string;
  agentPort: string;
  agentSSLEnabled: boolean;
  access: string;
  tcpPort: number;
  udpPort: number;
  sessionUserName: string;
  sessionPassword: string;
}

const WorkspacesScreen: React.FC<WorkspacesScreenProps> = ({
  sessionId,
  participantId,
  agentHost,
  agentPort,
  agentSSLEnabled,
  access,
  tcpPort,
  sessionUserName,
  sessionPassword,
}) => {
  const { showLoader, hideLoader } = useLoader();
  const [reconnectingAttempt, setReconnectingAttempt] = useState(() => {
    const storedAttempt = sessionStorage.getItem('workspaces:reconnectingAttempt');
    return storedAttempt ? parseInt(storedAttempt, 10) : 1;
  });

  useEffect(() => {
    sessionStorage.setItem('workspaces:reconnectingAttempt', reconnectingAttempt.toString());
  }, [reconnectingAttempt]);

  useEffect(() => {
    let websocketHeartbeatJs = new WebsocketHeartbeatJs({
      url: reconnectingAttempt === 1 ? `${agentSSLEnabled ? "wss" : "ws"}://${agentHost}:${tcpPort}/ws?password=${sessionPassword}` : `${agentSSLEnabled ? "wss" : "ws"}://${agentHost}:${agentPort}/api/v1/proxy/${sessionId}/${participantId}/ws?password=${sessionPassword}`,
      pingTimeout: 15000,
      pongTimeout: 10000,
      reconnectTimeout: 1000,
      pingMsg: "heartbeat"
    });
    websocketHeartbeatJs.onopen = function () {
      console.log('WorkspacesScreen :: Hearbeat :: Connected');
      websocketHeartbeatJs.send('hello server');
    }
    websocketHeartbeatJs.onreconnect = function () {
      console.log('WorkspacesScreen :: Hearbeat :: Reconnecting');
    }
    websocketHeartbeatJs.onerror = function () {
      setReconnectingAttempt((reconnectingAttempt) => reconnectingAttempt + 1);
      console.log('WorkspacesScreen :: Hearbeat :: Error');
    }

    return () => {
      if (websocketHeartbeatJs) websocketHeartbeatJs.close();
    };
  }, [])

  useEffect(() => {
    showLoader();
    const createUrl = () => {
      const scheme = agentSSLEnabled ? "https" : "http";
      const rand = Math.floor(Math.random() * 1000000) + 1;
      if (tcpPort && tcpPort > 0 && reconnectingAttempt === 1) {
        return `${scheme}://${agentHost}:${tcpPort}/?cast=1&usr=${sessionUserName}&pwd=${sessionPassword}&uid=${rand}`;
      } else {
        return `${scheme}://${agentHost}:${agentPort}/api/v1/proxy/${sessionId}/${participantId}/?cast=1&usr=${sessionUserName}&pwd=${sessionPassword}&uid=${rand}`;
      }
    };

    const iframeElement = document.getElementById("workspace-iframe") as HTMLIFrameElement;

    const handleLoad = () => {
      hideLoader();
    };

    const handleError = () => {
      console.log("WorkspacesScreen :: handleError");
      iframeElement.src = createUrl();
    };

    iframeElement.addEventListener("load", handleLoad);
    iframeElement.addEventListener("error", handleError);

    iframeElement.src = createUrl();
    iframeElement.style.pointerEvents = access === "read" ? "none" : "auto";

    return () => {
      iframeElement.removeEventListener("load", handleLoad);
      iframeElement.removeEventListener("error", handleError);
    };
  }, [access, reconnectingAttempt]);

  return (
    <div style={{ position: "fixed", top: "0", left: "0", width: "100%", height: "100%", overflow: "hidden" }}>
      <iframe
        id="workspace-iframe"
        style={{ position: "absolute", width: "100%", height: "100%", top: "0", left: "0", right: "0", bottom: "0", overflow: "hidden", border: "none" }}
      />
    </div>
  );
};

export default WorkspacesScreen;
