import {
  chainSupportedBy,
  EventSupportingChainT,
  IDisconnectedRange,
  IEventProcessor,
  IEventSubscriber,
  IStorageFetcher,
} from './interfaces';
import { EventChains as SubstrateChains } from './chains/substrate/types';
import {
  Listener as SubstrateListener,
  EnricherConfig,
} from './chains/substrate';
import { EventChains as MolochChains } from './chains/moloch/types';
import { Listener as MolochListener } from './chains/moloch/Listener';
import { EventChains as CompoundChains } from './chains/compound/types';
import { Listener as CompoundListener } from './chains/compound/Listener';
import { EventChains as Erc20Chain } from './chains/erc20/types';
import { Listener as Erc20Listener } from './chains/erc20';
import { EventChains as AaveChains } from './chains/aave/types';
import { Listener as AaveListener } from './chains/aave';
import { Listener } from './Listener';
import { factory, formatFilename } from './logging';

const log = factory.getLogger(formatFilename(__filename));

/**
 * Creates a listener instance and returns it if no error occurs. This function throws on error.
 * @param chain The chain to create a listener for
 * @param options The listener options for the specified chain
 * @param customChainBase Used to override the base system the chain is from if it does not yet exist in EventChains
 */
export async function createListener(
  chain: string,
  options: {
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
    enricherConfig?: EnricherConfig;
    discoverReconnectRange?: (c: string) => Promise<IDisconnectedRange>;
  },
  customChainBase?: string
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

  // checks chain compatibility or overrides
  function basePicker(base: string): boolean {
    if (customChainBase === base) return true;
    switch (base) {
      case 'substrate':
        return chainSupportedBy(chain, SubstrateChains);
      case 'moloch':
        return chainSupportedBy(chain, MolochChains);
      case 'compound':
        return chainSupportedBy(chain, CompoundChains);
      case 'erc20':
        return chainSupportedBy(chain, Erc20Chain);
      case 'aave':
        return chainSupportedBy(chain, AaveChains);
      default:
        return false;
    }
  }

  if (basePicker('substrate')) {
    // start a substrate listener
    listener = new SubstrateListener(
      <EventSupportingChainT>chain,
      options.url,
      options.spec,
      !!options.archival,
      options.startBlock || 0,
      !!options.skipCatchup,
      options.enricherConfig,
      !!options.verbose,
      !!customChainBase,
      options.discoverReconnectRange
    );
  } else if (basePicker('moloch')) {
    listener = new MolochListener(
      <EventSupportingChainT>chain,
      options.MolochContractVersion ? options.MolochContractVersion : 2,
      options.address,
      options.url,
      !!options.skipCatchup,
      !!options.verbose,
      options.discoverReconnectRange
    );
  } else if (basePicker('compound')) {
    listener = new CompoundListener(
      <EventSupportingChainT>chain,
      options.address,
      options.url,
      !!options.skipCatchup,
      !!options.verbose,
      options.discoverReconnectRange
    );
  } else if (basePicker('erc20')) {
    listener = new Erc20Listener(
      <EventSupportingChainT>chain,
      options.tokenAddresses || [options.address],
      options.url,
      Array.isArray(options.tokenNames) ? options.tokenNames : undefined,
      !!options.verbose,
      !!customChainBase
    );
  } else if (basePicker('aave')) {
    listener = new AaveListener(
      <EventSupportingChainT>chain,
      options.address,
      options.url,
      !!options.skipCatchup,
      !!options.verbose,
      !!customChainBase,
      options.discoverReconnectRange
    );
  } else {
    throw new Error(
      customChainBase
        ? `No listener built for ${customChainBase}`
        : "The given chain's base does not match any built in listener"
    );
  }

  try {
    if (!listener) throw new Error('Listener is still null');
    await listener.init();
  } catch (error) {
    log.error(`[${chain}]: Failed to initialize the listener`);
    throw error;
  }

  return listener;
}
