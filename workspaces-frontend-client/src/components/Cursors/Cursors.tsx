import React, { useEffect, useState } from "react";
import socketIOClient from "socket.io-client";
import { workspacesWebsocketBaseUrl } from "../../utils/config";
import Cursor from "./Cursor/Cursor";

interface CursorsProps {
  participantId: string | null;
  sessionId: string | null;
  participantName: string | null;
  cursorColor: string;
  containerRef: React.RefObject<HTMLDivElement>;
}

const Cursors: React.FC<CursorsProps> = ({
  sessionId,
  participantId,
  participantName,
  cursorColor,
  containerRef,
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

      if (containerRef.current) {
        const workspaceRect = containerRef.current.getBoundingClientRect();
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
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [socket, containerRef]);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: "2",
        pointerEvents: "none",
      }}
    >
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
