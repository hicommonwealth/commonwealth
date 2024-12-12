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

      await cp.launchToken(
        launchpadFactory,
        'testToken',
        'test',
        [],
        [],
        web3.utils.toWei(1e9, 'ether'),
        anvilAccounts[0].address,
        830000,
        contractAddresses.tokenCommunityManager,
      );

      await mineBlocks(1);

      let token = await models.Token.findOne({
        where: { name: 'testToken' },
      });
      await vi.waitFor(
        async () => {
          token = await models.Token.findOne({
            where: { name: 'testToken' },
          });
          expect(token).toBeTruthy();
        },
        {
          timeout: 100000,
          interval: 500,
        },
      );

      const lpBondingCurveFactory = new web3.eth.Contract(
        lpBondingCurveAbi as AbiItem[],
        contractAddresses.lpBondingCurve,
      ) as unknown as Contract<typeof lpBondingCurveAbi>;

      await cp.buyToken(
        lpBondingCurveFactory,
        token!.token_address,
        anvilAccounts[0].address,
        100,
      );

      await mineBlocks(1);

      await vi.waitFor(
        async () => {
          const launchpadTrade = await models.LaunchpadTrade.findOne({
            where: { token_address: token!.token_address, is_buy: true },
          });
          expect(launchpadTrade).toBeTruthy();
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
