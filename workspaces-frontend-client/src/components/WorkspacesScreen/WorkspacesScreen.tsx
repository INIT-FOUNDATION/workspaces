import React, { useEffect } from "react";
import { useLoader } from "../../contexts/LoaderContext";

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
  agentHost,
  agentPort,
  agentSSLEnabled,
  access,
  tcpPort,
  sessionUserName,
  sessionPassword,
}) => {
  const { showLoader, hideLoader } = useLoader();

  useEffect(() => {
    showLoader();

    const createObjectUrl = () => {
      const scheme = agentSSLEnabled ? "https" : "http";
      const rand = Math.floor(Math.random() * 1000000) + 1;
      return `${scheme}://${agentHost}:${tcpPort}?cast=1&usr=${sessionUserName}&pwd=${sessionPassword}&uid=${rand}`;
    };

    const objectElement = document.createElement("object");

    objectElement.data = createObjectUrl();
    objectElement.type = "text/html";
    objectElement.style.position = "absolute";
    objectElement.style.width = "100%";
    objectElement.style.height = "100%";
    objectElement.style.top = "0";
    objectElement.style.left = "0";
    objectElement.style.right = "0";
    objectElement.style.bottom = "0";
    objectElement.style.overflow = "hidden";
    objectElement.style.pointerEvents = access === "read" ? "none" : "auto";
    objectElement.style.border = "none";

    const handleLoad = () => {
      hideLoader();
    };

    const handleError = () => {
      console.log("WorkspacesScreen :: handleError");
      objectElement.data = createObjectUrl();
    };

    objectElement.addEventListener("load", handleLoad);
    objectElement.addEventListener("error", handleError);

    const container = document.createElement("div");

    container.style.position = "fixed";
    container.style.top = "0";
    container.style.left = "0";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.overflow = "hidden";

    container.appendChild(objectElement);

    document.body.appendChild(container);

    return () => {
      objectElement.removeEventListener("load", handleLoad);
      objectElement.removeEventListener("error", handleError);
      document.body.removeChild(container);
    };
  }, [access]);

  return null;
};

export default WorkspacesScreen;
