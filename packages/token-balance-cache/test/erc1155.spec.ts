import { assert, expect, use as chaiUse } from 'chai';
import { BalanceType } from 'common-common/src/types';
import { BigNumber, BigNumberish, CallOverrides } from 'ethers';
import chaiAsPromised from 'chai-as-promised';
import Erc1155BalanceProvider from '../src/providers/ethToken';

chaiUse(chaiAsPromised);

import type { IChainNode } from '../src/types';

type EthBPOpts = {
  tokenAddress?: string;
  contractType?: string;
  tokenId?: string;
};

class MockProvider {
  public async balanceOf(
    account: string,
    id: BigNumberish,
    overrides?: CallOverrides
  ): Promise<BigNumber> {
    return BigNumber.from('12345678912345678910');
  }

  provider = {
    provider: {
      disconnect: (code: number, reason: string) => {},
    },
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

class MockErc1155BalanceProvider extends Erc1155BalanceProvider {
  public readonly validBases = [BalanceType.Ethereum];
  public async getExternalProvider(
    node: IChainNode,
    opts: EthBPOpts
  ): Promise<any> {
    return new MockProvider();
  }
}

describe('ERC1155 BP unit tests', () => {
  it('erc1155 balance provider should return balance', async () => {
    const erc1155Bp: MockErc1155BalanceProvider =
      new MockErc1155BalanceProvider();
    const balance = await erc1155Bp.getBalance(
      await mockNodesProvider()[0],
      '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      {
        tokenAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        contractType: 'erc1155',
        tokenId: '1',
      }
    );

    assert.equal(balance, '12345678912345678910');
  });

  it('erc1155 balance provider should return error if wrong contract type', async () => {
    const erc1155Bp: MockErc1155BalanceProvider =
      new MockErc1155BalanceProvider();

    return expect(
      erc1155Bp.getBalance(
        await mockNodesProvider()[0],
        '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        {
          tokenAddress: '123',
          contractType: 'abc',
          tokenId: '1',
        }
      )
    ).to.be.rejectedWith('Invalid Contract Type');
  });
});
