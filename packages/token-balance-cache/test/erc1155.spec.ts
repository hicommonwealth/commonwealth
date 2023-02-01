import { assert, expect, use as chaiUse } from 'chai';
import { BalanceType } from 'common-common/src/types';
import Web3 from 'web3';
import chaiAsPromised from 'chai-as-promised'

chaiUse(chaiAsPromised);

import type { IChainNode } from '../src/types';
import { BalanceProvider } from '../src/types';

class MockErc1155BalanceProvider extends BalanceProvider<{
  testBalance: string;
}> {
  public readonly name = 'test-erc1155';
  public readonly opts = {
    testBalance: 'string',
    testTokenId: 'string?',
    contractType: 'string?',
  };
  public readonly validBases = [BalanceType.Ethereum];
  public async getBalance(
    _node: IChainNode,
    address: string,
    opts: { testBalance: string; testTokenId?: string; contractType?: string }
  ): Promise<string> {
    const { testBalance, testTokenId, contractType } = opts;
    if (Web3.utils.isAddress(address)) {
      if (contractType != this.name) {
        throw new Error('Invalid Contract Type');
      }
      if (!testTokenId) {
        throw new Error('Token Id Required For ERC-1155');
      }
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

describe('ERC1155 BP unit tests', () => {
  it('erc1155 balance provider should return balance', async () => {
    const erc1155Bp: MockErc1155BalanceProvider =
      new MockErc1155BalanceProvider();
    const balance = await erc1155Bp.getBalance(
      await mockNodesProvider()[0],
      '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      {
        testBalance: '12345678912345678910',
        testTokenId: '123',
        contractType: 'test-erc1155',
      }
    );

    assert.equal(balance, '12345678912345678910');
  });

  it('erc1155 balance provider should return error if wrong contract type', async () => {
    const erc1155Bp: MockErc1155BalanceProvider =
      new MockErc1155BalanceProvider();
    expect(
      erc1155Bp.getBalance(
        await mockNodesProvider()[0],
        '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        {
          testBalance: '12345678912345678910',
          testTokenId: '123',
          contractType: 'erc20',
        }
      )
    ).to.be.rejectedWith(new Error('Invalid Contract Type'));
  });
});
