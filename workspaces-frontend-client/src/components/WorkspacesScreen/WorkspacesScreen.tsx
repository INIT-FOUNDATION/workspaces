import React, { useEffect } from "react";

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
  useEffect(() => {
    const scheme = agentSSLEnabled ? "https" : "http";
    const url = `${scheme}://${agentHost}:${agentPort}/api/v1/proxy/${sessionId}/${participantId}/`;
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

    return () => {
      document.body.removeChild(container);
    };
  }, [access]);

  return null;
};

export default WorkspacesScreen;