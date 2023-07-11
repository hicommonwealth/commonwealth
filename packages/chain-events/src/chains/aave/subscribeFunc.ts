import sleep from 'sleep-promise';

import { createProvider } from '../../eth';
import { SupportedNetwork } from '../../interfaces';
import { addPrefix, factory } from '../../logging';
import { IAaveGovernanceV2__factory as IAaveGovernanceV2Factory } from '../../contractTypes';

import type { Api } from './types';

/**
 * Attempts to open an API connection, retrying if it cannot be opened.
 * @param ethNetworkUrl
 * @param governanceAddress
 * @param retryTimeMs
 * @param chain
 * @returns a promise resolving to an ApiPromise once the connection has been established
 */
export async function createApi(
  ethNetworkUrl: string,
  governanceAddress: string,
  retryTimeMs = 10 * 1000,
  chain?: string
): Promise<Api> {
  const log = factory.getLogger(
    addPrefix(__filename, [SupportedNetwork.Aave, chain])
  );
  for (let i = 0; i < 3; ++i) {
    try {
      const provider = await createProvider(
        ethNetworkUrl,
        SupportedNetwork.Aave,
        chain
      );

      // fetch governance contract
      const governanceContract = IAaveGovernanceV2Factory.connect(
        governanceAddress,
        provider
      );
      await governanceContract.deployed();

      return governanceContract;
    } catch (err) {
      log.error(
        `Aave ${governanceAddress} at ${ethNetworkUrl} failure: ${err.message}`
      );
      await sleep(retryTimeMs);
      log.error('Retrying connection...');
    }
  }

  throw new Error(
    `[${SupportedNetwork.Aave} ${
      chain ? `::${chain}` : ''
    }]: Failed to start Aave listener for ${governanceAddress} at ${ethNetworkUrl}`
  );
}
