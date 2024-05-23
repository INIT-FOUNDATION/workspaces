import NodeCache from 'node-cache';
import { envUtils } from '../config';
import { loggerUtils } from '../monitoring';


const nodeCache = new NodeCache({
  stdTTL: envUtils.getNumberEnvVariableOrDefault('WORKSPACES_NODE_CACHE_STD_TTL', 100),
  checkperiod: envUtils.getNumberEnvVariableOrDefault('WORKSPACES_NODE_CACHE_CHECK_PERIOD', 120),
  deleteOnExpire: envUtils.getBooleanEnvVariableOrDefault('WORKSPACES_NODE_CACHE_DELETE_ON_EXPIRE', false),
});

function addPrefix(key: string): string {
  const prefix = envUtils.getStringEnvVariableOrDefault('WORKSPACES_NODE_CACHE_KEYS_PREFIX', "DEV|WORKSPACES|")
  return `${prefix}:${key}`;
}

export async function setKey(key: string, value: any, ttl: number): Promise<boolean> {
  try {
    return nodeCache.set(addPrefix(key), value, ttl);
  } catch (error) {
    loggerUtils.error(`nodeCacheUtils :: Error setting key: ${key} with val: ${value}, Error :: ${error}`);
    throw error;
  }
}

export async function mset(keysVals: Array<{ key: string, val: any, ttl?: number }>): Promise<boolean> {
  try {
    const prefixedKeysVals = keysVals.map(item => ({
      key: addPrefix(item.key),
      val: item.val,
      ttl: item.ttl
    }));
    return nodeCache.mset(prefixedKeysVals);
  } catch (error) {
    loggerUtils.error(`nodeCacheUtils :: Error setting multiple keys, Error :: ${error}`);
    throw error;
  }
}

export async function getKey(key: string): Promise<any> {
  try {
    return nodeCache.get(addPrefix(key));
  } catch (error) {
    loggerUtils.error(`nodeCacheUtils :: Error getting key: ${key}, Error :: ${error}`);
    throw error;
  }
}

export async function takeKey(key: string): Promise<any> {
  try {
    return nodeCache.take(addPrefix(key));
  } catch (error) {
    loggerUtils.error(`nodeCacheUtils :: Error taking key: ${key}, Error :: ${error}`);
    throw error;
  }
}

export async function mget(keys: string[]): Promise<Record<string, any>> {
  try {
    const prefixedKeys = keys.map(key => addPrefix(key));
    return nodeCache.mget(prefixedKeys);
  } catch (error) {
    loggerUtils.error(`nodeCacheUtils :: Error getting multiple keys, Error :: ${error}`);
    throw error;
  }
}

export async function delKey(key: string | string[]): Promise<number> {
  try {
    const prefixedKey = Array.isArray(key) ? key.map(k => addPrefix(k)) : addPrefix(key);
    return nodeCache.del(prefixedKey);
  } catch (error) {
    loggerUtils.error(`nodeCacheUtils :: Error deleting key: ${key}, Error :: ${error}`);
    throw error;
  }
}

export async function ttlKey(key: string, ttl: number): Promise<boolean> {
  try {
    return nodeCache.ttl(addPrefix(key), ttl);
  } catch (error) {
    loggerUtils.error(`nodeCacheUtils :: Error setting TTL for key: ${key}, Error :: ${error}`);
    throw error;
  }
}

export async function getTtlKey(key: string): Promise<number | undefined> {
  try {
    return nodeCache.getTtl(addPrefix(key));
  } catch (error) {
    loggerUtils.error(`nodeCacheUtils :: Error getting TTL for key: ${key}, Error :: ${error}`);
    throw error;
  }
}

export async function keys(): Promise<string[]> {
  try {
    const allKeys = nodeCache.keys();
    return allKeys;
  } catch (error) {
    loggerUtils.error(`nodeCacheUtils :: Error listing keys, Error :: ${error}`);
    throw error;
  }
}

export async function hasKey(key: string): Promise<boolean> {
  try {
    return nodeCache.has(addPrefix(key));
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

