import { assert, expect, use as chaiUse } from 'chai';
import { BalanceType } from 'common-common/src/types';
import Web3 from 'web3';
import chaiAsPromised from 'chai-as-promised'

import type { IChainNode } from '../src/types';
import { BalanceProvider } from '../src/types';


chaiUse(chaiAsPromised);

class MockErc20BalanceProvider extends BalanceProvider<{
  testBalance: string;
}> {
  public readonly name = 'test-erc20';
  public readonly opts = { testBalance: 'string', contractType: 'string?' };
  public readonly validBases = [BalanceType.Ethereum];
  public async getBalance(
    _node: IChainNode,
    address: string,
    opts: { testBalance: string; contractType: string }
  ): Promise<string> {
    const { testBalance, contractType } = opts;
    if (contractType != this.name) {
      throw new Error('Invalid Contract Type');
    }
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

describe('ERC20 BP unit tests', () => {
  it('erc20 balance provider should return balance', async () => {
    const erc20Bp: MockErc20BalanceProvider = new MockErc20BalanceProvider();
    const balance = await erc20Bp.getBalance(
      await mockNodesProvider()[0],
      '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      {
        testBalance: '12345678912345678910',
        contractType: 'test-erc20',
      }
    );

    assert.equal(balance, '12345678912345678910');
  });

  it('erc20 balance provider should return error if wrong contract type', async () => {
    const erc20Bp: MockErc20BalanceProvider = new MockErc20BalanceProvider();
    expect(
      erc20Bp.getBalance(
        await mockNodesProvider()[0],
        '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        {
          testBalance: '12345678912345678910',
          contractType: 'test-fail',
        }
      )
    ).to.be.rejectedWith(new Error('Invalid Contract Type'));
  });
});
