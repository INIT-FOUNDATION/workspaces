import React, { CSSProperties, useEffect } from "react";

interface WorkspacesScreenProps {
  sessionId: string;
  participantId: string;
  agentHost: string;
  agentPort: string;
  agentSSLEnabled: boolean;
}

const WorkspacesScreen: React.FC<WorkspacesScreenProps> = ({
  sessionId,
  participantId,
  agentHost,
  agentPort,
  agentSSLEnabled,
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

    document.body.appendChild(iframe);

    return () => {
      document.body.removeChild(iframe);
    };
  }, []);

  return null;
};

export default WorkspacesScreen;
