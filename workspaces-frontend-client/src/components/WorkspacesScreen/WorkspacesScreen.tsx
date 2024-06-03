import React, { useEffect } from "react";
import { useLoader } from "../../contexts/LoaderContext";

interface WorkspacesScreenProps {
  sessionId: string;
  participantId: string;
  agentHost: string;
  agentPort: string;
  agentSSLEnabled: boolean;
  access: string;
}

const WorkspacesScreen: React.FC<WorkspacesScreenProps> = ({
  sessionId,
  participantId,
  agentHost,
  agentPort,
  agentSSLEnabled,
  access
}) => {
  const { showLoader, hideLoader } = useLoader();
  const userName = "admin";
  const password = "admin";

  useEffect(() => {
    showLoader();

    const createIframeUrl = () => {
      const scheme = agentSSLEnabled ? "https" : "http";
      const rand = Math.floor((Math.random() * 1000000) + 1);
      return `${scheme}://${agentHost}:${agentPort}/api/v1/proxy/${sessionId}/${participantId}/?cast=1&usr=${userName}&pwd=${password}&uid=${rand}`;
    };

    const websocketUrl = `${agentSSLEnabled ? "wss" : "ws"}://${agentHost}:${agentPort}/api/v1/proxy/${sessionId}/${participantId}/ws?password=${password}`;
    const websocketClient = new WebSocket(websocketUrl);

    const iframe = document.createElement("iframe");

    iframe.src = createIframeUrl();
    iframe.style.position = "absolute";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.top = "0";
    iframe.style.left = "0";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.overflow = "hidden";
    iframe.style.pointerEvents = access === "read" ? "none" : "auto";
    iframe.style.border = "none";

    const handleLoad = () => {
      hideLoader();
    };

    const handleError = () => {
      console.log("WorkspacesScreen :: handleError");
      iframe.src = createIframeUrl();
    };

    const handleWebSocketClose = () => {
      console.log("WorkspacesScreen :: WebSocket disconnected. Reloading iframe...");
      iframe.src = createIframeUrl();
    };

    iframe.addEventListener("load", handleLoad);
    iframe.addEventListener("error", handleError);
    websocketClient.addEventListener("close", handleWebSocketClose);

    const container = document.createElement("div");

    container.style.position = "fixed";
    container.style.top = "0";
    container.style.left = "0";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.overflow = "hidden";

    container.appendChild(iframe);

    document.body.appendChild(container);

    return () => {
      iframe.removeEventListener("load", handleLoad);
      iframe.removeEventListener("error", handleError);
      websocketClient.removeEventListener("close", handleWebSocketClose);
      document.body.removeChild(container);
    };
  }, [access]);

  return null;
};

export default WorkspacesScreen;
