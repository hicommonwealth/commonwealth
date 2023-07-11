import type { providers } from 'ethers';
import sleep from 'sleep-promise';

import { createProvider } from '../../eth';
import { SupportedNetwork } from '../../interfaces';
import { addPrefix, factory } from '../../logging';
import {
  GovernorAlpha__factory as GovernorAlphaFactory,
  GovernorCompatibilityBravo__factory as GovernorCompatibilityBravoFactory,
} from '../../contractTypes';

import type { Api } from './types';

/**
 * Attempts to open an API connection, retrying if it cannot be opened.
 * @returns a promise resolving to an ApiPromise once the connection has been established
 * @param ethNetworkUrl
 * @param governanceAddress
 * @param retryTimeMs
 * @param chain
 */
export async function createApi(
  ethNetworkUrl: string,
  governanceAddress: string,
  retryTimeMs = 10 * 1000,
  chain?: string
): Promise<Api> {
  const log = factory.getLogger(
    addPrefix(__filename, [SupportedNetwork.Compound, chain])
  );

  for (let i = 0; i < 3; ++i) {
    try {
      const provider = await createProvider(
        ethNetworkUrl,
        SupportedNetwork.Compound,
        chain
      );

      let contract: Api;
      try {
        contract = GovernorAlphaFactory.connect(governanceAddress, provider);
        await contract.deployed();
        await contract.guardian();
        log.info(`Found GovAlpha contract at ${contract.address}`);
      } catch (e) {
        contract = GovernorCompatibilityBravoFactory.connect(
          governanceAddress,
          provider
        );
        await contract.deployed();
        log.info(
          `Found non-GovAlpha Compound contract at ${contract.address}, using GovernorCompatibilityBravo`
        );
      }

      log.info(`Connection successful!`);
      return contract;
    } catch (err) {
      log.error(
        `Compound contract: ${governanceAddress} at url: ${ethNetworkUrl} failure: ${err.message}`
      );
      await sleep(retryTimeMs);
      log.error(`Retrying connection...`);
    }
  }

  throw new Error(
    `[${SupportedNetwork.Compound}${
      chain ? `::${chain}` : ''
    }]: Failed to start Compound listener for ${governanceAddress} at ${ethNetworkUrl}`
  );
}
