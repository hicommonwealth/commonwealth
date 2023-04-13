import { assert, expect, use as chaiUse } from 'chai';
import { BalanceType } from 'common-common/src/types';
import { IChainNode } from '../src/types';
import {TokenBalanceCache} from '../src/tbc';
import { default as evmBalanceProvider } from '../src/providers/ethToken';
import {ChainTesting} from '../../chain-events/chain-testing/sdk/chainTesting';

async function mockNodesProvider(): Promise<IChainNode[]> {
    return [
      {
        id: 1,
        url: 'http://localhost:8545',
        eth_chain_id: 5555,
        balance_type: BalanceType.Ethereum,
        name: 'eth-token',
      },
    ];
  }
const providers = [new evmBalanceProvider()]
const tbc = new TokenBalanceCache(0, 0, providers, mockNodesProvider);

const testSDK = new ChainTesting("http://localhost:3000");

describe('EVM Token BP unit tests', () => {
    it('should return correct ERC20 balance', async () => {
      await tbc.start();
      let amt = 10;
      const accounts = await testSDK.getAccounts()
      const token = "0x92D6C1e31e14520e676a687F0a93788B716BEff5"
      await testSDK.getErc20(token, accounts[0],amt.toString());
      const balance = await tbc.getBalancesForAddresses(1, [accounts[0]], 'eth-token', {contractType: 'erc20', tokenAddress: token});
      amt *= 1e18;
      assert.equal(balance.balances[accounts[0]], amt.toString());
    });

    it('should return correct ERC721 balance', async () => {
        const accounts = await testSDK.getAccounts()
        const nft = await testSDK.deployNFT()
        await nft.mint('137', 0);
        const token = nft.address;
        const balance = await tbc.getBalancesForAddresses(1, [accounts[0]], 'eth-token', {contractType: 'erc721', tokenAddress: token});
        assert.equal(balance.balances[accounts[0]], '1');
      });
});