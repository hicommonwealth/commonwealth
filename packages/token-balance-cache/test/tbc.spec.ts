import { BalanceType } from '@hicommonwealth/core';
import { assert } from 'chai';
import Web3 from 'web3';

import { TokenBalanceCache } from '../src/tbc';
import type { IChainNode } from '../src/types';
import { BalanceProvider } from '../src/types';

class MockErc1155BalanceProvider extends BalanceProvider<{
  testBalance: string;
}> {
  public readonly name = 'test-provider';
  public readonly opts = {
    testBalance: 'string',
    testTokenId: 'string?',
    contractType: 'string?',
  };
  public readonly validBases = [BalanceType.Ethereum];
  public async getBalance(
    _node: IChainNode,
    address: string,
    opts: { testBalance: string; testTokenId?: string; contractType?: string },
  ): Promise<string> {
    const { testBalance, testTokenId, contractType } = opts;
    if (Web3.utils.isAddress(address)) {
      if (contractType === 'erc1155' && !testTokenId) {
        throw new Error('Token Id Required For ERC-1155');
      }
      return testBalance;
    } else {
      throw new Error('Invalid address!');
    }
  }
}

class MockBalanceProvider extends BalanceProvider<{ testBalance: string }> {
  public readonly name = 'test-provider';
  public readonly opts = { testBalance: 'string' };
  public readonly validBases = [BalanceType.Ethereum];
  public async getBalance(
    _node: IChainNode,
    address: string,
    opts: { testBalance: string },
  ): Promise<string> {
    if (Web3.utils.isAddress(address)) {
      return opts.testBalance;
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

describe('TBC unit tests', () => {
  it('should return chain nodes', async () => {
    const tbc = new TokenBalanceCache(
      0,
      0,
      [new MockBalanceProvider()],
      mockNodesProvider,
    );
    await tbc.start();
    const nodes = await tbc.getChainNodes();
    assert.sameDeepMembers(nodes, [
      {
        id: 1,
        name: 'Mock Node',
        base: BalanceType.Ethereum,
        description: undefined,
        prefix: undefined,
      },
    ]);
    tbc.close();
  });

  it('should return balance providers', async () => {
    const tbc = new TokenBalanceCache(
      0,
      0,
      [new MockBalanceProvider()],
      mockNodesProvider,
    );
    await tbc.start();
    const bps = await tbc.getBalanceProviders(1);
    assert.sameDeepMembers(bps, [
      {
        bp: 'test-provider',
        opts: { testBalance: 'string' },
      },
    ]);
    tbc.close();
  });

  it('should return erc1155 balance providers', async () => {
    const tbc = new TokenBalanceCache(
      0,
      0,
      [new MockErc1155BalanceProvider()],
      mockNodesProvider,
    );
    await tbc.start();
    const bps = await tbc.getBalanceProviders(1);
    assert.sameDeepMembers(bps, [
      {
        bp: 'test-provider',
        opts: {
          testBalance: 'string',
          testTokenId: 'string?',
          contractType: 'string?',
        },
      },
    ]);
    tbc.close();
  });

  it('should throw error when no node exists for id', async () => {
    const tbc = new TokenBalanceCache(
      0,
      0,
      [new MockBalanceProvider()],
      mockNodesProvider,
    );
    await tbc.start();
    try {
      await tbc.getBalanceProviders(2);
    } catch (e) {
      // we expect error
      return;
    }

    // if no error, fail test
    assert.fail();
  });

  it('should return token balances', async () => {
    const tbc = new TokenBalanceCache(
      0,
      0,
      [new MockBalanceProvider()],
      mockNodesProvider,
    );
    await tbc.start();
    const addresses = ['abcd', '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'];
    const testBalance = '123456789123456789';
    const tokenBalances = await tbc.getBalancesForAddresses(
      1,
      addresses,
      'test-provider',
      { testBalance },
    );
    assert.deepEqual(tokenBalances, {
      balances: {
        [addresses[1]]: testBalance,
      },
      errors: {
        [addresses[0]]: 'Invalid address!',
      },
    });
    tbc.close();
  });

  it('should return token balances for erc1155 token id', async () => {
    const tbc = new TokenBalanceCache(
      0,
      0,
      [new MockErc1155BalanceProvider()],
      mockNodesProvider,
    );
    await tbc.start();
    const addresses = ['abcd', '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'];
    const testBalance = '12345678912345678910';
    const testTokenId = '123456789';
    const tokenBalances = await tbc.getBalancesForAddresses(
      1,
      addresses,
      'test-provider',
      { testBalance, testTokenId },
    );
    assert.deepEqual(tokenBalances, {
      balances: {
        [addresses[1]]: testBalance,
      },
      errors: {
        [addresses[0]]: 'Invalid address!',
      },
    });
    tbc.close();
  });
});
