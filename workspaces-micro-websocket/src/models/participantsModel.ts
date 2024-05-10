import { Model, Schema } from "mongoose";
import { IParticipant } from "../types/custom";
import { MONGO_COLLECTIONS, mongoUtils } from "workspaces-micro-commons";

const ParticipantModel: Model<IParticipant> =
  mongoUtils.createModel(
    MONGO_COLLECTIONS.PARTICIPANTS,
    new Schema<IParticipant>({
      participantId: { type: String, required: true },
      participantName: { type: String, required: true },
      sessionId: { type: String, required: true },
      role: { type: String, required: true },
      access: { type: String, required: true }
    }, {
      timestamps: true,
    })
  );

export { ParticipantModel };
