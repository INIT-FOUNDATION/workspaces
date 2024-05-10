import { CACHE_TTL, loggerUtils, mongoUtils, redisUtils } from "workspaces-micro-commons";
import { IParticipant, ISession } from "../../types/custom";
import { ParticipantModel, SessionModel } from "../../models";
import { SESSIONS_STATUS } from "../../constants/sessionsStatus";

export const websocketService = {
  sessionExistsById: async (sessionId: string): Promise<boolean> => {
    try {
      const exists: boolean = await mongoUtils.existsDocument<ISession>(SessionModel, {
        sessionId,
        status: SESSIONS_STATUS.ACTIVE
      });
      return exists;
    } catch (error) {
      loggerUtils.error(`websocketService :: sessionExistsById :: sessionId :: ${sessionId} :: ${error}`);
      throw error;
    }
  },
  participantExistsById: async (participantId: string): Promise<boolean> => {
    try {
      const exists: boolean = await mongoUtils.existsDocument<IParticipant>(ParticipantModel, {
        participantId,
      });
      return exists;
    } catch (error) {
      loggerUtils.error(`websocketService :: participantExistsById :: participantId :: ${participantId} :: ${error}`);
      throw error;
    }
  },
  getParticipantById: async (participantId: string): Promise<IParticipant[]> => {
    try {
      const key = `PARTICIPANT|${participantId}`;
      const cachedData = await redisUtils.getKey(key);

      if (cachedData) {
        return JSON.parse(cachedData)
      }

      const participants: IParticipant[] = await mongoUtils.findDocumentsWithOptions<IParticipant>(ParticipantModel, {
        participantId,
      }, {
        _id: 0,
        __v: 0,
        createdAt: 0,
        updatedAt: 0
      }, {

      });

      await redisUtils.setKey(key, JSON.stringify(cachedData), CACHE_TTL.ONE_HOUR);
      return participants;
    } catch (error) {
      loggerUtils.error(`websocketService :: getParticipantById :: participantId :: ${participantId} :: ${error}`);
      throw error;
    }
  },
  handleWorkspacesAccess: async (socket: any, sessionId: string, participantId: string) => {
    try {
      const sessionExists: boolean = await websocketService.sessionExistsById(sessionId);
      if (!sessionExists) socket.emit("workspaces_access", JSON.stringify({
        session_status: SESSIONS_STATUS.INACTIVE,
        access: ""
      }))

      const participants: IParticipant[] = await websocketService.getParticipantById(participantId);
      if (participants.length == 0) socket.emit("workspaces_access", JSON.stringify({
        session_status: SESSIONS_STATUS.ACTIVE,
        access: ""
      }))

      const participant: IParticipant = participants[0];

      socket.emit("workspaces_access", JSON.stringify({
        session_status: SESSIONS_STATUS.ACTIVE,
        access: participant.access
      }))
    } catch (error) {
      loggerUtils.error(`websocketService :: handleWorkspacesAccess :: sessionId :: ${sessionId} :: participantId :: ${participantId} :: ${error}`);
      throw error;
    }
  },
  addWorkspacesCursors: async (socket: any, sessionId: string, participantName: string, xCoordinate: number, yCoordinate: number) => {
    try {
      const key = `PARTICIPANTS_CURSORS|${sessionId}`;
      const coordinates = {
        participantName,
        socketId: socket.id,
        xCoordinate,
        yCoordinate
      }
      await redisUtils.lPushKey(key, JSON.stringify(coordinates), CACHE_TTL.ONE_HOUR);

      const cursors = await redisUtils.lRangeKey(key, 0, -1);

      socket.emit("workspaces_cursors", JSON.stringify({ cursors }))
    } catch (error) {
      loggerUtils.error(`websocketService :: handleWorkspacesCursors :: sessionId :: ${sessionId} :: participantName :: ${participantName} :: xCoordinate :: ${xCoordinate} :: yCoordinate :: ${yCoordinate} :: ${error}`);
      throw error;
    }
  },
  removeWorkspaceCursors: async (socket: any, sessionId: string, participantName: string) => {
    try {
      const key = `PARTICIPANTS_CURSORS|${sessionId}`;
      await redisUtils.lRemKey(key, 0, JSON.stringify({ socketId: socket.id }));
    } catch (error) {
      loggerUtils.error(`websocketService :: removeWorkspaceCursors :: sessionId :: ${sessionId} :: participantName :: ${participantName} :: ${error}`);
      throw error;
    }
  },
};