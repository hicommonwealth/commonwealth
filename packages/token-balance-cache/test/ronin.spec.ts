/* eslint-disable @typescript-eslint/no-unused-vars */
import { BalanceType } from '@hicommonwealth/core';
import { assert, use as chaiUse, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { BigNumber, BigNumberish, CallOverrides } from 'ethers';
import RoninBalanceProvider from '../src/providers/ronin';
import type { IChainNode } from '../src/types';

chaiUse(chaiAsPromised);

class MockProvider {
  public async balanceOf(
    account: string,
    id: BigNumberish,
    overrides?: CallOverrides,
  ): Promise<BigNumber> {
    return BigNumber.from('1');
  }

  provider = {
    provider: {
      disconnect: (code: number, reason: string) => {},
    },
  };
}

class MockStakingContract {
  methods = {
    getStakingAmount: (address: string) => {
      return {
        call: () => {
          return '1';
        },
      };
    },
  };
}

class MockRoninBalanceProvider extends RoninBalanceProvider {
  public readonly validBases = [BalanceType.Ethereum];
  public async getExternalProvider(node: IChainNode): Promise<any> {
    return [new MockProvider(), new MockStakingContract()];
  }
}

async function mockNodesProvider(): Promise<IChainNode[]> {
  return [
    {
      id: 1,
      url: 'none',
      eth_chain_id: 5555,
      balance_type: BalanceType.Ethereum,
      name: 'Mock Node',
    },
    {
      id: 2,
      url: 'none',
      eth_chain_id: 5555,
      balance_type: BalanceType.Ethereum,
      name: 'Mock Node',
    },
  ];
}

describe('ERC1155 BP unit tests', () => {
  it('ronin balance provider should return balance', async () => {
    const roninBp: MockRoninBalanceProvider = new MockRoninBalanceProvider();
    const balance = await roninBp.getBalance(
      await mockNodesProvider()[0],
      '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
    );

    assert.equal(balance, '2');
  });

  it('ronin balance provider should return error if wrong contract type', async () => {
    const roninBp: MockRoninBalanceProvider = new MockRoninBalanceProvider();

    return expect(
      roninBp.getBalance(await mockNodesProvider()[0], 'abcd'),
    ).to.be.rejectedWith('Invalid address');
  });
});
