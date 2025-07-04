import {
  Cache,
  ILogger,
  logger,
  type CacheNamespaces,
} from '@hicommonwealth/core';
import { delay } from '@hicommonwealth/shared';
import { RedisClientOptions, createClient, type RedisClientType } from 'redis';

const CONNECT_TIMEOUT = 5000;

export function redisRetryStrategy(retries: number) {
  // Don't stop retrying while app is running
  // if (retries > 5) {
  //   return new Error('Redis max connection retries exceeded');
  // }

  // timetable: 0, 1000, 8000, 27000, 64000, 125000, 216000, 343000, 512000, 729000, 1000000
  // from 1 sec to 16.67 minutes
  return Math.min((retries * 10) ** 3, 10 * 60 * 1000);
}

/**
 * This class facilitates interacting with Redis and constructing a Redis Cache. Note that all keys must use a namespace
 * prefix to divide the Redis keyspace. If a specific Redis command is not supported by this class you can access the
 * client directly or better yet open a PR that implements the class methods necessary to support the new Redis command.
 * WARNING: If running blocking arbitrary commands using the client directly be sure to include the 'isolated' option
 * in order to avoid blocking the client for other requests that may be occurring.
 */
export class RedisCache implements Cache {
  private _client: RedisClientType;
  private _log: ILogger;

  constructor(redis_url: string) {
    const redisOptions: RedisClientOptions = {};
    redisOptions['url'] = redis_url;
    if (redis_url.includes('rediss')) {
      redisOptions['socket'] = {
        tls: true,
        rejectUnauthorized: false,
        reconnectStrategy: redisRetryStrategy,
        connectTimeout: CONNECT_TIMEOUT,
      };
    } else {
      redisOptions['socket'] = {
        reconnectStrategy: redisRetryStrategy,
        connectTimeout: CONNECT_TIMEOUT,
      };
    }

    this._log = logger(import.meta);
    this._log.info(`Connecting to Redis at: ${redis_url}`);
    this._client = createClient(redisOptions) as RedisClientType;

    this._client.on('ready', () =>
      this._log.info(`RedisCache connection ready`),
    );
    this._client.on('reconnecting', () =>
      this._log.info(`RedisCache reconnecting...`),
    );
    this._client.on('end', () => this._log.info(`RedisCache disconnected`));
    this._client.on('error', (err: Error) => {
      this._log.error(err.message, err);
    });

    void this._client.connect();
  }

  // get namespace key for redis
  static getNamespaceKey(namespace: CacheNamespaces, key: string) {
    return `${namespace}_${key}`;
  }

  public get name(): string {
    return 'RedisCache';
  }

  public get client(): RedisClientType {
    return this._client;
  }

  public async dispose(): Promise<void> {
    try {
      await this._client.disconnect();
      await this._client.quit();
    } catch {
      // ignore this
    }
  }

  /**
   * Awaits redis connection / cache ready
   * @returns
   */
  public ready(retries = 3, retryDelay = 1000) {
    // eslint-disable-next-line no-async-promise-executor, @typescript-eslint/no-misused-promises
    return new Promise<boolean>(async (resolve, reject) => {
      for (let i = 0; i < retries; i++) {
        if (this.isReady()) {
          resolve(true);
          return;
        }
        await delay(retryDelay);
      }
      reject('RedisCache ready timeout');
    });
  }

  /**
   * Check if redis is initialized
   * @returns boolean
   */
  public isReady(): boolean {
    return this._client.isReady;
  }

  /**
   * This function facilitates setting a key-value pair in Redis. Since Redis has a single keyspace we include a prefix
   * to simulate many keyspaces. That is, all key-value pairs for a specific functionality should use a matching prefix.
   * For example, for if we had chat WebSockets we store user_id => address key-value pairs. Since we may want to store
   * other data in which the key would be the user_id we use the 'chat_socket' prefix for all key-pairs pertaining to
   * the chat websocket. The resulting key would thus be 'chat_socket_[user_id]'. The prefix can be thought of as the
   * namespace of the data that you are trying to store.
   * @param namespace The prefix to append to the dynamic key i.e. the namespace. An instance of the
   * CacheNamespaces enum.
   * @param key The actual key you want to store (can be any valid string).
   * @param value The value to associate with the namespace and key
   * @param duration The number of seconds after which the key should be automatically 'deleted' by Redis i.e. TTL
   * @param notExists If true and the key already exists the key will not be set
   */
  public async setKey(
    namespace: CacheNamespaces,
    key: string,
    value: string,
    duration = 0,
    notExists = false,
  ): Promise<boolean> {
    if (!this.isReady()) return false;
    try {
      const options: { NX: boolean; EX?: number } = {
        NX: notExists,
      };
      duration > 0 && (options.EX = duration);
      const finalKey = RedisCache.getNamespaceKey(namespace, key);
      if (typeof value !== 'string') {
        value = JSON.stringify(value);
      }
      const res = await this._client.set(
        finalKey as any,
        value,
        options as any,
      );
      return res === 'OK';
    } catch (e) {
      const msg = `An error occurred while setting the following key value pair '${namespace} ${key}: ${value}'`;
      this._log.error(msg, e as Error);
      return false;
    }
  }

  public async getKey(
    namespace: CacheNamespaces,
    key: string,
  ): Promise<string | null> {
    if (!this.isReady()) return null;
    try {
      const finalKey = RedisCache.getNamespaceKey(namespace, key);
      return await this._client.get(finalKey);
    } catch (e) {
      const msg = `An error occurred while getting the following key '${key}'`;
      this._log.error(msg, e as Error);
      return null;
    }
  }

  /**
   * This function works the same way at the 'setKey' function above but is meant to be used when multiple key value
   * pairs need to be inserted at the same time in an 'all or none' fashion i.e. SQL transaction style.
   * @param namespace The prefix to append to the key.
   * @param data The key-value pairs to set in Redis
   * @param duration The TTL for each key in data.
   * @param transaction This boolean indicates whether keys should all be set within a transaction when
   * the duration parameter is set. Specifically, if transaction is true we use multi-exec and if
   * transaction is false we use a pipeline and return any keys that failed to set. Note that if transaction
   * is true, a blocking and potentially less performant operation is executed.
   */
  public async setKeys(
    namespace: CacheNamespaces,
    data: { [key: string]: string },
    duration = 0,
    transaction = true,
  ): Promise<false | Array<'OK' | null>> {
    if (!this.isReady()) return false;

    // add the namespace prefix to all keys
    const transformedData = Object.keys(data).reduce((result, key) => {
      result[RedisCache.getNamespaceKey(namespace, key)] = data[key];
      return result;
    }, {} as any);

    if (duration > 0) {
      // MSET doesn't support setting TTL, so we need use
      // a multi-exec to process many SET commands
      const multi = this._client.multi();
      for (const key of Object.keys(transformedData)) {
        multi.set(key, transformedData[key], { EX: duration });
      }

      try {
        if (transaction) return (await multi.exec()) as Array<'OK' | null>;
        else return (await multi.execAsPipeline()) as Array<'OK' | null>;
      } catch (e) {
        const msg =
          `Error occurred while setting multiple keys ` +
          `${transaction ? 'in a transaction' : 'in a pipeline'}`;
        this._log.error(msg, e as Error);
        return false;
      }
    } else {
      try {
        return [(await this._client.MSET(transformedData)) as 'OK'];
      } catch (e) {
        const msg = 'Error occurred while setting multiple keys';
        this._log.error(msg, e as Error);
        return false;
      }
    }
  }

  public async getKeys(
    namespace: CacheNamespaces,
    keys: string[],
  ): Promise<false | Record<string, unknown>> {
    if (!this.isReady()) return false;
    const transformedKeys = keys.map((k) =>
      RedisCache.getNamespaceKey(namespace, k),
    );
    try {
      const values = await this._client.MGET(transformedKeys);
      return transformedKeys.reduce((obj, key, index) => {
        if (values[index] !== null) {
          obj[key] = values[index];
        }
        return obj;
      }, {} as any);
    } catch (e) {
      const msg = 'An error occurred while getting many keys';
      this._log.error(msg, e as Error);
      return false;
    }
  }

  /**
   * Increments the integer value of a key by the given amount.
   * @param namespace The namespace of the key to increment.
   * @param key The key whose value is to be incremented.
   * @param increment The amount by which the key's value should be incremented.
   * @param duration Optional duration for the key to live in the cache. (in seconds)
   * @returns The new value of the key after the increment.
   */
  public async incrementKey(
    namespace: CacheNamespaces,
    key: string,
    increment = 1,
    duration?: number,
  ): Promise<number | null> {
    if (!this.isReady()) return null;
    try {
      const finalKey = RedisCache.getNamespaceKey(namespace, key);
      if (duration) {
        const multi = this._client.multi();
        multi.incrBy(finalKey, increment);
        multi.expire(finalKey, duration, 'NX');
        const [incr] = (await multi.exec()) as [number, boolean];
        return incr;
      }
      // plain increment
      return await this._client.incrBy(finalKey, increment);
    } catch (e) {
      const msg = `An error occurred while incrementing the key: ${key}`;
      this._log.error(msg, e as Error);
      return null;
    }
  }

  /**
   * Decrements the integer value of a key by the given amount.
   * @param namespace The namespace of the key to decrement.
   * @param key The key whose value is to be decremented.
   * @param decrement The amount by which the key's value should be decremented.
   * @returns The new value of the key after the decrement.
   */
  public async decrementKey(
    namespace: CacheNamespaces,
    key: string,
    decrement = 1,
  ): Promise<number | null> {
    if (!this.isReady()) return null;
    try {
      const finalKey = RedisCache.getNamespaceKey(namespace, key);
      return await this._client.decrBy(finalKey, decrement);
    } catch (e) {
      const msg = `An error occurred while decrementing the key: ${key}`;
      this._log.error(msg, e as Error);
      return null;
    }
  }

  /**
   * Sets the expiration (TTL) of a key within a specific namespace.
   * @param namespace The namespace of the key for which to set the expiration.
   * @param key The key for which to set the expiration.
   * @param ttlInSeconds The time to live (TTL) in seconds for the key. Use 0 to remove the expiration.
   * @returns True if the expiration was set successfully, false otherwise.
   */
  public async setKeyTTL(
    namespace: CacheNamespaces,
    key: string,
    ttlInSeconds: number,
  ): Promise<boolean> {
    if (!this.isReady()) return false;
    try {
      const finalKey = RedisCache.getNamespaceKey(namespace, key);
      if (ttlInSeconds === 0) {
        // If ttlInSeconds is 0, remove the expiration (PERSIST command).
        return await this._client.persist(finalKey);
      } else {
        // Set the expiration using the EXPIRE command.
        return await this._client.expire(finalKey, ttlInSeconds);
      }
    } catch (e) {
      const msg = `An error occurred while setting the expiration of the key: ${key}`;
      this._log.error(msg, e as Error);
      return false;
    }
  }

  /**
   * Retrieves the current Time to Live (TTL) of a key within a specific namespace.
   * @param namespace The namespace of the key for which to get the TTL.
   * @param key The key for which to get the TTL.
   * @returns The TTL in seconds for the specified key, or -1 if the key does not exist or has no associated expiration.
   */
  public async getKeyTTL(
    namespace: CacheNamespaces,
    key: string,
  ): Promise<number> {
    if (!this.isReady()) return -2;
    try {
      const finalKey = RedisCache.getNamespaceKey(namespace, key);
      // TTL in seconds; -2 if the key does not exist, -1 if the key exists but has no associated expire.
      return await this._client.ttl(finalKey);
    } catch (e) {
      const msg = `An error occurred while retrieving the TTL of the key: ${key}`;
      this._log.error(msg, e as Error);
      return -2;
    }
  }

  /**
   * Get all the key-value pairs of a specific namespace.
   * @param namespace The name of the namespace to retrieve keys from
   * @param maxResults The maximum number of keys to retrieve from the given namespace
   * @param withData
   */
  public async getNamespaceKeys(
    namespace: CacheNamespaces,
  ): Promise<{ [key: string]: string } | boolean> {
    const data = {} as any;
    if (!this.isReady()) return false;
    try {
      const keys = await this.scanNamespaceKeys(namespace);
      for (const key of keys) {
        const keyType = await this._client.type(key);
        if (keyType === 'string') {
          data[key] = await this._client.get(key);
        } else {
          this._log.warn(
            `Skipping key with non-string type: ${key} (type: ${keyType})`,
          );
        }
      }
      return data;
    } catch (e) {
      const msg = 'An error occurred while fetching the namespace keys';
      this._log.error(msg, e as Error);
      return false;
    }
  }

  private async scanNamespaceKeys(
    namespace: CacheNamespaces,
    resultsPerIteration = 100,
  ): Promise<string[]> {
    const keys: string[] = [];
    if (!this.isReady()) return [];
    try {
      for await (const key of this._client.scanIterator({
        MATCH: `${namespace}*`,
        COUNT: resultsPerIteration,
      })) {
        keys.push(key);
      }
    } catch (e) {
      this._log.error(
        'An error occurred while scanning namespace keys',
        e as Error,
      );
      return [];
    }
    return keys;
  }

  /**
   * delete redis key by namespace and key
   * @returns boolean
   */
  public async deleteNamespaceKeys(
    namespace: CacheNamespaces,
  ): Promise<number | boolean> {
    if (!this.isReady()) return false;
    try {
      let count = 0;
      for await (const key of this._client.scanIterator({
        MATCH: `${namespace}*`,
        COUNT: 100,
      })) {
        try {
          const resp = await this._client.del(key);
          count += resp ?? 0;
          this._log.trace(`deleted key ${key} ${resp} ${count}`);
        } catch (err) {
          this._log.trace(`error deleting key ${key}`);
          this._log.trace((err as Error).message);
        }
      }
      return count;
    } catch (e) {
      const msg = `An error occurred while deleting a all keys in the ${namespace} namespace`;
      this._log.error(msg, e as Error);
      return false;
    }
  }

  public async deleteKey(
    namespace: CacheNamespaces,
    key: string,
  ): Promise<number> {
    if (!this.isReady()) return 0;
    const finalKey = RedisCache.getNamespaceKey(namespace, key);
    try {
      return this._client.del(finalKey);
    } catch (e) {
      return 0;
    }
  }

  /**
   * Returns the paginated matching namespace:keys in the namespace.
   * @param namespace The prefix to check for keys in.
   * @param cursor Start index of the scan.
   * @param count How many keys to return.
   * @returns The cursor pointing to the next pagination and the keys scanned.
   */
  public async scan(
    namespace: CacheNamespaces,
    cursor: number,
    count: number,
  ): Promise<{ cursor: number; keys: string[] } | null> {
    if (!this.isReady()) return null;
    try {
      return this._client.scan(cursor, {
        MATCH: `${namespace}*`,
        COUNT: count,
      });
    } catch (e) {
      const msg = 'An error occurred while running scan';
      this._log.error(msg, e as Error);
      return null;
    }
  }

  public async incrementHashKey(
    namespace: CacheNamespaces,
    key: string,
    field: string,
    increment: number = 1,
  ): Promise<number> {
    if (!this.isReady()) return 0;
    try {
      return this._client.HINCRBY(
        RedisCache.getNamespaceKey(namespace, key),
        field,
        increment,
      );
    } catch (e) {
      this._log.error(
        'An error occurred while incrementing hash key',
        e as Error,
      );
    }
    return 0;
  }

  public async getHash(
    namespace: CacheNamespaces,
    key: string,
  ): Promise<Record<string, string>> {
    if (!this.isReady()) return {};
    try {
      return this._client.HGETALL(RedisCache.getNamespaceKey(namespace, key));
    } catch (e) {
      this._log.error('An error occurred while getting hash', e as Error);
    }
    return {};
  }

  public async setHashKey(
    namespace: CacheNamespaces,
    key: string,
    field: string,
    value: string,
  ): Promise<number> {
    if (!this.isReady()) return 0;
    try {
      return this._client.HSET(
        RedisCache.getNamespaceKey(namespace, key),
        field,
        value,
      );
    } catch (e) {
      this._log.error('An error occurred while getting hash', e as Error);
    }
    return 0;
  }

  public async addToSet(
    namespace: CacheNamespaces,
    key: string,
    value: string,
  ): Promise<number> {
    if (!this.isReady()) return 0;
    try {
      return this._client.SADD(
        RedisCache.getNamespaceKey(namespace, key),
        value,
      );
    } catch (e) {
      this._log.error('An error occurred while adding item to set', e as Error);
    }
    return 0;
  }

  public async getSet(
    namespace: CacheNamespaces,
    key: string,
  ): Promise<string[]> {
    if (!this.isReady()) return [];
    try {
      return this._client.SMEMBERS(RedisCache.getNamespaceKey(namespace, key));
    } catch (e) {
      this._log.error('An error occurred while getting set', e as Error);
    }
    return [];
  }

  public async getSortedSetSize(
    namespace: CacheNamespaces,
    key: string,
  ): Promise<number> {
    if (!this.isReady()) throw new Error('Redis is not ready');
    return this._client.zCard(RedisCache.getNamespaceKey(namespace, key));
  }

  public async sliceSortedSetWithScores(
    namespace: CacheNamespaces,
    key: string,
    start = 0,
    stop = 0,
    options?: { order?: 'ASC' | 'DESC' },
  ): Promise<{ value: string; score: number }[]> {
    if (!this.isReady()) throw new Error('Redis is not ready');
    return this._client.zRangeWithScores(
      RedisCache.getNamespaceKey(namespace, key),
      start,
      stop,
      {
        ...(options?.order === 'ASC' ? { REV: true } : {}),
      },
    );
  }

  public async sliceSortedSet(
    namespace: CacheNamespaces,
    key: string,
    start = 0,
    stop = 0,
    options?: { order?: 'ASC' | 'DESC' },
  ): Promise<string[]> {
    if (!this.isReady()) throw new Error('Redis is not ready');
    return this._client.zRange(
      RedisCache.getNamespaceKey(namespace, key),
      start,
      stop,
      {
        ...(options?.order === 'ASC' ? { REV: true } : {}),
      },
    );
  }

  public async delSortedSetItemsByRank(
    namespace: CacheNamespaces,
    key: string,
    start = 0,
    stop = 0,
  ): Promise<number> {
    if (!this.isReady()) throw new Error('Redis is not ready');
    return this._client.zRemRangeByRank(
      RedisCache.getNamespaceKey(namespace, key),
      start,
      stop,
    );
  }

  public async addToSortedSet(
    namespace: CacheNamespaces,
    key: string,
    items:
      | { value: string; score: number }[]
      | { value: string; score: number },
    options?: {
      updateOnly?: boolean;
    },
  ): Promise<number> {
    if (!this.isReady()) throw new Error('Redis is not ready');
    return this._client.zAdd(
      RedisCache.getNamespaceKey(namespace, key),
      items,
      {
        ...(options?.updateOnly ? { XX: true } : {}),
      },
    );
  }

  public async sortedSetPopMin(
    namespace: CacheNamespaces,
    key: string,
    numToPop = 1,
  ): Promise<{ value: string; score: number }[]> {
    if (!this.isReady()) throw new Error('Redis is not ready');
    return this._client.zPopMinCount(
      RedisCache.getNamespaceKey(namespace, key),
      numToPop,
    );
  }

  public async delSortedSetItemsByValue(
    namespace: CacheNamespaces,
    key: string,
    values: string[] | string,
  ): Promise<number> {
    if (!this.isReady()) throw new Error('Redis is not ready');
    return this._client.zRem(
      RedisCache.getNamespaceKey(namespace, key),
      values,
    );
  }

  public async flushAll(): Promise<void> {
    if (!this.isReady()) return;
    try {
      await this._client.flushAll();
    } catch (e) {
      this._log.error('An error occurred while flushing redis', e as Error);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async sendCommand(args: string[]): Promise<any> {
    return await this._client.sendCommand(args);
  }

  /**
   * Push a value to the beginning of a list and trim it to a specific size in a single transaction.
   * This is an atomic operation that adds an item to a list and ensures the list doesn't exceed the specified max length.
   *
   * @param namespace The namespace of the key
   * @param key The key of the list
   * @param value The value to push to the list
   * @param maxLength The maximum length to maintain for the list
   * @returns The new length of the list after the push operation, or false if an error occurred
   */
  public async lpushAndTrim(
    namespace: CacheNamespaces,
    key: string,
    value: string,
    maxLength: number,
  ): Promise<number | false> {
    if (!this.isReady()) return false;
    try {
      const finalKey = RedisCache.getNamespaceKey(namespace, key);
      const multi = this._client.multi();
      multi.lPush(finalKey, value);
      multi.lTrim(finalKey, 0, maxLength - 1);
      const [newLength] = (await multi.exec()) as [number, unknown];
      return newLength;
    } catch (e) {
      const msg = `An error occurred during lpushAndTrim for key: ${key}`;
      this._log.error(msg, e as Error);
      return false;
    }
  }

  /**
   * Retrieve a range of elements from a list stored at the specified key.
   *
   * @param namespace The namespace of the key
   * @param key The key of the list
   * @param start The starting index (0-based, inclusive)
   * @param stop The ending index (0-based, inclusive)
   * @returns Array of elements in the specified range, or an empty array if the key doesn't exist or an error occurred
   */
  public async getList(
    namespace: CacheNamespaces,
    key: string,
    start: number = 0,
    stop: number = -1,
  ): Promise<string[]> {
    if (!this.isReady()) return [];
    try {
      const finalKey = RedisCache.getNamespaceKey(namespace, key);
      return await this._client.lRange(finalKey, start, stop);
    } catch (e) {
      const msg = `An error occurred while getting list range for key: ${key}`;
      this._log.error(msg, e as Error);
      return [];
    }
  }
}
