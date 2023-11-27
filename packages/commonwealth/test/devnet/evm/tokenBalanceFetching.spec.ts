import BN from 'bn.js';
import { expect } from 'chai';
import { RedisCache } from 'common-common/src/redisCache';
import { BalanceType } from 'common-common/src/types';
import { toWei } from 'web3-utils';
import models from '../../../server/database';
import { BalanceSourceType } from '../../../server/util/requirementsModule/requirementsTypes';
import { TokenBalanceCache } from '../../../server/util/tokenBalanceCache/tokenBalanceCache';
import { ChainTesting } from '../../util/evm-chain-testing/sdk/chainTesting';

describe('Token Balance Cache EVM Tests', () => {
  let tbc: TokenBalanceCache;
  const addressOne = '0xCEB3C3D4B78d5d10bd18930DC0757ddB588A862a';
  const addressTwo = '0xD54f2E2173D0a5eA8e0862Aed18b270aFF08389e';
  const discobotAddress = '0xdiscordbot';
  const chainLinkAddress = '0x514910771AF9Ca656af840dff83E8264EcF986CA';
  let originalAddressOneBalance: string, originalAddressTwoBalance: string;
  let finalAddressOneBalance: string, finalAddressTwoBalance: string;
  const sdk = new ChainTesting('http://127.0.0.1:3000');
  const ethChainId = 1864339501;
  const transferAmount = '76';

  before(async () => {
    const redisCache = new RedisCache();
    tbc = new TokenBalanceCache(models, redisCache);
    await models.ChainNode.findOrCreate({
      where: {
        url: 'http://localhost:8545',
        eth_chain_id: ethChainId,
        balance_type: BalanceType.Ethereum,
        name: 'Local EVM Chain',
      },
    });
  });

  // TODO: map the custom eth chain id to the on-chain contract to test out on-chain batching
  describe('ERC20', () => {
    before('Transfer balance to addressOne', async () => {
      originalAddressOneBalance = await sdk.getBalance(
        chainLinkAddress,
        addressOne,
      );
      originalAddressTwoBalance = await sdk.getBalance(
        chainLinkAddress,
        addressTwo,
      );
      await sdk.getErc20(chainLinkAddress, addressOne, transferAmount);
      await sdk.getErc20(chainLinkAddress, addressTwo, transferAmount);
      const transferAmountBN = new BN(toWei(transferAmount));
      finalAddressOneBalance = new BN(originalAddressOneBalance)
        .add(transferAmountBN)
        .toString(10);
      finalAddressTwoBalance = new BN(originalAddressTwoBalance)
        .add(transferAmountBN)
        .toString(10);
    });

    it('should not fail if no address is given', async () => {
      const balance = await tbc.getBalances({
        balanceSourceType: BalanceSourceType.ERC20,
        addresses: [],
        sourceOptions: {
          evmChainId: ethChainId,
          contractAddress: chainLinkAddress,
        },
      });

      expect(Object.keys(balance).length).to.equal(0);
    });

    it('should return a single balance', async () => {
      const balance = await tbc.getBalances({
        balanceSourceType: BalanceSourceType.ERC20,
        addresses: [addressOne],
        sourceOptions: {
          evmChainId: ethChainId,
          contractAddress: chainLinkAddress,
        },
      });

      expect(Object.keys(balance).length).to.equal(1);
      expect(balance[addressOne]).to.equal(finalAddressOneBalance);
    });

    it('should return many balances', async () => {
      const balances = await tbc.getBalances({
        balanceSourceType: BalanceSourceType.ERC20,
        addresses: [addressOne, addressTwo],
        sourceOptions: {
          evmChainId: ethChainId,
          contractAddress: chainLinkAddress,
        },
      });

      expect(Object.keys(balances).length).to.equal(2);
      expect(balances[addressOne]).to.equal(finalAddressOneBalance);
      expect(balances[addressTwo]).to.equal(finalAddressTwoBalance);
    });

    it('should not throw if a single address fails', async () => {
      const balances = await tbc.getBalances({
        balanceSourceType: BalanceSourceType.ERC20,
        addresses: [addressOne, discobotAddress, addressTwo],
        sourceOptions: {
          evmChainId: ethChainId,
          contractAddress: chainLinkAddress,
        },
      });

      expect(Object.keys(balances).length).to.equal(2);
      expect(balances[addressOne]).to.equal(finalAddressOneBalance);
      expect(balances[addressTwo]).to.equal(finalAddressTwoBalance);
    });
  });
}).timeout(40000);
