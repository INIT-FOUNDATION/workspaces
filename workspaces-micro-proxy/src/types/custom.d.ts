import { Document } from "mongoose";

export interface IImage extends Document {
    imageId: string;
    imageName: string;
    imageRepo: string;
    imageTag: string;
    registryHost: string;
    registryUsername: string;
    registryPassword: string;
    isActive: boolean;
    tcpPortRange: string;
    udpPortRange: string;
    volumeMountPath: string;
    defaultEnvs: string[];
    proxyUrlPath: string;
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
    environmentVariablesUsed: string[];
    adminPassword: string;
    userPassword: string;
  }

  export interface IAgent extends Document {
    agentId: string;
    agentName: string;
    agentHost: string;
    agentPort: number;
    sslEnabled: boolean;
    clientId: string;
    isActive: boolean;
  }

  export interface IParticipant extends Document {
    participantId: string;
    participantName: string;
    sessionId: string;
    role: string;
    access: string;
  }