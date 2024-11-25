import {
  commonProtocol as cp,
  launchpadFactoryAbi,
} from '@hicommonwealth/evm-protocols';
import { models } from '@hicommonwealth/model';
import { describe, expect, test, vi } from 'vitest';
import { Contract } from 'web3';
import { AbiItem } from 'web3-utils';
import { setupCommonwealthE2E } from './integrationUtils/mainSetup';

describe('End to end event tests', () => {
  test(
    'Launch token happy path',
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

      await vi.waitFor(
        async () => {
          const token = await models.Token.findOne({
            where: { name: 'testToken' },
          });
          expect(token).toBeTruthy();
          return token;
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
