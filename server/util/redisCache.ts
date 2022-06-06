import { createClient } from 'redis';
import { factory, formatFilename } from '../../shared/logging';
import {REDIS_URL} from "../config";
import {RedisNamespaces} from "../../shared/types";

const log = factory.getLogger(formatFilename(__filename));

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

  /**
   * Initializes the Redis client. Must be run before any Redis command can be executed.
   */
  public async init() {
    log.info(`Connecting to Redis at: ${REDIS_URL}`);

    if (!this.client) {
      this.client = createClient({ url: REDIS_URL, socket: { tls: true, rejectUnauthorized: false } });
    }

    this.client.on('error', (err) => log.error('Redis Client Error', err));

    if (!this.client.isOpen) {
      await this.client.connect();
    }

    this.initialized = true;
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
  public async setKey(namespace: RedisNamespaces, key: string, value: string) {
    if (!this.initialized) {
      log.error("Redis client is not initialized. Run RedisCache.init() first!")
      return;
    }
    const finalKey = namespace + '_' + key;

    try {
      await this.client.set(finalKey, value);
    } catch (e) {
      log.error(`An error occurred while setting the following key value pair '${finalKey}: ${value}'`, e);
    }
  }

  public async getKey(namespace: RedisNamespaces, key: string) {
    const finalKey = namespace + '_' + 'key';
    return this.client.get(finalKey);
  }

  /**
   * This function works the same way at the 'setKey' function above but is meant to be used when multiple key value
   * pairs need to be inserted at the same time in an 'all or none' fashion i.e. SQL transaction style.
   * @param namespace
   * @param data
   */
  public async setKeys(namespace: string, data: {[key: string]: string}) {
    if (!this.initialized) {
      log.error("Redis client is not initialized. Run RedisCache.init() first!")
      return;
    }
  }

  /**
   * Run this function when you are done utilizing the Redis client. Do not run this function if the Redis client is
   * expected to be long-lived and utilized frequently. In other words don't create a client and then disconnect for
   * every API route. Instead, if you need the Redis client in an API route you should initialize a RedisCache instance
   * alongside the server initialization so that the instance can be used by all routes.
   */
  public async closeClient() {
    await this.client.quit();
    this.initialized = false;
  }
}
