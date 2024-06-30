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
  const [reconnectingAttempt, setReconnectingAttempt] = useState<number>(1);

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

    const iframeElement = document.createElement("iframe");

    iframeElement.src = createUrl();
    iframeElement.style.position = "absolute";
    iframeElement.style.width = "100%";
    iframeElement.style.height = "100%";
    iframeElement.style.top = "0";
    iframeElement.style.left = "0";
    iframeElement.style.right = "0";
    iframeElement.style.bottom = "0";
    iframeElement.style.overflow = "hidden";
    iframeElement.style.pointerEvents = access === "read" ? "none" : "auto";
    iframeElement.style.border = "none";

    const handleLoad = () => {
      hideLoader();
    };

    const handleError = () => {
      console.log("WorkspacesScreen :: handleError");
      iframeElement.src = createUrl();
    };

    iframeElement.addEventListener("load", handleLoad);
    iframeElement.addEventListener("error", handleError);

    const container = document.createElement("div");

    container.style.position = "fixed";
    container.style.top = "0";
    container.style.left = "0";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.overflow = "hidden";

    container.appendChild(iframeElement);

    document.body.appendChild(container);

    return () => {
      iframeElement.removeEventListener("load", handleLoad);
      iframeElement.removeEventListener("error", handleError);
      document.body.removeChild(container);
    };
  }, [access, reconnectingAttempt]);

  return null;
};

export default WorkspacesScreen;
