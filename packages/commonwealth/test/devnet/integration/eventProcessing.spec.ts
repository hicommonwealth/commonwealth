import {
  commonProtocol as cp,
  launchpadFactoryAbi,
  lpBondingCurveAbi,
} from '@hicommonwealth/evm-protocols';
import { models } from '@hicommonwealth/model';
import { TokenInstance } from '@hicommonwealth/model/src/models/token';
import { describe, expect, test, vi } from 'vitest';
import { Contract } from 'web3';
import { AbiItem } from 'web3-utils';
import { setupCommonwealthE2E } from './integrationUtils/mainSetup';

describe('End to end event tests', () => {
  test(
    'Token trade happy path',
    async () => {
      const { web3, mineBlocks, anvilAccounts } = await setupCommonwealthE2E();

      const launchpadFactory = new web3.eth.Contract(
        launchpadFactoryAbi as AbiItem[],
        '0x7a2088a1bfc9d81c55368ae168c2c02570cb814f',
      ) as unknown as Contract<typeof launchpadFactoryAbi>;

      await cp.launchToken(
        launchpadFactory,
        'testToken',
        'test',
        [], // 9181 parameters
        // should include at community treasury at [0] and contest creation util at [1] curr tbd
        [],
        web3.utils.toWei(1e9, 'ether'), // Default 1B tokens
        anvilAccounts[0].address,
        830000,
        '0x84ea74d481ee0a5332c457a4d796187f6ba67feb',
      );

      await mineBlocks(1);

      let token: TokenInstance;
      await vi.waitFor(
        async () => {
          token = await models.Token.findOne({
            where: { name: 'testToken' },
          });
          expect(token).toBeTruthy();
        },
        {
          timeout: 10000,
          interval: 500,
        },
      );

      const lpBondingCurveFactory = new web3.eth.Contract(
        lpBondingCurveAbi as AbiItem[],
        '0xdc17c27ae8be831af07cc38c02930007060020f4',
      ) as unknown as Contract<typeof lpBondingCurveAbi>;

      await cp.buyToken(
        lpBondingCurveFactory,
        token.token_address,
        anvilAccounts[0].address,
        1,
      );

      await mineBlocks(1);

      await vi.waitFor(
        async () => {
          const launchpadTrade = await models.LaunchpadTrade.findOne({
            where: { token_address: token.token_address, is_buy: true },
          });
          expect(launchpadTrade).toBeTruthy();
        },
        {
          timeout: 10000,
          interval: 500,
        },
      );
    },
    { timeout: 1000000 },
  );
});
