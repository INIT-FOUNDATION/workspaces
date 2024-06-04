import { Model, Schema } from "mongoose";
import { IAgent } from "../types/custom";
import { MONGO_COLLECTIONS, envUtils, mongoUtils } from "workspaces-micro-commons";
import { randomUUID } from "crypto";
import { AGENTS_STATUS } from "../constants";
import { agentsService } from "../api/services";

class Agent {
  agentId: string;
  agentName: string;
  agentHost: string;
  agentPort: number;
  sslEnabled: boolean;
  clientId: string;
  isActive: boolean;

  constructor(agent: IAgent) {
    this.agentId = agent.agentId || randomUUID();
    this.agentName = agent.agentName || agentsService.generateAgentName()
    this.agentHost = agent.agentHost;
    this.agentPort = agent.agentPort || 443;
    this.sslEnabled = agent.sslEnabled != undefined ? agent.sslEnabled : true;
    this.clientId = agent.clientId;
    this.isActive = AGENTS_STATUS.ACTIVE;
  }
}

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
      isActive: { type: Boolean, required: true },
    }, {
      timestamps: true,
    })
  );

export { Agent, AgentModel };
