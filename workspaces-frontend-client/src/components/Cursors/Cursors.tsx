import React, { CSSProperties, useEffect, useState } from "react";
import socketIOClient from "socket.io-client";
import { workspacesWebsocketBaseUrl } from "../../utils/config";
import Cursor from "./Cursor/Cursor";

interface CursorProps {
  participantId: string | null;
  sessionId: string | null;
  participantName: string | null;
  cursorColor: string;
}

const Cursors: React.FC<CursorProps> = ({
  sessionId,
  participantId,
  participantName,
  cursorColor,
}) => {
  const [cursors, setCursors] = useState<any[]>([]);
  const [socket, setSocket] = useState<any>(null);

  useEffect(() => {
    const newSocket = socketIOClient(workspacesWebsocketBaseUrl);
    setSocket(newSocket);

    newSocket.on("workspaces_cursors", (data: any) => {
      const parsedCursors = JSON.parse(data);
      setCursors(parsedCursors.cursors);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleMouseMove = (event: MouseEvent) => {
      const { clientX, clientY } = event;

      const workspaceContent = document.documentElement;
      const workspaceRect = workspaceContent.getBoundingClientRect();
      const adjustedX = Math.max(
        Math.min(clientX - workspaceRect.left, workspaceRect.width),
        0
      );
      const adjustedY = Math.max(
        Math.min(clientY - workspaceRect.top, workspaceRect.height),
        0
      );

      socket.emit(
        "workspaces_cursors",
        sessionId,
        participantId,
        participantName,
        adjustedX,
        adjustedY
      );
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [socket]);

  return (
    <div style={{ position: "absolute", top: 0, left: 0, zIndex: "2" }}>
      {cursors.map((cursor, cursorIndex) => (
        <Cursor
          key={cursorIndex}
          x={JSON.parse(cursor).xCoordinate}
          y={JSON.parse(cursor).yCoordinate}
          label={JSON.parse(cursor).participantName}
          color={cursorColor}
        />
      ))}
    </div>
  );
};

export default Cursors;
