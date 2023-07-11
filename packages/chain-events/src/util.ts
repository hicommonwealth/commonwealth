import type {
  IDisconnectedRange,
  IEventProcessor,
  IEventSubscriber,
  IStorageFetcher,
  CWEvent,
  IEventLabel,
} from './interfaces';
import { SupportedNetwork } from './interfaces';
import { Label as SubstrateLabel } from './chains/substrate/filters/labeler';
import { Listener as EvmListener } from './chains/EVM';
import { Label as CompoundLabel } from './chains/compound';
import { Label as AaveLabel } from './chains/aave';
import {
  Listener as CosmosListener,
  Label as CosmosLabel,
} from './chains/cosmos';
import type { Listener } from './Listener';
import { addPrefix, factory } from './logging';
import { ethers } from 'ethers';

export function Label(chain: string, event: CWEvent): IEventLabel {
  switch (event.network) {
    case SupportedNetwork.Substrate:
      return SubstrateLabel(event.blockNumber, chain, event.data);
    case SupportedNetwork.Aave:
      return AaveLabel(event.blockNumber, chain, event.data);
    case SupportedNetwork.Compound:
      return CompoundLabel(event.blockNumber, chain, event.data);
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
    // TODO: @Timothee - Remove any type once listeners are combined
    listener = <any>(
      new EvmListener(
        chain,
        options.address,
        options.url,
        'compound',
        !!options.skipCatchup,
        !!options.verbose,
        options.discoverReconnectRange
      )
    );
  } else if (network === SupportedNetwork.Aave) {
    listener = <any>(
      new EvmListener(
        chain,
        options.address,
        options.url,
        'aave',
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
