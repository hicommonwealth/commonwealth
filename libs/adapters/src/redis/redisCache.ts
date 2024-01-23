import { ILogger, logger, type CacheNamespaces } from '@hicommonwealth/core';
import {
  ConnectionTimeoutError,
  ReconnectStrategyError,
  SocketClosedUnexpectedlyError,
  createClient,
} from 'redis';

export function redisRetryStrategy(retries: number) {
  if (retries > 5) {
    return new Error('Redis max connection retries exceeded');
  }
  // timetable: 0, 1000, 8000, 27000, 64000, 125000, 216000, 343000, 512000, 729000, 1000000
  // from 1 sec to 16.67 minutes
  return (retries * 10) ** 3;
}

/**
 * This class facilitates interacting with Redis and constructing a Redis Cache. Note that all keys must use a namespace
 * prefix to divide the Redis keyspace. If a specific Redis command is not supported by this class you can access the
 * client directly or better yet open a PR that implements the class methods necessary to support the new Redis command.
 * WARNING: If running blocking arbitrary commands using the client directly be sure to include the 'isolated' option
 * in order to avoid blocking the client for other requests that may be occurring.
 */
export class RedisCache {
  private _initialized = false;
  private _client;
  private _log: ILogger;

  constructor() {
    this._log = logger().getLogger(__filename);
  }

  // get namespace key for redis
  static getNamespaceKey(namespace: CacheNamespaces, key: string) {
    return `${namespace}_${key}`;
  }

  /**
   * Initializes the Redis client. Must be run before any Redis command can be executed.
   */
  public async init(redis_url: string) {
    if (!redis_url) {
      this._log.warn(
        'Redis Url is undefined. Some services (e.g. chat) may not be available.',
      );
      this._initialized = false;
      return;
    }
    this._log.info(`Connecting to Redis at: ${redis_url}`);

    if (!this._client) {
      const redisOptions = {};
      redisOptions['url'] = redis_url;

      if (redis_url.includes('rediss')) {
        redisOptions['socket'] = {
          tls: true,
          rejectUnauthorized: false,
          reconnectStrategy: redisRetryStrategy,
        };
      } else {
        redisOptions['socket'] = {
          reconnectStrategy: redisRetryStrategy,
        };
      }

      this._client = createClient(redisOptions);
    }

    this._client.on('error', (err) => {
      if (err instanceof ConnectionTimeoutError) {
        const msg = `RedisCache connection to ${redis_url} timed out!`;
        this._log.error(msg);
      } else if (err instanceof ReconnectStrategyError) {
        const msg =
          'RedisCache max connection retries exceeded! RedisCache client shutting down!';
        this._log.fatal(msg);
      } else if (err instanceof SocketClosedUnexpectedlyError) {
        const msg = 'RedisCache socket closed unexpectedly';
        this._log.error(msg);
      } else {
        const msg = 'RedisCache unknown connection error:';
        this._log.error(msg, err);
      }
    });

    this._client.on('ready', () => {
      this._initialized = !!this._client.isOpen;
      this._log.info(`RedisCache connection ready ${this._initialized}`);
    });
    this._client.on('reconnecting', () => {
      this._initialized = !!this._client.isOpen;
      this._log.info(`RedisCache reconnecting ${this._initialized}`);
    });
    this._client.on('end', () => {
      this._initialized = !!this._client.isOpen;
      this._log.info(`RedisCache disconnected ${this._initialized}`);
    });

    if (!this._client.isOpen) {
      await this._client.connect();
    }

    this._initialized = !!this._client.isOpen;
  }

  private initialized() {
    if (!this._initialized) {
      this._log.warn(
        'Redis client is not initialized. Run RedisCache.init() first!',
      );
      return false;
    }
    return true;
  }

  /**
   * This function facilitates setting a key-value pair in Redis. Since Redis has a single keyspace we include a prefix
   * to simulate many keyspaces. That is, all key-value pairs for a specific functionality should use a matching prefix.
   * For example, for if we had chat WebSockets we store user_id => address key-value pairs. Since we may want to store
   * other data in which the key would be the user_id we use the 'chat_socket' prefix for all key-pairs pertaining to
   * the chat websocket. The resulting key would thus be 'chat_socket_[user_id]'. The prefix can be thought of as the
   * namespace of the data that you are trying to store.
   * @param namespace The prefix to append to the dynamic key i.e. the namespace. An instance of the
   * RedisNamespaces enum.
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
    let res;
    try {
      if (this.initialized()) {
        const finalKey = RedisCache.getNamespaceKey(namespace, key);
        if (typeof value !== 'string') {
          value = JSON.stringify(value);
        }
        if (duration > 0) {
          res = await this._client.set(finalKey, value, {
            EX: duration,
            NX: notExists,
          });
        } else {
          res = await this._client.set(finalKey, value, {
            NX: notExists,
          });
        }
      }
    } catch (e) {
      const msg = `An error occurred while setting the following key value pair '${namespace} ${key}: ${value}'`;
      this._log.error(msg, e);
      return false;
    }

    // redis returns 'OK' on successful write but if nothing is updated e.g. NX true then it returns null
    return res === 'OK';
  }

  public async getKey(
    namespace: CacheNamespaces,
    key: string,
  ): Promise<string> {
    try {
      if (this.initialized()) {
        const finalKey = RedisCache.getNamespaceKey(namespace, key);
        return await this._client.get(finalKey);
      }
    } catch (e) {
      const msg = `An error occurred while getting the following key '${key}'`;
      this._log.error(msg, e);
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
    if (this.initialized()) {
      // add the namespace prefix to all keys
      const transformedData = Object.keys(data).reduce((result, key) => {
        result[RedisCache.getNamespaceKey(namespace, key)] = data[key];
        return result;
      }, {});

      if (duration > 0) {
        // MSET doesn't support setting TTL, so we need use
        // a multi-exec to process many SET commands
        const multi = this._client.multi();
        for (const key of Object.keys(transformedData)) {
          multi.set(key, transformedData[key], { EX: duration });
        }

        try {
          let result: Array<'OK' | null>;
          if (transaction) result = await multi.exec();
          else result = await multi.execAsPipeline();
          return result;
        } catch (e) {
          const msg =
            `Error occurred while setting multiple keys ` +
            `${transaction ? 'in a transaction' : 'in a pipeline'}`;
          this._log.error(msg, e);
          return false;
        }
      } else {
        try {
          return await this._client.MSET(transformedData);
        } catch (e) {
          const msg = 'Error occurred while setting multiple keys';
          this._log.error(msg, e);
          return false;
        }
      }
    }
  }

  public async getKeys(
    namespace: CacheNamespaces,
    keys: string[],
  ): Promise<false | Record<string, unknown>> {
    if (this.initialized()) {
      const transformedKeys = keys.map((k) =>
        RedisCache.getNamespaceKey(namespace, k),
      );
      let result: Record<string, unknown>;
      try {
        const values = await this._client.MGET(transformedKeys);
        result = transformedKeys.reduce((obj, key, index) => {
          if (values[index] !== null) {
            obj[key] = values[index];
          }
          return obj;
        }, {});
      } catch (e) {
        const msg = 'An error occurred while getting many keys';
        this._log.error(msg, e);
        return false;
      }
      return result;
    }
  }

  /**
   * Get all the key-value pairs of a specific namespace.
   * @param namespace The name of the namespace to retrieve keys from
   * @param maxResults The maximum number of keys to retrieve from the given namespace
   */
  public async getNamespaceKeys(
    namespace: CacheNamespaces,
    maxResults = 1000,
  ): Promise<{ [key: string]: string } | boolean> {
    const keys = [];
    const data = {};
    try {
      if (this.initialized()) {
        for await (const key of this._client.scanIterator({
          MATCH: `${namespace}*`,
          COUNT: maxResults,
        })) {
          keys.push(key);
        }
        for (const key of keys) {
          data[key] = await this._client.get(key);
        }
        return data;
      }
    } catch (e) {
      const msg = 'An error occurred while fetching the namespace keys';
      this._log.error(msg, e);
      return false;
    }
  }

  /**
   * Run this function when you are done utilizing the Redis client. Do not run this function if the Redis client is
   * expected to be long-lived and utilized frequently. In other words don't create a client and then disconnect for
   * every API route. Instead, if you need the Redis client in an API route you should initialize a RedisCache instance
   * alongside the server initialization so that the instance can be used by all routes.
   */
  public async closeClient(): Promise<boolean> {
    if (this._initialized) {
      await this._client.quit();
      this._initialized = false;
    }
    return true;
  }

  public get name(): string {
    return 'RedisCache';
  }

  public async dispose(): Promise<void> {
    await this.closeClient();
  }

  /**
   * Check if redis is initialized
   * @returns boolean
   */
  public isInitialized(): boolean {
    return this._initialized;
  }

  /**
   * delete redis key by namespace and key
   * @returns boolean
   */
  public async deleteNamespaceKeys(
    namespace: CacheNamespaces,
  ): Promise<number | boolean> {
    try {
      let count = 0;
      const data = await this.getNamespaceKeys(namespace);
      if (data) {
        for (const key of Object.keys(data)) {
          try {
            const resp = await this._client.del(key);
            count += resp;
            this._log.trace(`deleted key ${key} ${resp} ${count}`);
          } catch (err) {
            this._log.trace(`error deleting key ${key}`);
            this._log.trace(err);
          }
        }
      }
      return count;
    } catch (e) {
      const msg = `An error occurred while deleting a all keys in the ${namespace} namespace`;
      this._log.error(msg, e);
      return false;
    }
  }

  public async deleteKey(
    namespace: CacheNamespaces,
    key: string,
  ): Promise<number> {
    const finalKey = RedisCache.getNamespaceKey(namespace, key);
    try {
      if (this.initialized()) {
        return this._client.del(finalKey);
      }
    } catch (e) {
      const msg = `An error occurred while deleting the following key: ${finalKey}`;
      this._log.error(msg, e);
      return 0;
    }
  }

  public get client(): typeof this._client {
    return this._client;
  }
}
