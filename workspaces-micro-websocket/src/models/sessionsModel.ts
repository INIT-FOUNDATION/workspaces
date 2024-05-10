import { Model, Schema } from "mongoose";
import { ISession } from "../types/custom";
import { MONGO_COLLECTIONS, mongoUtils } from "workspaces-micro-commons";

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
      imageId: { type: String, required: true },
      saveSession: { type: Boolean, required: true },
      status: { type: Number, required: true }
    }, {
      timestamps: true,
    })
  );

export { SessionModel };
