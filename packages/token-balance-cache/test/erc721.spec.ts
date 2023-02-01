import { assert, expect, use as chaiUse } from 'chai';
import { BalanceType } from 'common-common/src/types';
import Web3 from 'web3';
import chaiAsPromised from 'chai-as-promised';

chaiUse(chaiAsPromised);

import type { IChainNode } from '../src/types';
import { BalanceProvider } from '../src/types';

class MockErc721BalanceProvider extends BalanceProvider<{
  testBalance: string;
}> {
  public readonly name = 'test-erc721';
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

describe('ERC721 BP unit tests', () => {
  it('erc721 balance provider should return balance', async () => {
    const erc721Bp: MockErc721BalanceProvider = new MockErc721BalanceProvider();
    const balance = await erc721Bp.getBalance(
      await mockNodesProvider()[0],
      '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      {
        testBalance: '1',
        contractType: 'test-erc721',
      }
    );

    assert.equal(balance, '1');
  });

  it('erc721 balance provider should return error if wrong contract type', async () => {
    const erc721Bp: MockErc721BalanceProvider = new MockErc721BalanceProvider();
    expect(
      erc721Bp.getBalance(
        await mockNodesProvider()[0],
        '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        {
          testBalance: '12345678912345678910',
          contractType: 'test-fail',
        }
      )
    ).to.be.rejectedWith('Invalid Contract Type');
  });
});
