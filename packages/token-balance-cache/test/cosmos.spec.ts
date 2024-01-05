/* eslint-disable @typescript-eslint/no-unused-vars */
import { BalanceType } from '@hicommonwealth/core';
import { assert, use as chaiUse, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import CosmosBalanceProvider from '../src/providers/cosmos';
import type { IChainNode } from '../src/types';

chaiUse(chaiAsPromised);

class MockProvider {
  bank = {
    balance: (address: string, denom: string) => {
      return {
        amount: '12345678912345678910',
        denom: 'denom',
      };
    },
  };

  staking = {
    params: () => {
      return {
        params: {
          bondDenom: 'denom',
        },
      };
    },
  };
}

class MockCosmosBalanceProvider extends CosmosBalanceProvider {
  public readonly validBases = [BalanceType.Ethereum];
  public async getExternalProvider(node: IChainNode): Promise<any> {
    return new MockProvider();
  }
}

async function mockNodesProvider(): Promise<IChainNode[]> {
  return [
    {
      id: 1,
      url: 'none',
      eth_chain_id: 5555,
      balance_type: BalanceType.Cosmos,
      name: 'Mock Node',
      bech32: 'cosmos',
    },
    {
      id: 2,
      url: 'none',
      eth_chain_id: 5555,
      balance_type: BalanceType.Ethereum,
      name: 'Mock Node',
    },
  ];
}

describe('Cosmos BP unit tests', () => {
  it('cosmosBp balance provider should return balance', async () => {
    const cosmosBp: MockCosmosBalanceProvider = new MockCosmosBalanceProvider();
    const nodes = await mockNodesProvider();
    const balance = await cosmosBp.getBalance(
      nodes[0],
      'cosmos1tn4hpcgfxxjhs3y06g5je0cg6tn3xqrkh99z7e',
    );

    assert.equal(balance, '12345678912345678910');
  });

  it('cosmosBp balance provider should return error if wrong contract type', async () => {
    const cosmosBp: MockCosmosBalanceProvider = new MockCosmosBalanceProvider();
    const nodes = await mockNodesProvider();
    return expect(
      cosmosBp.getBalance(
        nodes[1],
        'cosmos1tn4hpcgfxxjhs3y06g5je0cg6tn3xqrkh99z7e',
      ),
    ).to.be.rejectedWith('No cosmos prefix found!');
  });
});
