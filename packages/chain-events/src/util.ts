import type {
  IDisconnectedRange,
  IEventProcessor,
  IEventSubscriber,
  IStorageFetcher,
  CWEvent,
  IEventLabel,
} from './interfaces';
import { SupportedNetwork } from './interfaces';
import {
  Listener as CompoundListener,
  Label as CompoundLabel,
} from './chains/compound';
import { Listener as AaveListener, Label as AaveLabel } from './chains/aave';
import {
  Listener as CosmosListener,
  Label as CosmosLabel,
} from './chains/cosmos';
import type { Listener } from './Listener';
import { addPrefix, factory } from './logging';
import { ethers } from 'ethers';

export function Label(
  chain: string,
  event: Omit<CWEvent, 'blockNumber'>
): IEventLabel {
  switch (event.network) {
    case SupportedNetwork.Aave:
      return AaveLabel(chain, event.data);
    case SupportedNetwork.Compound:
      return CompoundLabel(chain, event.data);
    case SupportedNetwork.Cosmos:
      return CosmosLabel(chain, event.data);
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

  if (network === SupportedNetwork.Compound) {
    listener = new CompoundListener(
      chain,
      options.address,
      options.url,
      !!options.skipCatchup,
      !!options.verbose,
      options.discoverReconnectRange
    );
  } else if (network === SupportedNetwork.Aave) {
    listener = new AaveListener(
      chain,
      options.address,
      options.url,
      !!options.skipCatchup,
      !!options.verbose,
      options.discoverReconnectRange
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

/**
 * Converts a string or integer number into a hexadecimal string that adheres to the following guidelines
 * https://ethereum.org/en/developers/docs/apis/json-rpc/#quantities-encoding
 * @param decimal
 */
export function decimalToHex(decimal: number | string) {
  if (decimal == '0') {
    return '0x0';
  } else {
    return ethers.utils.hexStripZeros(
      ethers.BigNumber.from(decimal).toHexString()
    );
  }
}
