import { Model, Schema } from "mongoose";
import { IClient } from "../types/custom";
import { mongoUtils } from "workspaces-micro-commons";
import { CLIENT_STATUS } from "../constants";

class Client {
  clientId: string;
  clientName: string;
  clientSecret: string;
  sessionsLimit: number;
  sessionConcurrencyLimit: number;
  accessExpiryDate: string;
  isActive: boolean;

  constructor(client: IClient) {
    this.clientId = client.clientId;
    this.clientName = client.clientName;
    this.clientSecret = client.clientSecret;
    this.sessionsLimit = client.sessionsLimit;
    this.sessionConcurrencyLimit = client.sessionConcurrencyLimit;
    this.accessExpiryDate = client.accessExpiryDate;
    this.isActive = client.isActive || CLIENT_STATUS.ACTIVE;
  }
}

const ClientModel: Model<IClient> =
  mongoUtils.createModel(
    "clients",
    new Schema<IClient>({
      clientId: { type: String, required: true },
      clientName: { type: String, required: true },
      clientSecret: { type: String, required: true },
      sessionsLimit: { type: Number, required: true },
      sessionConcurrencyLimit: { type: Number, required: true },
      accessExpiryDate: { type: String, required: true },
      isActive: { type: Boolean, required: true }
    }, {
      timestamps: true,
    })
  );

export { Client, ClientModel };
