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
  tcpPortRange: string;
  udpPortRange: string;

  constructor(agent: IAgent) {
    this.agentId = agent.agentId || randomUUID();
    this.agentName = agent.agentName || agentsService.generateAgentName()
    this.agentHost = agent.agentHost;
    this.agentPort = agent.agentPort || 443;
    this.sslEnabled = agent.sslEnabled != undefined ? agent.sslEnabled : true;
    this.clientId = agent.clientId;
    this.isActive = AGENTS_STATUS.ACTIVE;
    this.tcpPortRange = agent.tcpPortRange ? agent.tcpPortRange : envUtils.getStringEnvVariableOrDefault("WORKSPACES_AGENT_TCP_PORT_RANGE", "8000-9000");
    this.udpPortRange = agent.udpPortRange ? agent.udpPortRange : envUtils.getStringEnvVariableOrDefault("WORKSPACES_AGENT_UDP_PORT_RANGE", "9100-10000");
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
      tcpPortRange: { type: String, required: true },
      udpPortRange: { type: String, required: true }
    }, {
      timestamps: true,
    })
  );

export { Agent, AgentModel };
