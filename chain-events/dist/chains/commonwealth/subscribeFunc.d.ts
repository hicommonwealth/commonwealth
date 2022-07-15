import { SubscribeFunc, ISubscribeOptions } from '../../interfaces';
import { RawEvent, Api } from './types';
/**
 * Attempts to open an API connection, retrying if it cannot be opened.
 * @param ethNetworkUrl
 * @param governanceAddress
 * @param retryTimeMs
 * @param chain
 * @returns a promise resolving to an ApiPromise once the connection has been established
 */
export declare function createApi(ethNetworkUrl: string, factoryAddress: string, retryTimeMs?: number, chain?: string): Promise<Api>;
/**
 * This is the main function for edgeware event handling. It constructs a connection
 * to the chain, connects all event-related modules, and initializes event handling.
 * @param options
 * @returns An active block subscriber.
 */
export declare const subscribeEvents: SubscribeFunc<Api, RawEvent, ISubscribeOptions<Api>>;
