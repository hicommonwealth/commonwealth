import {assert, expect, use as chaiUse} from 'chai';
import { BalanceType } from 'common-common/src/types';
import Web3 from 'web3';
import chaiAsPromised from 'chai-as-promised'

import type { IChainNode } from '../src/types';
import { BalanceProvider } from '../src/types';


chaiUse(chaiAsPromised);

class MockEthTokenBalanceProvider extends BalanceProvider<{
  testBalance: string;
}> {
  public readonly name = 'test-eth-token';
  public readonly opts = { testBalance: 'string' };
  public readonly validBases = [BalanceType.Ethereum];
  public async getBalance(
    _node: IChainNode,
    address: string,
    opts: { testBalance: string }
  ): Promise<string> {
    const { testBalance } = opts;
    if (Web3.utils.isAddress(address)) {
      return testBalance;
    } else {
      throw new Error('Invalid address!');
    }
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
  ];
}

describe('Eth Token BP unit tests', () => {
  it('ethToken balance provider should return balance', async () => {
    const ethTokenBp: MockEthTokenBalanceProvider =
      new MockEthTokenBalanceProvider();
    const balance = await ethTokenBp.getBalance(
      await mockNodesProvider()[0],
      '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      {
        testBalance: '1',
      }
    );

    assert.equal(balance, '1');
  });

  it('ethToken balance provider should return error if invalid address', async () => {
    const ethTokenBp: MockEthTokenBalanceProvider =
      new MockEthTokenBalanceProvider();
    expect(
      ethTokenBp.getBalance(await mockNodesProvider()[0], 'abcd', {
        testBalance: '12345678912345678910',
      })
    ).to.be.rejectedWith(new Error('Invalid address!'));
  });
});
