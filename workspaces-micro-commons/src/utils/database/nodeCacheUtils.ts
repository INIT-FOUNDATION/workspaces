import NodeCache from 'node-cache';
import { envUtils } from '../config';
import { loggerUtils } from '../monitoring';

const nodeCache = new NodeCache({
  stdTTL: envUtils.getNumberEnvVariableOrDefault('WORKSPACES_NODE_CACHE_STD_TTL', 100),
  checkperiod: envUtils.getNumberEnvVariableOrDefault('WORKSPACES_NODE_CACHE_CHECK_PERIOD', 120),
  deleteOnExpire: envUtils.getBooleanEnvVariableOrDefault('WORKSPACES_NODE_CACHE_DELETE_ON_EXPIRE', false),
});

export async function setKey(key: string, value: any, ttl: number): Promise<boolean> {
  try {
    return nodeCache.set(key, value, ttl);
  } catch (error) {
    loggerUtils.error(`nodeCacheUtils :: Error setting key: ${key} with val: ${value}, Error :: ${error}`);
    throw error;
  }
}

export async function mset(keysVals: Array<{ key: string, val: any, ttl?: number }>): Promise<boolean> {
  try {
    return nodeCache.mset(keysVals);
  } catch (error) {
    loggerUtils.error(`nodeCacheUtils :: Error setting multiple keys, Error :: ${error}`);
    throw error;
  }
}

export async function getKey(key: string): Promise<any> {
  try {
    return nodeCache.get(key);
  } catch (error) {
    loggerUtils.error(`nodeCacheUtils :: Error getting key: ${key}, Error :: ${error}`);
    throw error;
  }
}

export async function takeKey(key: string): Promise<any> {
  try {
    return nodeCache.take(key);
  } catch (error) {
    loggerUtils.error(`nodeCacheUtils :: Error taking key: ${key}, Error :: ${error}`);
    throw error;
  }
}

export async function mget(keys: string[]): Promise<Record<string, any>> {
  try {
    return nodeCache.mget(keys);
  } catch (error) {
    loggerUtils.error(`nodeCacheUtils :: Error getting multiple keys, Error :: ${error}`);
    throw error;
  }
}

export async function delKey(key: string | string[]): Promise<number> {
  try {
    return nodeCache.del(key);
  } catch (error) {
    loggerUtils.error(`nodeCacheUtils :: Error deleting key: ${key}, Error :: ${error}`);
    throw error;
  }
}

export async function ttlKey(key: string, ttl: number): Promise<boolean> {
  try {
    return nodeCache.ttl(key, ttl);
  } catch (error) {
    loggerUtils.error(`nodeCacheUtils :: Error setting TTL for key: ${key}, Error :: ${error}`);
    throw error;
  }
}

export async function getTtlKey(key: string): Promise<number | undefined> {
  try {
    return nodeCache.getTtl(key);
  } catch (error) {
    loggerUtils.error(`nodeCacheUtils :: Error getting TTL for key: ${key}, Error :: ${error}`);
    throw error;
  }
}

export async function keys(): Promise<string[]> {
  try {
    return nodeCache.keys();
  } catch (error) {
    loggerUtils.error(`nodeCacheUtils :: Error listing keys, Error :: ${error}`);
    throw error;
  }
}

export async function hasKey(key: string): Promise<boolean> {
  try {
    return nodeCache.has(key);
  } catch (error) {
    loggerUtils.error(`nodeCacheUtils :: Error checking existence of key: ${key}, Error :: ${error}`);
    throw error;
  }
}

export async function getStats(): Promise<NodeCache.Stats> {
  try {
    return nodeCache.getStats();
  } catch (error) {
    loggerUtils.error(`nodeCacheUtils :: Error getting stats, Error :: ${error}`);
    throw error;
  }
}

export async function flushAll(): Promise<void> {
  try {
    nodeCache.flushAll();
  } catch (error) {
    loggerUtils.error(`nodeCacheUtils :: Error flushing all keys, Error :: ${error}`);
    throw error;
  }
}

export async function flushStats(): Promise<void> {
  try {
    nodeCache.flushStats();
  } catch (error) {
    loggerUtils.error(`nodeCacheUtils :: Error flushing stats, Error :: ${error}`);
    throw error;
  }
}

export async function closeCache(): Promise<void> {
  try {
    nodeCache.close();
  } catch (error) {
    loggerUtils.error(`nodeCacheUtils :: Error closing cache, Error :: ${error}`);
    throw error;
  }
}