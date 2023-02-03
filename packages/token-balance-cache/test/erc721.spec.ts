import { assert, expect, use as chaiUse } from 'chai';
import { BalanceType } from 'common-common/src/types';
import { BigNumber, BigNumberish, CallOverrides } from 'ethers';
import chaiAsPromised from 'chai-as-promised';
import Erc721BalanceProvider from '../src/providers/erc721';

chaiUse(chaiAsPromised);

import type { IChainNode } from '../src/types';
import { BalanceProvider } from '../src/types';

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
    return BigNumber.from('1');
  }

  provider = {
    provider: {
      disconnect: (code: number, reason: string) => {},
    },
  };
}

class MockErc721BalanceProvider extends Erc721BalanceProvider {
  public readonly validBases = [BalanceType.Ethereum];
  public async getExternalProvider(
    node: IChainNode,
    opts: EthBPOpts
  ): Promise<any> {
    return new MockProvider();
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
        tokenAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        contractType: 'erc721',
      }
    );

    assert.equal(balance, '1');
  });

  it('erc721 balance provider should return error if wrong contract type', async () => {
    const erc721Bp: MockErc721BalanceProvider = new MockErc721BalanceProvider();
    return expect(
      erc721Bp.getBalance(
        await mockNodesProvider()[0],
        '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        {
          tokenAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
          contractType: 'test-fail',
        }
      )
    ).to.be.rejectedWith('Invalid Contract Type');
  });
});
