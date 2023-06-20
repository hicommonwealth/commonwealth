import sleep from 'sleep-promise';

import { createProvider } from '../../eth';
import { SupportedNetwork } from '../../interfaces';
import { addPrefix, factory } from '../../logging';
import {
  IAaveGovernanceV2__factory as IAaveGovernanceV2Factory,
  GovernanceStrategy__factory as GovernanceStrategyFactory,
  GovernancePowerDelegationERC20__factory as GovernancePowerDelegationERC20Factory,
} from '../../contractTypes';

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

      try {
        // fetch strategy to get tokens
        // TODO: ensure that all governance contracts have a valid strategy
        //   i.e. with these specific tokens -- we may want to take the token addresses
        //   directly rather than fetch from the contract.
        const strategyAddress =
          await governanceContract.getGovernanceStrategy();
        const strategy = GovernanceStrategyFactory.connect(
          strategyAddress,
          provider
        );
        await strategy.deployed();

        // fetch tokens
        const aaveTokenAddress = await strategy.AAVE();
        const stkAaveTokenAddress = await strategy.STK_AAVE();
        const aaveToken = GovernancePowerDelegationERC20Factory.connect(
          aaveTokenAddress,
          provider
        );
        const stkAaveToken = GovernancePowerDelegationERC20Factory.connect(
          stkAaveTokenAddress,
          provider
        );
        await aaveToken.deployed();
        await stkAaveToken.deployed();

        // confirm we the token types are correct
        await aaveToken.DELEGATE_TYPEHASH();
        await stkAaveToken.DELEGATE_TYPEHASH();

        log.info('Connection successful!');
        return {
          governance: governanceContract,
          aaveToken,
          stkAaveToken,
        };
      } catch (err) {
        log.warn(
          'Governance connection successful but token connections failed.'
        );
        log.warn('Delegation events will not be emitted.');
        return {
          governance: governanceContract,
        };
      }
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
