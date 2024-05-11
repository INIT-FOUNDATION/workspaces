import { loggerUtils } from "workspaces-micro-commons";
import { websocketService } from "../services/websocketService";

export const websocketController = {
  handleSocketConnection: async (socket: any) => {
    try {
      loggerUtils.info(
        `websocketController :: handleSocketConnection :: socket connected :: socket ${socket.id}`
      );

      socket.on(
        "workspaces_access",
        (sessionId: string, participantId: string) => {
          loggerUtils.info(
            `websocketController :: handleSocketConnection :: requesting workspaces access for sessionId ${sessionId} :: participantId ${participantId}`
          );
          websocketService.handleWorkspacesAccess(
            socket,
            sessionId,
            participantId
          );
        }
      );

      socket.on(
        "workspaces_cursors",
        async (
          sessionId: string,
          participantName: string,
          xCoordinate: number,
          yCoordinate: number
        ) => {
          websocketService.addWorkspacesCursors(
            socket,
            sessionId,
            participantName,
            xCoordinate,
            yCoordinate
          );
        }
      );

      socket.on("disconnect", () => {
        websocketController.handleSocketDisconnection(socket);
      });
    } catch (error) {
      loggerUtils.info(
        `websocketController :: handleSocketConnection :: socket connection failed :: socket ${error}`
      );
    }
  },
  handleSocketDisconnection: async (socket: any) => {
    try {
      loggerUtils.info(
        `websocketController :: handleSocketDisconnection :: socket disconnected :: socket ${socket.id}`
      );
    } catch (error) {
      loggerUtils.info(
        `websocketController :: handleSocketDisconnection :: socket disconnection failed :: socket ${error}`
      );
    }
  },
};
