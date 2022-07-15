import { SubscribeFunc, ISubscribeOptions } from '../../interfaces';
import { RawEvent, IErc721Contracts } from './types';
export interface IErc721SubscribeOptions extends ISubscribeOptions<IErc721Contracts> {
    enricherConfig?: any;
}
/**
 * Attempts to open an API connection, retrying if it cannot be opened.
 * @param ethNetworkUrl
 * @param tokenAddresses
 * @param tokenNames
 * @param retryTimeMs
 * @returns a promise resolving to an ApiPromise once the connection has been established

 */
export declare function createApi(ethNetworkUrl: string, tokenAddresses: string[], tokenNames?: string[], retryTimeMs?: number): Promise<IErc721Contracts>;
/**
 * This is the main function for edgeware event handling. It constructs a connection
 * to the chain, connects all event-related modules, and initializes event handling.
 * @param options
 * @returns An active block subscriber.
 */
export declare const subscribeEvents: SubscribeFunc<IErc721Contracts, RawEvent, IErc721SubscribeOptions>;
