import { IDisconnectedRange, IEventProcessor, IEventSubscriber, IStorageFetcher, SupportedNetwork, CWEvent, IEventTitle, IEventLabel, IChainEventKind } from './interfaces';
import { Listener } from './Listener';
export declare function Title(network: SupportedNetwork, kind: IChainEventKind): IEventTitle;
export declare function Label(chain: string, event: CWEvent): IEventLabel;
/**
 * Creates a listener instance and returns it if no error occurs. This function throws on error.
 * @param chain The chain to create a listener for
 * @param options The listener options for the specified chain
 * @param network the listener network to use
 */
export declare function createListener(chain: string, network: SupportedNetwork, options: {
    address?: string;
    tokenAddresses?: string[];
    tokenNames?: string[];
    MolochContractVersion?: 1 | 2;
    verbose?: boolean;
    skipCatchup?: boolean;
    startBlock?: number;
    archival?: boolean;
    spec?: Record<string, unknown>;
    url?: string;
    enricherConfig?: any;
    discoverReconnectRange?: (c: string) => Promise<IDisconnectedRange>;
}): Promise<Listener<any, IStorageFetcher<any>, IEventProcessor<any, any>, IEventSubscriber<any, any>, any>>;
