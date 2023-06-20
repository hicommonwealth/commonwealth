import sleep from 'sleep-promise';
import _ from 'underscore';
import BN from 'bn.js';

import { createProvider } from '../../eth';
import type {
  CWEvent,
  SubscribeFunc,
  ISubscribeOptions,
} from '../../interfaces';
import { SupportedNetwork } from '../../interfaces';
import { addPrefix, factory } from '../../logging';
import type { ERC20 } from '../../contractTypes';
import { ERC20__factory as ERC20Factory } from '../../contractTypes';

import { Subscriber } from './subscriber';
import { Processor } from './processor';
import type { IEventData, RawEvent, IErc20Contracts } from './types';
import type { EnricherConfig } from './filters/enricher';

export interface IErc20SubscribeOptions
  extends ISubscribeOptions<IErc20Contracts> {
  enricherConfig?: EnricherConfig;
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
): Promise<IErc20Contracts> {
  const log = factory.getLogger(
    addPrefix(__filename, [SupportedNetwork.ERC20])
  );

  for (let i = 0; i < 3; ++i) {
    try {
      const provider = await createProvider(
        ethNetworkUrl,
        SupportedNetwork.ERC20
      );
      log.info(`Connection to ${ethNetworkUrl} successful!`);

      const tokenContracts = tokenAddresses.map((o) =>
        ERC20Factory.connect(o, provider)
      );
      const deployResults: IErc20Contracts = { provider, tokens: [] };
      for (const [contract, tokenName] of _.zip(tokenContracts, tokenNames) as [
        ERC20,
        string | undefined
      ][]) {
        try {
          await contract.deployed();
          const totalSupply = new BN((await contract.totalSupply()).toString());
          deployResults.tokens.push({
            contract,
            totalSupply,
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
      log.error(`Erc20 at ${ethNetworkUrl} failure: ${err.message}`);
      await sleep(retryTimeMs);
      log.error('Retrying connection...');
    }
  }

  throw new Error(
    `[${SupportedNetwork.ERC20}]: Failed to start the ERC20 listener for ${tokenAddresses} at ${ethNetworkUrl}`
  );
}
