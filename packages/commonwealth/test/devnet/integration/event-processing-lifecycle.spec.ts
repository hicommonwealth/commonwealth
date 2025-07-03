import {
  LaunchpadAbi,
  LPBondingCurveAbi,
} from '@commonxyz/common-protocol-abis';
import { commonProtocol as cp } from '@hicommonwealth/evm-protocols';
import { models } from '@hicommonwealth/model/db';
import { describe, expect, test, vi } from 'vitest';
import { setupCommonwealthE2E } from './integrationUtils/mainSetup';

describe('End to end event tests', () => {
  test(
    'Token trade happy path',
    async () => {
      const { web3, anvilAccounts, contractAddresses } =
        await setupCommonwealthE2E();

      const launchpadFactory = new web3.eth.Contract(
        LaunchpadAbi,
        contractAddresses.launchpad,
      );

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

      let token = await models.LaunchpadToken.findOne({
        where: { name: 'testToken' },
      });
      await vi.waitFor(
        async () => {
          token = await models.LaunchpadToken.findOne({
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
        LPBondingCurveAbi,
        contractAddresses.lpBondingCurve,
      );

      await cp.buyToken(
        lpBondingCurveFactory,
        token!.token_address,
        anvilAccounts[0].address,
        100,
      );

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
