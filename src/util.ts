import {
  IDisconnectedRange,
  IEventProcessor,
  IEventSubscriber,
  IStorageFetcher,
  SupportedNetwork,
  CWEvent,
  IEventTitle,
  IEventLabel,
  IChainEventKind,
} from './interfaces';
import {
  Listener as SubstrateListener,
  Title as SubstrateTitle,
  Label as SubstrateLabel,
} from './chains/substrate';
import {
  Listener as MolochListener,
  Title as MolochTitle,
  Label as MolochLabel,
} from './chains/moloch';
import {
  Listener as CompoundListener,
  Title as CompoundTitle,
  Label as CompoundLabel,
} from './chains/compound';
import {
  Listener as Erc20Listener,
  Title as Erc20Title,
  Label as Erc20Label,
} from './chains/erc20';
import {
  Listener as AaveListener,
  Title as AaveTitle,
  Label as AaveLabel,
} from './chains/aave';
import { Listener } from './Listener';
import { addPrefix, factory, formatFilename } from './logging';

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
    case SupportedNetwork.Moloch:
      return MolochTitle(kind);
    default:
      throw new Error(`Invalid network: ${network}`);
  }
}

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
    case SupportedNetwork.Moloch:
      return MolochLabel(event.blockNumber, chain, event.data);
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
    MolochContractVersion?: 1 | 2;
    verbose?: boolean;
    skipCatchup?: boolean;
    startBlock?: number;
    archival?: boolean;
    spec?: Record<string, unknown>;
    url?: string;
    enricherConfig?: any;
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
  } else if (network === SupportedNetwork.Moloch) {
    listener = new MolochListener(
      chain,
      options.MolochContractVersion ? options.MolochContractVersion : 2,
      options.address,
      options.url,
      !!options.skipCatchup,
      !!options.verbose,
      options.discoverReconnectRange
    );
  } else if (network === SupportedNetwork.Compound) {
    listener = new CompoundListener(
      chain,
      options.address,
      options.url,
      !!options.skipCatchup,
      !!options.verbose,
      options.discoverReconnectRange
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
  } else if (network === SupportedNetwork.Aave) {
    listener = new AaveListener(
      chain,
      options.address,
      options.url,
      !!options.skipCatchup,
      !!options.verbose,
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
