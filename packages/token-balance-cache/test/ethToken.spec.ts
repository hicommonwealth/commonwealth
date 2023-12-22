/* eslint-disable @typescript-eslint/no-unused-vars */
import { BalanceType } from '@hicommonwealth/core';
import { assert, use as chaiUse, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { BigNumber, BigNumberish, CallOverrides } from 'ethers';
import EthTokenBalanceProvider from '../src/providers/ethToken';

import type { IChainNode } from '../src/types';

chaiUse(chaiAsPromised);

type EthBPOpts = {
  tokenAddress?: string;
  contractType?: string;
  tokenId?: string;
};

class MockProvider {
  eth = {
    getBalance: (
      account: string,
      id: BigNumberish,
      overrides?: CallOverrides,
    ) => {
      return BigNumber.from('12345678912345678910');
    },
  };

  currentProvider = {
    disconnect: (code: number, reason: string) => {},
  };
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
  ];
}

class MockEthTokenBalanceProvider extends EthTokenBalanceProvider {
  public readonly validBases = [BalanceType.Ethereum];
  public async getExternalProvider(node: IChainNode): Promise<any> {
    return new MockProvider();
  }
}

describe('Eth Token BP unit tests', () => {
  it('ethToken balance provider should return balance', async () => {
    const ethTokenBp: MockEthTokenBalanceProvider =
      new MockEthTokenBalanceProvider();
    const balance = await ethTokenBp.getBalance(
      await mockNodesProvider()[0],
      '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      {},
    );

    assert.equal(balance, '12345678912345678910');
  });

  it('ethToken balance provider should return error if invalid address', async () => {
    const ethTokenBp: MockEthTokenBalanceProvider =
      new MockEthTokenBalanceProvider();
    return expect(
      ethTokenBp.getBalance(await mockNodesProvider()[0], 'abcd', {}),
    ).to.be.rejectedWith('Invalid address');
  });
});
