import { BalanceType } from '@hicommonwealth/core';
import { assert } from 'chai';
import { ChainTesting } from '../../commonwealth/test/util/evm-chain-testing/sdk/chainTesting';
import { default as evmBalanceProvider } from '../src/providers/ethToken';
import { TokenBalanceCache } from '../src/tbc';
import { IChainNode } from '../src/types';

async function mockNodesProvider(): Promise<IChainNode[]> {
  return [
    {
      id: 1,
      url: 'http://127.0.0.1:8545',
      eth_chain_id: 5555,
      balance_type: BalanceType.Ethereum,
      name: 'eth-token',
    },
  ];
}

const providers = [new evmBalanceProvider()];
const tbc = new TokenBalanceCache(0, 0, providers, mockNodesProvider);

const testSDK = new ChainTesting('http://127.0.0.1:3000');

describe('EVM Token BP unit tests', () => {
  it('should return the correct ERC20 balance', async () => {
    await tbc.start();
    let amt = 10;
    const accounts = await testSDK.getAccounts();
    const token = '0x92D6C1e31e14520e676a687F0a93788B716BEff5';
    await testSDK.getErc20(token, accounts[0], amt.toString());
    const balance = await tbc.getBalancesForAddresses(
      1,
      [accounts[0]],
      'eth-token',
      { contractType: 'erc20', tokenAddress: token },
    );
    amt *= 1e18;
    assert.equal(balance.balances[accounts[0]], amt.toString());
  });

  it('should return the correct ERC721 balance', async () => {
    const accounts = await testSDK.getAccounts();
    const nft = await testSDK.deployNFT();
    await nft.mint('137', 0);
    const token = nft.address;
    const balance = await tbc.getBalancesForAddresses(
      1,
      [accounts[0]],
      'eth-token',
      { contractType: 'erc721', tokenAddress: token },
    );
    assert.equal(balance.balances[accounts[0]], '1');
  });
});
