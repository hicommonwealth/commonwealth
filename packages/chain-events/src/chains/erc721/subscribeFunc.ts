import sleep from 'sleep-promise';
import _ from 'underscore';

import { createProvider } from '../../eth';
import type {
  CWEvent,
  SubscribeFunc,
  ISubscribeOptions,
} from '../../interfaces';
import { SupportedNetwork } from '../../interfaces';
import { addPrefix, factory } from '../../logging';
import type { ERC721 } from '../../contractTypes';
import { ERC721__factory as ERC721Factory } from '../../contractTypes';

import { Subscriber } from './subscriber';
import { Processor } from './processor';
import type { IEventData, RawEvent, IErc721Contracts } from './types';

export interface IErc721SubscribeOptions
  extends ISubscribeOptions<IErc721Contracts> {
  enricherConfig?;
}

/**
 * Attempts to open an API connection, retrying if it cannot be opened.
 * @param ethNetworkUrl
 * @param tokenAddresses
 * @param tokenNames
 * @param retryTimeMs
 * @returns a promise resolving to an ApiPromise once the connection has been established

 */
export async function createApi(
  ethNetworkUrl: string,
  tokenAddresses: string[],
  tokenNames?: string[],
  retryTimeMs = 10 * 1000
): Promise<IErc721Contracts> {
  const log = factory.getLogger(
    addPrefix(__filename, [SupportedNetwork.ERC721])
  );

  for (let i = 0; i < 3; ++i) {
    try {
      const provider = await createProvider(
        ethNetworkUrl,
        SupportedNetwork.ERC721
      );
      log.info(`Connection to ${ethNetworkUrl} successful!`);

      const tokenContracts = tokenAddresses.map((o) =>
        ERC721Factory.connect(o, provider)
      );
      const deployResults: IErc721Contracts = { provider, tokens: [] };
      for (const [contract, tokenName] of _.zip(tokenContracts, tokenNames) as [
        ERC721,
        string | undefined
      ][]) {
        try {
          await contract.deployed();
          deployResults.tokens.push({
            contract,
            tokenName,
          });
        } catch (err) {
          log.error(
            `Error loading token ${contract.address} (${tokenName}): ${err.message}`
          );
        }
      }
      return deployResults;
    } catch (err) {
      log.error(`Erc721 at ${ethNetworkUrl} failure: ${err.message}`);
      await sleep(retryTimeMs);
      log.error('Retrying connection...');
    }
  }

  throw new Error(
    `[${SupportedNetwork.ERC721}]: Failed to start the ERC721 listener for ${tokenAddresses} at ${ethNetworkUrl}`
  );
}
