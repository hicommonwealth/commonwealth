import type { RegisteredTypes } from '@polkadot/types/types';

import type {
  IDisconnectedRange,
  IEventProcessor,
  IEventSubscriber,
  IStorageFetcher,
  CWEvent,
  IEventTitle,
  IEventLabel,
  IChainEventKind,
} from './interfaces';
import { SupportedNetwork } from './interfaces';
import { Listener as SubstrateListener } from './chains/substrate/Listener';
import { Label as SubstrateLabel } from './chains/substrate/filters/labeler';
import {
  Listener as CompoundListener,
  Label as CompoundLabel,
} from './chains/compound';
import { Listener as Erc20Listener, Label as Erc20Label } from './chains/erc20';
import {
  Listener as Erc721Listener,
  Label as Erc721Label,
} from './chains/erc721';
import { Listener as AaveListener, Label as AaveLabel } from './chains/aave';
import {
  Listener as CosmosListener,
  Label as CosmosLabel,
} from './chains/cosmos';
import type { Listener } from './Listener';
import { addPrefix, factory } from './logging';

export function Label(chain: string, event: CWEvent): IEventLabel {
  switch (event.network) {
    case SupportedNetwork.Substrate:
      return SubstrateLabel(event.blockNumber, chain, event.data);
    case SupportedNetwork.Aave:
      return AaveLabel(event.blockNumber, chain, event.data);
    case SupportedNetwork.Compound:
      return CompoundLabel(event.blockNumber, chain, event.data);
    case SupportedNetwork.ERC20:
      return Erc20Label(event.blockNumber, chain, event.data);
    case SupportedNetwork.ERC721:
      return Erc721Label(event.blockNumber, chain, event.data);
    case SupportedNetwork.Cosmos:
      return CosmosLabel(event.blockNumber, chain, event.data);
    default:
      throw new Error(`Invalid network: ${event.network}`);
  }
}

/**
 * Creates a listener instance and returns it if no error occurs. This function throws on error.
 * @param chain The chain to create a listener for
 * @param options The listener options for the specified chain
 * @param network the listener network to use
 */
export async function createListener(
  chain: string,
  network: SupportedNetwork,
  options: {
    address?: string;
    tokenAddresses?: string[];
    tokenNames?: string[];
    verbose?: boolean;
    skipCatchup?: boolean;
    startBlock?: number;
    archival?: boolean;
    spec?: RegisteredTypes;
    url?: string;
    enricherConfig?: any;
    pollTime?: number;
    discoverReconnectRange?: (c: string) => Promise<IDisconnectedRange>;
  }
): Promise<
  Listener<
    any,
    IStorageFetcher<any>,
    IEventProcessor<any, any>,
    IEventSubscriber<any, any>,
    any
  >
> {
  let listener: Listener<
    any,
    IStorageFetcher<any>,
    IEventProcessor<any, any>,
    IEventSubscriber<any, any>,
    any
  >;
  const log = factory.getLogger(addPrefix(__filename, [network, chain]));

  if (network === SupportedNetwork.Substrate) {
    // start a substrate listener
    listener = new SubstrateListener(
      chain,
      options.url,
      options.spec,
      !!options.archival,
      options.startBlock || 0,
      !!options.skipCatchup,
      options.enricherConfig,
      !!options.verbose,
      options.discoverReconnectRange
    );
  } else if (network === SupportedNetwork.Compound) {
    // TODO: @Timothee - Remove any type once listeners are combined
    listener = <any>(
      new CompoundListener(
        chain,
        options.address,
        options.url,
        !!options.skipCatchup,
        !!options.verbose,
        options.discoverReconnectRange
      )
    );
  } else if (network === SupportedNetwork.ERC20) {
    listener = new Erc20Listener(
      chain,
      options.tokenAddresses || [options.address],
      options.url,
      Array.isArray(options.tokenNames) ? options.tokenNames : undefined,
      options.enricherConfig,
      !!options.verbose
    );
  } else if (network === SupportedNetwork.ERC721) {
    listener = new Erc721Listener(
      chain,
      options.tokenAddresses || [options.address],
      options.url,
      Array.isArray(options.tokenNames) ? options.tokenNames : undefined,
      !!options.verbose
    );
  } else if (network === SupportedNetwork.Aave) {
    listener = <any>(
      new AaveListener(
        chain,
        options.address,
        options.url,
        !!options.skipCatchup,
        !!options.verbose,
        options.discoverReconnectRange
      )
    );
  } else if (network === SupportedNetwork.Cosmos) {
    listener = new CosmosListener(
      chain,
      options.url,
      !!options.skipCatchup,
      options.pollTime,
      options.verbose,
      options.discoverReconnectRange
    );
  } else {
    throw new Error(`Invalid network: ${network}`);
  }

  try {
    if (!listener) throw new Error('Listener is still null');
    await listener.init();
  } catch (error) {
    log.error(`Failed to initialize the listener`);
    throw error;
  }

  return listener;
}

export function populateRange(
  range: IDisconnectedRange,
  currentBlock: number
): IDisconnectedRange {
  // populate range fully if not given
  if (!range) {
    range = { startBlock: 0 };
  } else if (!range.startBlock) {
    range.startBlock = 0;
  } else if (range.startBlock >= currentBlock) {
    throw new Error(
      `Start block ${range.startBlock} greater than current block ${currentBlock}!`
    );
  }
  if (!range.endBlock) {
    range.endBlock = currentBlock;
  }
  if (range.startBlock >= range.endBlock) {
    throw new Error(
      `Invalid fetch range: ${range.startBlock}-${range.endBlock}.`
    );
  }
  return range;
}
