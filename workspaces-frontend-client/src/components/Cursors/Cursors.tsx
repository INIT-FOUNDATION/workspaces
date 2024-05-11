import React, { useEffect, useState } from "react";
import socketIOClient from "socket.io-client";
import { workspacesWebsocketBaseUrl } from "../../utils/config";

interface CursorProps {
  sessionId: string | null;
  participantId: string | null;
  participantName: string | null;
}

const Cursors: React.FC<CursorProps> = ({ sessionId, participantId }) => {
  const [cursors, setCursors] = useState<any[]>([]);

  useEffect(() => {
    const socket = socketIOClient(workspacesWebsocketBaseUrl);

    socket.on("workspaces_cursors", (data: any) => {
      setCursors((prevCursors) => [...prevCursors, data]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return <div></div>;
};

export default Cursors;
