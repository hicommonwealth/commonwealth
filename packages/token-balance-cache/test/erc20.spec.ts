import { assert, expect, use as chaiUse } from 'chai';
import { BalanceType } from 'common-common/src/types';
import { BigNumber, BigNumberish, CallOverrides } from 'ethers';
import chaiAsPromised from 'chai-as-promised';
import Erc20BalanceProvider from '../src/providers/erc20';
import type { IChainNode } from '../src/types';

chaiUse(chaiAsPromised);

type EthBPOpts = {
  tokenAddress?: string;
  contractType?: string;
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

class MockErc20BalanceProvider extends Erc20BalanceProvider {
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

describe('ERC20 BP unit tests', () => {
  it('erc20 balance provider should return balance', async () => {
    const erc20Bp: MockErc20BalanceProvider = new MockErc20BalanceProvider();
    const balance = await erc20Bp.getBalance(
      await mockNodesProvider()[0],
      '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      {
        tokenAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        contractType: 'erc20',
      }
    );

    assert.equal(balance, '12345678912345678910');
  });

  it('erc20 balance provider should return error if wrong contract type', async () => {
    const erc20Bp: MockErc20BalanceProvider = new MockErc20BalanceProvider();

    return expect(
      erc20Bp.getBalance(
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
