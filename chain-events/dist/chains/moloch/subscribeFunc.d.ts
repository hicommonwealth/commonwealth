import { SubscribeFunc } from '../../interfaces';
import { RawEvent, Api, SubscribeOptions } from './types';
/**
 * Attempts to open an API connection, retrying if it cannot be opened.
 * @returns a promise resolving to an ApiPromise once the connection has been established
 * @param ethNetworkUrl
 * @param contractVersion
 * @param contractAddress
 * @param retryTimeMs
 * @param chain
 */
export declare function createApi(ethNetworkUrl: string, contractVersion: 1 | 2, contractAddress: string, retryTimeMs?: number, chain?: string): Promise<Api>;
/**
 * This is the main function for edgeware event handling. It constructs a connection
 * to the chain, connects all event-related modules, and initializes event handling.
 * @param options
 * @returns An active block subscriber.
 */
export declare const subscribeEvents: SubscribeFunc<Api, RawEvent, SubscribeOptions>;
