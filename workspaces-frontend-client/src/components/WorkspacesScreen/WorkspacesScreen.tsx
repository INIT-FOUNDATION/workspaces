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
  
  useEffect(() => {
    showLoader();

    const scheme = agentSSLEnabled ? "https" : "http";
    const rand = Math.floor((Math.random()*1000000)+1);
    const url = `${scheme}://${agentHost}:${agentPort}/api/v1/proxy/${sessionId}/${participantId}/?cast=1&usr=admin&pwd=admin&uid=${rand}`;
    const iframe = document.createElement("iframe");
    iframe.src = url;
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
    
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "0";
    container.style.left = "0";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.overflow = "hidden";

    container.appendChild(iframe);
    document.body.appendChild(container);

    const handleLoad = () => {
      hideLoader();
    };

    const handleError = () => {
      console.log("WorkspacesScreen :: handleError")
      iframe.src = url;
    };

    iframe.addEventListener("load", handleLoad);
    iframe.addEventListener("error", handleError);

    return () => {
      iframe.removeEventListener("load", handleLoad);
      iframe.removeEventListener("error", handleError);
      document.body.removeChild(container);
    };
  }, [
    access
  ]);

  return null;
};

export default WorkspacesScreen;
