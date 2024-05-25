import { Model, Schema } from "mongoose";
import { ISession } from "../types/custom";
import { MONGO_COLLECTIONS, envUtils, mongoUtils } from "workspaces-micro-commons";
import { randomUUID } from "crypto";
import { SESSIONS_STATUS } from "../constants";
import { PARTICIPANT_ACCESS } from "../constants/participants";
import { sessionService } from "../api/services";

class Session {
  sessionId: string;
  clientId: string;
  agentId: string;
  timezone: string;
  startUrl: string;
  sharedMemory: number;
  drawCursors: boolean;
  darkMode: boolean;
  participantName: string;
  participantsAccess: string;
  imageId: string;
  imageName: string;
  saveSession: boolean;
  status: number;

  constructor(session: ISession) {
    this.sessionId = session.sessionId || randomUUID();
    this.clientId = session.clientId;
    this.agentId = session.agentId;
    this.timezone = session.timezone || envUtils.getStringEnvVariableOrDefault("WORKSPACES_DEFAULT_TIMEZONE", "Asia/Kolkata");
    this.startUrl = session.startUrl || envUtils.getStringEnvVariableOrDefault("WORKSPACES_DEFAULT_START_URL", "https://www.google.com")
    this.sharedMemory = session.sharedMemory || envUtils.getNumberEnvVariableOrDefault("WORKSPACES_SHARED_DEFAULT_MEMORY", 500);
    this.drawCursors = session.drawCursors || envUtils.getBooleanEnvVariableOrDefault("WORKSPACES_DRAW_CURSORS", false);
    this.darkMode = session.darkMode || envUtils.getBooleanEnvVariableOrDefault("WORKSPACES_DARK_MODE", false);
    this.participantName = session.participantName || sessionService.generateRandomParticipantName();
    this.participantsAccess = session.participantsAccess || envUtils.getStringEnvVariableOrDefault("WORKSPACES_DEFAULT_PARTICIPANTS_ACCESS", PARTICIPANT_ACCESS.READ_WRITE);
    this.imageId = session.imageId;
    this.imageName = session.imageName || envUtils.getStringEnvVariableOrDefault("WORKSPACES_DEFAULT_IMAGE", "chromium");
    this.saveSession = session.saveSession || false;
    this.status = SESSIONS_STATUS.ACTIVE;
  }
}

const SessionModel: Model<ISession> =
  mongoUtils.createModel(
    MONGO_COLLECTIONS.SESSIONS,
    new Schema<ISession>({
      sessionId: { type: String, required: true },
      clientId: { type: String, required: true },
      agentId: { type: String },
      timezone: { type: String, required: true },
      startUrl: { type: String, required: true },
      sharedMemory: { type: Number, required: true },
      drawCursors: { type: Boolean, required: true },
      darkMode: { type: Boolean, required: true },
      imageId: { type: String, required: true },
      saveSession: { type: Boolean, required: true },
      status: { type: Number, required: true }
    }, {
      timestamps: true,
    })
  );

export { Session, SessionModel };
