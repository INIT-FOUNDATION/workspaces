import { createClient } from "redis";
import { loggerUtils } from "../monitoring/loggerUtils";
import {
  getBooleanEnvVariableOrDefault,
  getNumberEnvVariableOrDefault,
  getStringEnvVariable,
  getStringEnvVariableOrDefault,
} from "../config/envUtils";

const getPrefixKey = () =>
  getStringEnvVariableOrDefault("WORKSPACES_REDIS_KEYS_PREFIX", "DEV|WORKSPACES|");

const primaryRedisConfig = {
  url: (() => {
    const host = getStringEnvVariableOrDefault(
      "WORKSPACES_REDIS_HOST",
      "localhost"
    );
    const port = getNumberEnvVariableOrDefault("WORKSPACES_REDIS_PORT", 6379);

    let connectionURI = `redis://${host}:${port}`;

    const enableTLS = getBooleanEnvVariableOrDefault(
      "WORKSPACES_REDIS_ENABLE_TLS",
      false
    );

    if (enableTLS) {
      connectionURI = connectionURI.replace("redis://", "rediss://");
    }
    return connectionURI;
  })(),
  username: getStringEnvVariable("WORKSPACES_REDIS_USERNAME") || undefined,
  password: getStringEnvVariable("WORKSPACES_REDIS_PASSWORD") || undefined,
};

const readReplicaConfig = {
  url: (() => {
    const host = getStringEnvVariableOrDefault(
      "WORKSPACES_REDIS_REPLICA_HOST",
      getStringEnvVariableOrDefault("WORKSPACES_REDIS_HOST", "localhost")
    );
    const port = getNumberEnvVariableOrDefault("WORKSPACES_REDIS_PORT", 6379);

    let connectionURI = `redis://${host}:${port}`;

    const enableTLS = getBooleanEnvVariableOrDefault(
      "WORKSPACES_REDIS_ENABLE_TLS",
      false
    );

    if (enableTLS) {
      connectionURI = connectionURI.replace("redis://", "rediss://");
    }
    return connectionURI;
  })(),
  username: getStringEnvVariable("WORKSPACES_REDIS_USERNAME") || undefined,
  password: getStringEnvVariable("WORKSPACES_REDIS_PASSWORD") || undefined,
};

const primaryRedisClient = createClient(primaryRedisConfig);
const readRedisReplicaClient = createClient(readReplicaConfig);

primaryRedisClient.on("connect", () => {
  loggerUtils.info("redisUtils :: Connected to Primary Redis server");
});

readRedisReplicaClient.on("connect", () => {
  loggerUtils.info("redisUtils :: Connected to Read Replica Redis server");
});

primaryRedisClient.on("error", (error) => {
  loggerUtils.error(
    `redisUtils :: Error connecting to Primary Redis server :: ${error}`
  );
});

readRedisReplicaClient.on("error", (error) => {
  loggerUtils.error(
    `redisUtils :: Error connecting to Read Replica Redis server :: ${error}`
  );
});

const addPrefix = (key: string) => `${getPrefixKey()}${key}`;

export async function setKey(key: string, value: string, expiry: number = 0) {
  try {
    if (expiry > 0) {
      await primaryRedisClient.setEx(addPrefix(key), expiry, value);
    } else {
      await primaryRedisClient.set(addPrefix(key), value);
    }
  } catch (error) {
    loggerUtils.error(
      `redisUtils :: Error setting Redis key: ${key}, Error :: ${error}`
    );
    throw error;
  }
}

export async function getKey(key: string) {
  try {
    return (
      (await readRedisReplicaClient.get(addPrefix(key))) ||
      (await primaryRedisClient.get(addPrefix(key)))
    );
  } catch (error) {
    loggerUtils.error(
      `redisUtils :: Error getting Redis key: ${key}, Error :: ${error}`
    );
    throw error;
  }
}

export async function keys(pattern: string) {
  try {
    return (
      (await readRedisReplicaClient.keys(addPrefix(pattern))) ||
      (await primaryRedisClient.keys(addPrefix(pattern)))
    );
  } catch (error) {
    loggerUtils.error(
      `redisUtils :: Error getting Redis keys with pattern: ${pattern}, Error :: ${error}`
    );
    throw error;
  }
}

export async function delKey(pattern: string) {
  try {
    if (pattern.includes("*")) {
      const keys =
        (await readRedisReplicaClient.keys(addPrefix(pattern))) ||
        (await primaryRedisClient.keys(addPrefix(pattern)));

      for (const key of keys) {
        await primaryRedisClient.del(key);
      }
    } else {
      await primaryRedisClient.del(pattern);
    }
    return await primaryRedisClient.del(addPrefix(pattern));
  } catch (error) {
    loggerUtils.error(
      `redisUtils :: Error deleting Redis keys: ${pattern}, Error :: ${error}`
    );
    throw error;
  }
}

export async function lPushKey(key: string, value: string, expiry: number = 0) {
  try {
    await primaryRedisClient.lPush(addPrefix(key), value);
    if (expiry > 0) await primaryRedisClient.expire(addPrefix(key), expiry);
  } catch (error) {
    loggerUtils.error(
      `redisUtils :: Error pushing to Redis list with key: ${key}, Error :: ${error}`
    );
    throw error;
  }
}

export async function incrementKey(
  key: string,
  threshold: number = 0,
  expiry: number = 0
) {
  try {
    if (threshold != 0) {
      await primaryRedisClient.incrBy(addPrefix(key), threshold);
    } else {
      await primaryRedisClient.incr(addPrefix(key));
    }
    if (expiry > 0) await primaryRedisClient.expire(addPrefix(key), expiry);
  } catch (error) {
    loggerUtils.error(
      `redisUtils :: Error Incrementing from Redis with key: ${key}, Error :: ${error}`
    );
    throw error;
  }
}

export async function decrementKey(key: string, threshold: number = 0) {
  try {
    if (threshold != 0) {
      return await primaryRedisClient.decrBy(addPrefix(key), threshold);
    } else {
      return await primaryRedisClient.decr(addPrefix(key));
    }
  } catch (error) {
    loggerUtils.error(
      `redisUtils :: Error Decrementing from Redis with key: ${key}, Error :: ${error}`
    );
    throw error;
  }
}

export async function lRemKey(key: string, count: number, value: string) {
  try {
    return await primaryRedisClient.lRem(addPrefix(key), count, value);
  } catch (error) {
    loggerUtils.error(
      `redisUtils :: Error removing from Redis list with key: ${key}, Error :: ${error}`
    );
    throw error;
  }
}

export async function lRangeKey(key: string, start: number, stop: number) {
  try {
    return (
      (await readRedisReplicaClient.lRange(addPrefix(key), start, stop)) ||
      (await primaryRedisClient.lRange(addPrefix(key), start, stop))
    );
  } catch (error) {
    loggerUtils.error(
      `redisUtils :: Error getting range from Redis list with key: ${key}, Error :: ${error}`
    );
    throw error;
  }
}

export async function hIncrbyKey(
  key: string,
  field: string,
  increment: number,
  expiry: number = 0
) {
  try {
    await primaryRedisClient.hIncrBy(addPrefix(key), field, increment);
    if (expiry > 0) await primaryRedisClient.expire(addPrefix(key), expiry);
  } catch (error) {
    loggerUtils.error(
      `redisUtils :: Error incrementing field in Redis hash with key: ${key}, Error :: ${error}`
    );
    throw error;
  }
}

export async function hSetKey(
  key: string,
  field: string,
  value: number,
  expiry: number = 0
) {
  try {
    await primaryRedisClient.hSet(addPrefix(key), field, value);
    if (expiry > 0) await primaryRedisClient.expire(addPrefix(key), expiry);
  } catch (error) {
    loggerUtils.error(
      `redisUtils :: Error Setting field in Redis hash with key: ${key}, Error :: ${error}`
    );
    throw error;
  }
}

export async function hDelKey(key: string, field: string) {
  try {
    return await primaryRedisClient.hDel(addPrefix(key), field);
  } catch (error) {
    loggerUtils.error(
      `redisUtils :: Error Deleting field in Redis hash with key: ${key}, Error :: ${error}`
    );
    throw error;
  }
}

export async function hGetallKey(key: string) {
  try {
    return (
      (await readRedisReplicaClient.hGetAll(addPrefix(key))) ||
      (await primaryRedisClient.hGetAll(addPrefix(key)))
    );
  } catch (error) {
    loggerUtils.error(
      `redisUtils :: Error getting all fields from Redis hash with key: ${key}, Error :: ${error}`
    );
    throw error;
  }
}

export async function ttlKey(key: string) {
  try {
    return (
      (await readRedisReplicaClient.ttl(addPrefix(key))) ||
      (await primaryRedisClient.ttl(addPrefix(key)))
    );
  } catch (error) {
    loggerUtils.error(
      `redisUtils :: Error getting all fields from Redis hash with key: ${key}, Error :: ${error}`
    );
    throw error;
  }
}

export { primaryRedisClient, readRedisReplicaClient };