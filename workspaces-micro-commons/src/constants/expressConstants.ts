import { envUtils } from "../utils/config";

const ALLOWED_ORIGINS = envUtils.getStringEnvVariableOrDefault("WORKSPACES_ALLOWED_ORIGINS", "*");
const ALLOWED_METHODS = envUtils.getStringEnvVariableOrDefault("WORKSPACES_ALLOWED_METHODS", "GET,POST,OPTIONS");
const ALLOWED_HEADERS = envUtils.getStringEnvVariableOrDefault("WORKSPACES_ALLOWED_HEADERS", "Content-Type, Authorization");
const RISKY_CHARACTERS = envUtils.getStringEnvVariableOrDefault("WORKSPACES_RISKY_CHARACTERS","@,|,{,},<,>,|,(,)");

export { ALLOWED_HEADERS, ALLOWED_METHODS, ALLOWED_ORIGINS, RISKY_CHARACTERS };