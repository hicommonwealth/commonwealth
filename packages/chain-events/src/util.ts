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
import { Listener as SubstrateListener } from 'chain-events/src/chain-bases/substrate/Listener';
import { Title as SubstrateTitle } from 'chain-events/src/chain-bases/substrate/filters/titler';
import { Label as SubstrateLabel } from 'chain-events/src/chain-bases/substrate/filters/labeler';
import {
  Listener as CompoundListener,
  Title as CompoundTitle,
  Label as CompoundLabel,
} from './chain-bases/EVM/compound';
import {
  Listener as Erc20Listener,
  Title as Erc20Title,
  Label as Erc20Label,
} from './chain-bases/EVM/erc20';
import {
  Listener as Erc721Listener,
  Title as Erc721Title,
  Label as Erc721Label,
} from './chain-bases/EVM/erc721';
import {
  Listener as AaveListener,
  Title as AaveTitle,
  Label as AaveLabel,
} from './chain-bases/EVM/aave';
import {
  Listener as CosmosListener,
  Title as CosmosTitle,
  Label as CosmosLabel,
} from 'chain-events/src/chain-bases/cosmos';
import type { Listener } from './Listener';
import { addPrefix, factory } from './logging';

export function Title(
  network: SupportedNetwork,
  kind: IChainEventKind
): IEventTitle {
  switch (network) {
    case SupportedNetwork.Substrate:
      return SubstrateTitle(kind);
    case SupportedNetwork.Aave:
      return AaveTitle(kind);
    case SupportedNetwork.Compound:
      return CompoundTitle(kind);
    case SupportedNetwork.ERC20:
      return Erc20Title(kind);
    case SupportedNetwork.ERC721:
      return Erc721Title(kind);
    case SupportedNetwork.Cosmos:
      return CosmosTitle(kind);
    default:
      throw new Error(`Invalid network: ${network}`);
  }
}

export function Label(communityId: string, event: CWEvent): IEventLabel {
  switch (event.network) {
    case SupportedNetwork.Substrate:
      return SubstrateLabel(event.blockNumber, communityId, event.data);
    case SupportedNetwork.Aave:
      return AaveLabel(event.blockNumber, communityId, event.data);
    case SupportedNetwork.Compound:
      return CompoundLabel(event.blockNumber, communityId, event.data);
    case SupportedNetwork.ERC20:
      return Erc20Label(event.blockNumber, communityId, event.data);
    case SupportedNetwork.ERC721:
      return Erc721Label(event.blockNumber, communityId, event.data);
    case SupportedNetwork.Cosmos:
      return CosmosLabel(event.blockNumber, communityId, event.data);
    default:
      throw new Error(`Invalid network: ${event.network}`);
  }
}

export function getEventOrigin(event: CWEvent): string {
  if (event.contractAddress)
    return event.chainName + ':' + event.contractAddress;
  else return event.chainName;
}

/**
 * Creates a listener instance and returns it if no error occurs. This function throws on error.
 * @param origin The chain to create a listener for
 * @param chainName
 * @param options The listener options for the specified chain
 * @param network the listener network to use
 */
export async function createListener(
  origin: string,
  chainName: string,
  network: SupportedNetwork,
  options: {
    url: string;
    address?: string;
    tokenAddresses?: string[];
    verbose?: boolean;
    skipCatchup?: boolean;
    startBlock?: number;
    archival?: boolean;
    spec?: RegisteredTypes;
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
  const log = factory.getLogger(addPrefix(__filename, [network, origin]));

  if (network === SupportedNetwork.Substrate) {
    // start a substrate listener
    listener = new SubstrateListener(
      origin,
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
    listener = new CompoundListener(
      origin,
      chainName,
      options.address,
      options.url,
      !!options.skipCatchup,
      !!options.verbose,
      options.discoverReconnectRange
    );
  } else if (network === SupportedNetwork.ERC20) {
    listener = new Erc20Listener(
      chainName,
      options.tokenAddresses || [options.address],
      options.url,
      options.enricherConfig,
      !!options.verbose
    );
  } else if (network === SupportedNetwork.ERC721) {
    listener = new Erc721Listener(
      chainName,
      options.tokenAddresses || [options.address],
      options.url,
      !!options.verbose
    );
  } else if (network === SupportedNetwork.Aave) {
    listener = new AaveListener(
      origin,
      chainName,
      options.address,
      options.url,
      !!options.skipCatchup,
      !!options.verbose,
      options.discoverReconnectRange
    );
  } else if (network === SupportedNetwork.Cosmos) {
    listener = new CosmosListener(
      origin,
      chainName,
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
