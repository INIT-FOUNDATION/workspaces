import dotenv from "dotenv";

dotenv.config();

export function getStringEnvVariable(key: string): string | undefined {
  const value = process.env[key];
  return value === undefined ? undefined : value;
}

export function getNumberEnvVariable(key: string): number | undefined {
  const value = process.env[key];
  if (value === undefined) {
    return undefined;
  }
  const parsedNumber = parseFloat(value);
  return isNaN(parsedNumber) ? undefined : parsedNumber;
}

export function getBooleanEnvVariable(key: string): boolean | undefined {
  const value = process.env[key];
  if (value === undefined) {
    return undefined;
  }
  const lowercaseValue = value.toLowerCase();
  return lowercaseValue === "true" || lowercaseValue === "false"
    ? lowercaseValue === "true"
    : undefined;
}

export function requireStringEnvVariable(key: string): string {
  const value = getStringEnvVariable(key);
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is required but not set.`);
  }
  return value;
}

export function requireNumberEnvVariable(key: string): number {
  const value = getNumberEnvVariable(key);
  if (value === undefined) {
    throw new Error(
      `Environment variable ${key} is required but not set or not a valid number.`
    );
  }
  return value;
}

export function requireBooleanEnvVariable(key: string): boolean {
  const value = getBooleanEnvVariable(key);
  if (value === undefined) {
    throw new Error(
      `Environment variable ${key} is required but not set or not a valid boolean.`
    );
  }
  return value;
}

export function getStringEnvVariableOrDefault(
  key: string,
  defaultValue: string
): string {
  const value = getStringEnvVariable(key);
  return value === undefined ? defaultValue : value;
}

export function getNumberEnvVariableOrDefault(
  key: string,
  defaultValue: number
): number {
  const value = getNumberEnvVariable(key);
  return value === undefined ? defaultValue : value;
}

export function getBooleanEnvVariableOrDefault(
  key: string,
  defaultValue: boolean
): boolean {
  const value = getBooleanEnvVariable(key);
  return value === undefined ? defaultValue : value;
}