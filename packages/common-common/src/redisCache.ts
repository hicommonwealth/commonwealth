import {
  ConnectionTimeoutError,
  createClient,
  ReconnectStrategyError,
  SocketClosedUnexpectedlyError,
} from 'redis';
import type { RedisNamespaces } from './types';
import type Rollbar from 'rollbar';
import { factory, formatFilename } from 'common-common/src/logging';

const log = factory.getLogger(formatFilename(__filename));

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
  private initialized = false;
  private client;
  private rollbar?: Rollbar;

  constructor(rollbar_?: Rollbar) {
    this.rollbar = rollbar_;
  }

  // get namespace key for redis
  static getNamespaceKey(namespace: RedisNamespaces, key: string) {
    return `${namespace}_${key}`;
  }

  /**
   * Initializes the Redis client. Must be run before any Redis command can be executed.
   */
  public async init(redis_url: string, vultr_ip?: string) {
    if (!redis_url) {
      log.warn(
        'Redis Url is undefined. Some services (e.g. chat) may not be available.'
      );
      this.initialized = false;
      return;
    }
    log.info(`Connecting to Redis at: ${redis_url}`);

    const localRedis =
      redis_url.includes('localhost') || redis_url.includes('127.0.0.1');
    const vultrRedis = redis_url.includes(vultr_ip);

    if (!this.client) {
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

      this.client = createClient(redisOptions);
    }

    this.client.on('error', (err) => {
      if (err instanceof ConnectionTimeoutError) {
        log.error(`RedisCache connection to ${redis_url} timed out!`);
      } else if (err instanceof ReconnectStrategyError) {
        log.error(`RedisCache max connection retries exceeded!`);
        if (!localRedis && !vultrRedis)
          this.rollbar.critical(
            'RedisCache max connection retries exceeded! RedisCache client shutting down!'
          );
      } else if (err instanceof SocketClosedUnexpectedlyError) {
        log.error(`RedisCache socket closed unexpectedly`);
      } else {
        log.error(`RedisCache connection error:`, err);
        if (!localRedis && !vultrRedis)
          this.rollbar.critical('RedisCache unknown connection error!', err);
      }
    });

    this.client.on('ready', () => {
      log.info('RedisCache connection ready');
      this.initialized = !!this.client.isOpen;
    });
    this.client.on('reconnecting', () => {
      log.info('RedisCache reconnecting');
      this.initialized = !!this.client.isOpen;
    });
    this.client.on('end', () => {
      log.info('RedisCache disconnected');
      this.initialized = !!this.client.isOpen;
    });

    if (!this.client.isOpen) {
      await this.client.connect();
    }

    this.initialized = !!this.client.isOpen;
  }

  /**
   * This function facilitates setting a key-value pair in Redis. Since Redis has a single keyspace we include a prefix
   * to simulate many keyspaces. That is, all key-value pairs for a specific functionality should use a matching prefix.
   * For example, for the chat WebSockets we store user_id => address key-value pairs. Since we may want to store other
   * data in which the key would be the user_id we use the 'chat_socket' prefix for all key-pairs pertaining to the
   * chat websocket. The resulting key would thus be 'chat_socket_[user_id]'. The prefix can be thought of as the
   * namespace of the data that you are trying to store.
   * @param namespace The prefix to append to the dynamic key i.e. the namespace. An instance of the RedisNamespaces enum.
   * @param key The actual key you want to store (can be any valid string).
   * @param value The value to associate with the namespace and key
   */
  public async setKey(
    namespace: RedisNamespaces,
    key: string,
    value: string,
    duration = 0 // no ttl   
  ): Promise<boolean> {
    if (!this.initialized) {
      log.error(
        'Redis client is not initialized. Run RedisCache.init() first!'
      );
      return false;
    }
    const finalKey = RedisCache.getNamespaceKey(namespace, key);

    if (typeof value !== 'string') {
      value = JSON.stringify(value);
    }

    try {
      if (duration > 0) {
        await this.client.set(finalKey, value, {
          EX: duration
        });
      } else {
        await this.client.set(finalKey, value);
      }
    } catch (e) {
      log.error(
        `An error occurred while setting the following key value pair '${finalKey}: ${value}'`,
        e
      );
      return false;
    }

    return true;
  }

  public async getKey(
    namespace: RedisNamespaces,
    key: string
  ): Promise<string> {
    if (!this.initialized) {
      log.error(
        'Redis client is not initialized. Run RedisCache.init() first!'
      );
      return;
    }

    const finalKey = RedisCache.getNamespaceKey(namespace, key);
    return await this.client.get(finalKey);
  }

  /**
   * This function works the same way at the 'setKey' function above but is meant to be used when multiple key value
   * pairs need to be inserted at the same time in an 'all or none' fashion i.e. SQL transaction style.
   * @param namespace
   * @param data
   */
  public async setKeys(
    namespace: RedisNamespaces,
    data: { [key: string]: string }
  ): Promise<boolean> {
    if (!this.initialized) {
      log.error(
        'Redis client is not initialized. Run RedisCache.init() first!'
      );
      return false;
    }

    try {
      this.client.MSET(data);
    } catch (e) {
      log.error(
        `An error occurred while setting the following data: ${data}`,
        e
      );
      return false;
    }

    return true;
  }

  /**
   * Get all the key-value pairs of a specific namespace.
   * @param namespace The name of the namespace to retrieve keys from
   * @param maxResults The maximum number of keys to retrieve from the given namespace
   */
  public async getNamespaceKeys(
    namespace: RedisNamespaces,
    maxResults = 1000
  ): Promise<{ [key: string]: string } | boolean> {
    if (!this.initialized) {
      log.error(
        'Redis client is not initialized. Run RedisCache.init() first!'
      );
      return false;
    }

    const keys = [];
    const data = {};
    try {
      for await (const key of this.client.scanIterator({
        MATCH: `${namespace}*`,
        COUNT: maxResults,
      })) {
        keys.push(key);
      }

      for (const key of keys) {
        data[key] = await this.client.get(key);
      }

      return data;
    } catch (e) {
      log.error(e);
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
    await this.client.quit();
    this.initialized = false;
    return true;
  }

  /**
   * Check if redis is initialized
   * @returns boolean
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * delete redis key by namespace and key
   * @returns boolean
   */
  public async deleteNamespaceKeys(
    namespace: RedisNamespaces
  ): Promise<number | boolean> {
    try {
      let count = 0;
      const data = await this.getNamespaceKeys(namespace);
      if (data) {
        for (const key of Object.keys(data)) {
          try {
            const resp = await this.client.del(key);
            count += resp;
            log.trace(`deleted key ${key} ${resp} ${count}`)
          } catch (err) {
            log.trace(`error deleting key ${key}`)
            log.trace(err);
          }
        }
      }
      return count;
    } catch (e) {
      log.error(e);
      return false;
    }
  }
}
