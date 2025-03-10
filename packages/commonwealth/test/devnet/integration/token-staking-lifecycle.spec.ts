import { commonProtocol, veBridgeAbi } from '@hicommonwealth/evm-protocols';
import { models } from '@hicommonwealth/model';
import { describe, expect, it, vi } from 'vitest';
import { setupCommonwealthE2E } from './integrationUtils/mainSetup';

describe.skip('Token staking lifecycle', () => {
  it('should lock tokens', async () => {
    const { web3, mineBlocks, anvilAccounts, contractAddresses } =
      await setupCommonwealthE2E();

    const contract = new web3.eth.Contract(
      veBridgeAbi,
      contractAddresses.veBridge,
    );

    await commonProtocol.lockTokens(
      contract,
      anvilAccounts[0].address,
      '10',
      '1000',
      false,
    );

    // await cp.launchToken(
    //   launchpadFactory,
    //   'testToken',
    //   'test',
    //   [],
    //   [],
    //   web3.utils.toWei(1e9, 'ether'),
    //   anvilAccounts[0].address,
    //   830000,
    //   contractAddresses.tokenCommunityManager,
    // );

    await mineBlocks(1);

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
  });
});
