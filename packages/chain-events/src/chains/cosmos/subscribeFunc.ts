import sleep from 'sleep-promise';

import type {
  IDisconnectedRange,
  CWEvent,
  SubscribeFunc,
  ISubscribeOptions,
} from '../../interfaces';
import { SupportedNetwork } from '../../interfaces';
import { addPrefix, factory } from '../../logging';

import { Subscriber } from './subscriber';
import { Processor } from './processor';
import type { Api, IEventData, RawEvent } from './types';

export interface ICosmosSubscribeOptions extends ISubscribeOptions<Api> {
  pollTime?: number;
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
  retryTimeMs = 10 * 1000,
  chain?: string
): Promise<Api> {
  const log = factory.getLogger(
    addPrefix(__filename, [SupportedNetwork.Cosmos, chain])
  );
  for (let i = 0; i < 3; ++i) {
    try {
      const tendermint = await import('@cosmjs/tendermint-rpc');
      const tm = await tendermint.Tendermint34Client.connect(url);
      const cosm = await import('@cosmjs/stargate');
      const rpc = cosm.QueryClient.withExtensions(
        tm,
        cosm.setupGovExtension,
        cosm.setupStakingExtension,
        cosm.setupBankExtension
      );
      const { createLCDClient } = await import(
        'common-common/src/cosmos-ts/src/codegen/cosmos/lcd'
      );
      const lcd = await createLCDClient({
        restEndpoint: url,
      });
      return { tm, rpc, lcd };
    } catch (err) {
      log.error(`Cosmos chain at url: ${url} failure: ${err.message}`);
      await sleep(retryTimeMs);
      log.error(`Retrying connection...`);
    }
  }

  throw new Error(
    `[${SupportedNetwork.Cosmos}${
      chain ? `::${chain}` : ''
    }]: Failed to start Cosmos chain at ${url}`
  );
}
