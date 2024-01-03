/* eslint-disable @typescript-eslint/no-unused-vars */
import { BalanceType } from '@hicommonwealth/core';
import { assert, use as chaiUse, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import SplTokenBalanceProvider from '../src/providers/splToken';

chaiUse(chaiAsPromised);

import { PublicKey, TokenAccountsFilter } from '@solana/web3.js';
import type { IChainNode } from '../src/types';

class MockProvider {
  public async getParsedTokenAccountsByOwner(
    ownerAddress: PublicKey,
    filter: TokenAccountsFilter,
  ): Promise<any> {
    return {
      value: [
        {
          account: {
            data: {
              parsed: {
                info: {
                  tokenAmount: {
                    amount: '12345678912345678910',
                  },
                },
              },
            },
          },
        },
      ],
    };
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

class MockSplTokenBalanceProvider extends SplTokenBalanceProvider {
  public readonly validBases = [BalanceType.Ethereum];
  public async getExternalProvider(node: IChainNode): Promise<any> {
    return new MockProvider();
  }
}

describe('SplBp BP unit tests', () => {
  it('splBp balance provider should return balance', async () => {
    const splBp: MockSplTokenBalanceProvider =
      new MockSplTokenBalanceProvider();
    const balance = await splBp.getBalance(
      await mockNodesProvider()[0],
      'xzaSRbYFi2x4rQFtcVzbjUwJ7t7qRsfoFGTJTaFMJ3e',
      {
        tokenAddress: 'xzaSRbYFi2x4rQFtcVzbjUwJ7t7qRsfoFGTJTaFMJ3e',
      },
    );

    assert.equal(balance, '12345678912345678910');
  });

  it('splBp balance provider should return error if wrong contract type', async () => {
    const splBp: MockSplTokenBalanceProvider =
      new MockSplTokenBalanceProvider();

    return expect(
      splBp.getBalance(
        await mockNodesProvider()[0],
        'xzaSRbYFi2x4rQFtcVzbjUwJ7t7qRsfoFGTJTaFMJ3e',
        {
          tokenAddress: '123',
        },
      ),
    ).to.be.rejectedWith('Invalid public key input');
  });
});
