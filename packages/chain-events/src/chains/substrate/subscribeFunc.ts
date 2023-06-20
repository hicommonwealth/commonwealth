import { WsProvider } from '@polkadot/rpc-provider/ws';
import type { ApiPromise } from '@polkadot/api/promise';
import type { RegisteredTypes } from '@polkadot/types/types';

import type {
  IDisconnectedRange,
  CWEvent,
  SubscribeFunc,
  ISubscribeOptions,
} from '../../interfaces';
import { SupportedNetwork } from '../../interfaces';
import { addPrefix, factory } from '../../logging';

import { Subscriber } from './subscriber';
import { Poller } from './poller';
import { Processor } from './processor';
import type { Block, IEventData } from './types';
import type { EnricherConfig } from './filters/enricher';

export interface ISubstrateSubscribeOptions
  extends ISubscribeOptions<ApiPromise> {
  enricherConfig?: EnricherConfig;
}

/**
 * Attempts to open an API connection, retrying if it cannot be opened.
 * @param url websocket endpoing to connect to, including ws[s]:// and port
 * @param typeOverrides
 * @param chain
 * @returns a promise resolving to an ApiPromise once the connection has been established
 */
export async function createApi(
  url: string,
  typeOverrides: RegisteredTypes = {},
  chain?: string
): Promise<ApiPromise> {
  const log = factory.getLogger(
    addPrefix(__filename, [SupportedNetwork.Substrate, chain])
  );
  for (let i = 0; i < 3; ++i) {
    const provider = new WsProvider(url, 0);
    let unsubscribe: () => void;
    const success = await new Promise<boolean>((resolve) => {
      unsubscribe = provider.on('connected', () => resolve(true));

      provider.on('error', () => {
        if (i < 2)
          log.warn(`An error occurred connecting to ${url} - retrying...`);
        resolve(false);
      });

      provider.on('disconnected', () => resolve(false));

      provider.connect();
    });

    // construct API using provider
    if (success) {
      unsubscribe();
      const polkadot = await import('@polkadot/api/promise');
      return polkadot.ApiPromise.create({
        provider,
        ...typeOverrides,
      });
    }
    // TODO: add delay
  }

  throw new Error(
    `[${SupportedNetwork.Substrate}${
      chain ? `::${chain}` : ''
    }]: Failed to connect to API endpoint at: ${url}`
  );
}
