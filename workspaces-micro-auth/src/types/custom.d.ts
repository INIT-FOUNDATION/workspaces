import { Document } from "mongoose";

export interface IClient extends Document {
    clientId: string;
    clientName: string;
    clientSecret: string;
    sessionsLimit: number;
    sessionConcurrencyLimit: number;
    accessExpiryDate: string;
    isActive: boolean;
}

export interface ClientDetails {
  clientId: string;
  clientName: string;
  clientSecret: string;
  sessionsLimit: number;
  sessionConcurrencyLimit: number;
  accessExpiryDate: string;
  isActive: boolean;
}