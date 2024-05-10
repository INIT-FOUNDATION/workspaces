import { Document } from "mongoose";

export interface ISession extends Document {
  sessionId: string;
  clientId: string;
  agentId: string;
  timezone: string;
  startUrl: string;
  participantsAccess: string;
  drawCursors: boolean;
  sharedMemory: number;
  saveSession: boolean;
  participantName: string;
  imageId: string;
  imageName: string;
  status: number;
}

export interface IParticipant extends Document {
  participantId: string;
  participantName: string;
  sessionId: string;
  role: string;
  access: string;
}