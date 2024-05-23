import React, { useEffect, forwardRef, Ref } from "react";

interface WorkspacesScreenProps {
  sessionId: string;
  participantId: string;
  agentHost: string;
  agentPort: string;
  agentSSLEnabled: boolean;
  access: string;
}

const WorkspacesScreen = forwardRef<HTMLDivElement, WorkspacesScreenProps>(({
  sessionId,
  participantId,
  agentHost,
  agentPort,
  agentSSLEnabled,
  access
}, ref) => {
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

    const container = ref as React.MutableRefObject<HTMLDivElement>;
    if (container.current) {
      container.current.style.position = "fixed";
      container.current.style.top = "0";
      container.current.style.left = "0";
      container.current.style.width = "100%";
      container.current.style.height = "100%";
      container.current.style.overflow = "hidden";
      container.current.appendChild(iframe);
    }

    return () => {
      if (container.current) {
        container.current.removeChild(iframe);
      }
    };
  }, [access]);

  return null
});

export default WorkspacesScreen;
