import {
  commonProtocol as cp,
  launchpadFactoryAbi,
  lpBondingCurveAbi,
} from '@hicommonwealth/evm-protocols';
import { models } from '@hicommonwealth/model';
import { describe, expect, test, vi } from 'vitest';
import { Contract } from 'web3';
import { AbiItem } from 'web3-utils';
import { setupCommonwealthE2E } from './integrationUtils/mainSetup';

describe('End to end event tests', () => {
  test(
    'Token trade happy path',
    async () => {
      const { web3, mineBlocks, anvilAccounts, contractAddresses } =
        await setupCommonwealthE2E();

      const launchpadFactory = new web3.eth.Contract(
        launchpadFactoryAbi as AbiItem[],
        contractAddresses.launchpad,
      ) as unknown as Contract<typeof launchpadFactoryAbi>;

      const lpBondingCurveFactory = new web3.eth.Contract(
        lpBondingCurveAbi,
        contractAddresses.lpBondingCurve,
      );

      const baseNonce = await web3.eth.getTransactionCount(
        anvilAccounts[0].address,
      );
      let nonce = baseNonce;

      async function launchAndBuyToken(name, symbol) {
        console.log(`launching token ${nonce}`);

        // temp
        nonce += BigInt(1);
        try {
          await cp.launchToken(
            launchpadFactory,
            name,
            symbol,
            [],
            [],
            web3.utils.toWei(1e9, 'ether'),
            anvilAccounts[0].address,
            830000,
            contractAddresses.tokenCommunityManager,
            Number(nonce),
          );
        } catch (e) {
          console.log(e);
        }

        console.log(`launched token ${nonce}`);

        await mineBlocks(1);

        let token = await models.LaunchpadToken.findOne({
          where: { name },
        });

        await vi.waitFor(
          async () => {
            token = await models.LaunchpadToken.findOne({
              where: { name },
            });
            if (!token) {
              throw new Error('Token not found yet');
            }
          },
          {
            timeout: 100000,
            interval: 500,
          },
        );

        await cp.buyToken(
          lpBondingCurveFactory,
          token.token_address,
          anvilAccounts[0].address,
          100,
        );

        console.log(`bought token ${nonce}`);

        await mineBlocks(1);
      }

      const tokenLaunchPromises = [
        { name: 'testToken1', symbol: 'TT1', nonce: 1 },
        { name: 'testToken2', symbol: 'TT2', nonce: 2 },
        { name: 'testToken3', symbol: 'TT3', nonce: 3 },
        { name: 'testToken4', symbol: 'TT4', nonce: 4 },
        { name: 'testToken5', symbol: 'TT5', nonce: 5 },
        { name: 'testToken6', symbol: 'TT6', nonce: 6 },
        { name: 'testToken7', symbol: 'TT7', nonce: 7 },
        { name: 'testToken8', symbol: 'TT8', nonce: 8 },
        { name: 'testToken9', symbol: 'TT9', nonce: 9 },
        { name: 'testToken10', symbol: 'TT10', nonce: 10 },
      ];

      await Promise.all(
        tokenLaunchPromises.map(({ name, symbol }) =>
          launchAndBuyToken(name, symbol),
        ),
      );

      await vi.waitFor(
        async () => {
          const launchpadTrades = await models.LaunchpadTrade.findAll();
          expect(launchpadTrades.length).toEqual(10);
        },
        {
          timeout: 100000,
          interval: 500,
        },
      );
    },
    { timeout: 1000000 },
  );
});
