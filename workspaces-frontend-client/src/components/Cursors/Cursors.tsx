import React, { useEffect, useState } from "react";
import useMousePosition from "../../hooks/MousePosition";
import Cursor from "../../shared/Cursor/Cursor";
import { useSocket } from "../../contexts/SocketContext";
import { workspacesWebsocketBaseUrl } from "../../utils/config";

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
  const socket = useSocket(workspacesWebsocketBaseUrl);
  const [cursors, setCursors] = useState<any[]>([]);
  const { x, y } = useMousePosition();

  useEffect(() => {
    if (!socket) return;

    socket.on("workspaces_cursors", (data: any) => {
      const parsedCursors = JSON.parse(data);
      parsedCursors.cursors =
        parsedCursors.cursors.length > 0 &&
        parsedCursors.cursors.filter(
          (cursor: any) => JSON.parse(cursor).participantId !== participantId
        );
      setCursors(parsedCursors.cursors);
    });

    return () => {
      socket.off("workspaces_cursors");
    };
  }, [socket, participantId]);

  useEffect(() => {
    if (!socket || x === null || y === null) return;

    const workspaceContent = document.documentElement;
    const workspaceRect = workspaceContent.getBoundingClientRect();
    const adjustedX = Math.max(
      Math.min(x - workspaceRect.left, workspaceRect.width),
      0
    );
    const adjustedY = Math.max(
      Math.min(y - workspaceRect.top, workspaceRect.height),
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
  }, [socket, x, y]);

  return (
    <div style={{ position: "absolute", top: 0, left: 0, zIndex: 10 }}>
      {cursors.length > 0 &&
        cursors.map((cursor, cursorIndex) => (
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
