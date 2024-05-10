import { getStringEnvVariableOrDefault } from "../utils/config/envUtils";

export const ENCRYPTION_KEY = getStringEnvVariableOrDefault(
  "WORKSPACES_ENCRYPTION_KEY",
  "WORKSPACES@123!@#"
);

export const JWT_SECRET = getStringEnvVariableOrDefault(
  "WORKSPACES_JWT_SECRET",
  "WORKSPACES@123!@#"
);