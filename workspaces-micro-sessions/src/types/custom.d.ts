import { Document } from "mongoose";

export interface IAgent extends Document {
  agentId: string;
  agentName: string;
  agentHost: string;
  agentPort: number;
  sslEnabled: boolean;
  clientId: string;
  isActive: boolean;
}

export interface AgentDetails {
  agentId: string;
  agentName: string;
  agentHost: string;
  agentPort: number;
  sslEnabled: boolean;
  clientId: string;
  isActive: boolean;
}

export interface ISession extends Document {
  sessionId: string;
  clientId: string;
  agentId: string;
  timezone: string;
  startUrl: string;
  participantsAccess: string;
  drawCursors: boolean;
  darkMode: boolean;
  sharedMemory: number;
  saveSession: boolean;
  participantName: string;
  imageId: string;
  imageName: string;
  status: number;
  tcpPort: number;
  udpPort: number;
  adminPassword: string;
  userPassword: string;
  environmentVariablesUsed: string[]
}

export interface SessionDetails {
  sessionId: string;
  clientId: string;
  agentId: string;
  timezone: string;
  startUrl: string;
  participantsAccess: string;
  drawCursors: boolean;
  darkMode: boolean;
  sharedMemory: number;
  saveSession: boolean;
  imageId: string;
  imageName: string;
  participantName: string;
  status: number;
  tcpPort: number;
  udpPort: number;
  adminPassword: string;
  userPassword: string;
  environmentVariablesUsed: string[]
}

export interface IParticipant extends Document {
  participantId: string;
  participantName: string;
  sessionId: string;
  role: string;
  access: string;
}

export interface ParticipantDetails {
  participantId: string;
  participantName: string;
  sessionId: string;
  role: string;
  access: string;
}

export interface IImage extends Document {
  imageId: string;
  imageName: string;
  imageRepo: string;
  imageTag: string;
  registryHost: string;
  registryUsername: string;
  registryPassword: string;
  isActive: boolean;
  clientId: string;
  tcpPortRange: string;
  udpPortRange: string;
  volumeMountPath: string;
  defaultEnvs: string[];
  proxyUrlPath: string;
}

export interface ImageDetails {
  imageId: string;
  imageName: string;
  imageRepo: string;
  imageTag: string;
  registryHost: string;
  registryUsername: string;
  registryPassword: string;
  isActive: boolean;
  clientId: string;
  tcpPortRange: string;
  udpPortRange: string;
  volumeMountPath: string;
  defaultEnvs: string[];
  proxyUrlPath: string;
}