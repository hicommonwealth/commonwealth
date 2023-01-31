import { assert, expect } from 'chai';
import { BalanceType } from 'common-common/src/types';
import Web3 from 'web3';

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

class MockEthTokenBalanceProvider extends BalanceProvider<{
  testBalance: string;
}> {
  public readonly name = 'test-eth-token';
  public readonly opts = { testBalance: 'string' };
  public readonly validBases = [BalanceType.Ethereum];
  public async getBalance(
    _node: IChainNode,
    address: string,
    opts: { testBalance: string; }
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

describe('BP unit tests', () => {
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
    ).to.be.rejectedWith(new Error('Property does not exist in model schema.'));
  });

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

  it('erc120 balance provider should return error if wrong contract type', async () => {
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
    ).to.be.rejectedWith(new Error('Property does not exist in model schema.'));
  });

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
    ).to.be.rejectedWith(new Error('Property does not exist in model schema.'));
  });

  it('ethToken balance provider should return balance', async () => {
    const ethTokenBp: MockEthTokenBalanceProvider = new MockEthTokenBalanceProvider();
    const balance = await ethTokenBp.getBalance(
      await mockNodesProvider()[0],
      '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      {
        testBalance: '1',
      }
    );

    assert.equal(balance, '1');
  });
});
