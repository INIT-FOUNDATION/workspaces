import { Model, Schema } from "mongoose";
import { IAgent } from "../types/custom";
import { MONGO_COLLECTIONS, mongoUtils } from "workspaces-micro-commons";

const AgentModel: Model<IAgent> =
  mongoUtils.createModel(
    MONGO_COLLECTIONS.AGENTS,
    new Schema<IAgent>({
      agentId: { type: String, required: true },
      agentName: { type: String, required: true },
      agentHost: { type: String, required: true },
      agentPort: { type: Number, required: true },
      sslEnabled: { type: Boolean, required: true },
      clientId: { type: String, required: true },
      isActive: { type: Boolean, required: true }
    }, {
      timestamps: true,
    })
  );

export { AgentModel };
