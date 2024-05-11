import React, { useEffect, useState } from "react";
import socketIOClient from "socket.io-client";
import { workspacesWebsocketBaseUrl } from "../../utils/config";

interface CursorProps {
  participantId: string | null;
  sessionId: string | null;
  participantName: string | null;
}

const Cursors: React.FC<CursorProps> = ({
  sessionId,
  participantId,
  participantName,
}) => {
  const [cursors, setCursors] = useState<any[]>([]);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    const newSocket = socketIOClient(workspacesWebsocketBaseUrl);
    setSocket(newSocket);

    newSocket.on("workspaces_cursors", (data: any) => {
      setCursors((prevCursors) => [...prevCursors, data]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleMouseMove = (event: MouseEvent) => {
      const { clientX, clientY } = event;
      socket.emit(
        "workspaces_cursors",
        sessionId,
        participantId,
        participantName,
        clientX,
        clientY
      );
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [socket]);

  return <div></div>;
};

export default Cursors;
