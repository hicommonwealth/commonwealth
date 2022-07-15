import { ApiPromise } from '@polkadot/api';
import { RegisteredTypes } from '@polkadot/types/types';
import { SubscribeFunc, ISubscribeOptions } from '../../interfaces';
import { Block } from './types';
import { EnricherConfig } from './filters/enricher';
export interface ISubstrateSubscribeOptions extends ISubscribeOptions<ApiPromise> {
    enricherConfig?: EnricherConfig;
}
/**
 * Attempts to open an API connection, retrying if it cannot be opened.
 * @param url websocket endpoing to connect to, including ws[s]:// and port
 * @param typeOverrides
 * @param chain
 * @returns a promise resolving to an ApiPromise once the connection has been established
 */
export declare function createApi(url: string, typeOverrides?: RegisteredTypes, chain?: string): Promise<ApiPromise>;
/**
 * This is the main function for substrate event handling. It constructs a connection
 * to the chain, connects all event-related modules, and initializes event handling.
 * @param options
 * @returns An active block subscriber.
 */
export declare const subscribeEvents: SubscribeFunc<ApiPromise, Block, ISubstrateSubscribeOptions>;
