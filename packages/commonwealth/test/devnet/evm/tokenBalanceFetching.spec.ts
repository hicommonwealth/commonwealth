import { RedisCache } from '@hicommonwealth/adapters';
import { cache, dispose } from '@hicommonwealth/core';
import {
  ChainTesting,
  ERC1155,
  ERC721,
  getAnvil,
} from '@hicommonwealth/evm-testing';
import {
  tester,
  tokenBalanceCache,
  type Balances,
  type DB,
} from '@hicommonwealth/model';
import {
  BalanceSourceType,
  BalanceType,
  DISCORD_BOT_ADDRESS,
  delay,
} from '@hicommonwealth/shared';
import { Anvil } from '@viem/anvil';
import BN from 'bn.js';

import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import Web3 from 'web3';
import { toWei } from 'web3-utils';

function generateEVMAddresses(count: number): string[] {
  const web3 = new Web3();
  const addresses: string[] = [];

  for (let i = 0; i < count; i++) {
    const account = web3.eth.accounts.create();
    addresses.push(account.address);
  }

  return addresses;
}

function checkZeroBalances(balances: Balances, skipAddress: string[]) {
  for (const [address, balance] of Object.entries(balances)) {
    if (!skipAddress.includes(address)) {
      expect(balance).to.equal('0');
    }
  }
}

describe('Token Balance Cache EVM Tests', { timeout: 160_000 }, function () {
  let models: DB;
  let anvil: Anvil;

  const sdk = new ChainTesting();

  const addressOne = '0xCEB3C3D4B78d5d10bd18930DC0757ddB588A862a';
  const addressTwo = '0xD54f2E2173D0a5eA8e0862Aed18b270aFF08389e';

  const bulkAddresses = generateEVMAddresses(20);
  bulkAddresses.splice(4, 0, addressOne);
  bulkAddresses.splice(5, 0, addressTwo);
  const totalBulkAddresses = 22;

  // ganache chain id
  const ethChainId = 1337;

  async function resetChainNode(eth_chain_id: number) {
    const ganacheChainNode = await models.ChainNode.findOne({
      where: {
        url: 'http://localhost:8545',
      },
    });

    if (ganacheChainNode) {
      await models.ChainNode.update(
        {
          eth_chain_id: eth_chain_id,
          balance_type: BalanceType.Ethereum,
          name: 'Local EVM Chain',
        },
        {
          where: {
            url: 'http://localhost:8545',
          },
        },
      );
    } else {
      await models.ChainNode.create({
        url: 'http://localhost:8545',
        eth_chain_id: eth_chain_id,
        balance_type: BalanceType.Ethereum,
        name: 'Local EVM Chain',
      });
    }
  }

  beforeAll(async () => {
    anvil = await getAnvil(1);
    models = await tester.seedDb(import.meta);
    cache({
      adapter: new RedisCache('redis://localhost:6379'),
    });
    await cache().ready();
  });

  afterAll(async () => {
    await anvil.stop();
    await dispose()();
  });

  describe('ERC20', () => {
    const chainLinkAddress = '0x514910771AF9Ca656af840dff83E8264EcF986CA';
    let originalAddressOneBalance: string, originalAddressTwoBalance: string;
    let finalAddressOneBalance: string, finalAddressTwoBalance: string;
    const transferAmount = '76';

    beforeAll(async () => {
      const erc20 = sdk.getErc20Contract(chainLinkAddress);
      await resetChainNode(ethChainId);
      originalAddressOneBalance = await erc20.getBalance(addressOne);
      originalAddressTwoBalance = await erc20.getBalance(addressTwo);
      await erc20.transfer(addressOne, transferAmount);
      await erc20.transfer(addressTwo, transferAmount);
      const transferAmountBN = new BN(toWei(transferAmount, 'ether'));
      finalAddressOneBalance = new BN(originalAddressOneBalance)
        .add(transferAmountBN)
        .toString(10);
      finalAddressTwoBalance = new BN(originalAddressTwoBalance)
        .add(transferAmountBN)
        .toString(10);
    });

    describe('Single address', () => {
      test('should not fail if no address is given', async () => {
        const balance = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ERC20,
          addresses: [],
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: chainLinkAddress,
          },
          cacheRefresh: true,
        });

        expect(Object.keys(balance).length).to.equal(0);
      });

      test('should not fail if a single invalid address is given', async () => {
        const balance = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ERC20,
          addresses: [DISCORD_BOT_ADDRESS],
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: chainLinkAddress,
          },
          cacheRefresh: true,
        });

        expect(Object.keys(balance).length).to.equal(0);
      });

      test('should return a single balance', async () => {
        const balance = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ERC20,
          addresses: [addressOne],
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: chainLinkAddress,
          },
          cacheRefresh: true,
        });

        expect(Object.keys(balance).length).to.equal(1);
        expect(balance[addressOne]).to.equal(finalAddressOneBalance);
      });
    });

    describe('on-chain batching', () => {
      test('should return many balances', async () => {
        const balances = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ERC20,
          addresses: [addressOne, addressTwo],
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: chainLinkAddress,
          },
          cacheRefresh: true,
        });

        expect(Object.keys(balances).length).to.equal(2);
        expect(balances[addressOne]).to.equal(finalAddressOneBalance);
        expect(balances[addressTwo]).to.equal(finalAddressTwoBalance);
      });

      test('should not throw if a single address fails', async () => {
        const balances = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ERC20,
          addresses: [addressOne, DISCORD_BOT_ADDRESS, addressTwo],
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: chainLinkAddress,
          },
          cacheRefresh: true,
        });

        expect(Object.keys(balances).length).to.equal(2);
        expect(balances[addressOne]).to.equal(finalAddressOneBalance);
        expect(balances[addressTwo]).to.equal(finalAddressTwoBalance);
      });

      test('should correctly batch balance requests', async () => {
        const balances = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ERC20,
          addresses: bulkAddresses,
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: chainLinkAddress,
          },
          cacheRefresh: true,
          batchSize: 5,
        });

        expect(Object.keys(balances).length).to.equal(totalBulkAddresses);
        expect(balances[addressOne]).to.equal(finalAddressOneBalance);
        expect(balances[addressTwo]).to.equal(finalAddressTwoBalance);
        checkZeroBalances(balances, [addressOne, addressTwo]);
      });
    });

    describe('off-chain batching', () => {
      const newEthChainId = 1864339501;
      beforeAll(async () => {
        // set eth_chain_id to some random value that is NOT
        // defined in mapNodeToBalanceFetcherContract. This
        // forces an off-chain batching strategy
        await models.ChainNode.update(
          { eth_chain_id: newEthChainId },
          {
            where: {
              eth_chain_id: ethChainId,
            },
          },
        );
      });

      test('should return many balances', async () => {
        const balances = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ERC20,
          addresses: [addressOne, addressTwo],
          sourceOptions: {
            evmChainId: newEthChainId,
            contractAddress: chainLinkAddress,
          },
          cacheRefresh: true,
        });

        expect(Object.keys(balances).length).to.equal(2);
        expect(balances[addressOne]).to.equal(finalAddressOneBalance);
        expect(balances[addressTwo]).to.equal(finalAddressTwoBalance);
      });

      test('should not throw if a single address fails', async () => {
        const balances = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ERC20,
          addresses: [addressOne, DISCORD_BOT_ADDRESS, addressTwo],
          sourceOptions: {
            evmChainId: newEthChainId,
            contractAddress: chainLinkAddress,
          },
          cacheRefresh: true,
        });

        expect(Object.keys(balances).length).to.equal(2);
        expect(balances[addressOne]).to.equal(finalAddressOneBalance);
        expect(balances[addressTwo]).to.equal(finalAddressTwoBalance);
        checkZeroBalances(balances, [addressOne, addressTwo]);
      });

      test('should correctly batch balance requests', async () => {
        const balances = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ERC20,
          addresses: bulkAddresses,
          sourceOptions: {
            evmChainId: newEthChainId,
            contractAddress: chainLinkAddress,
          },
          cacheRefresh: true,
          batchSize: 5,
        });

        expect(Object.keys(balances).length).to.equal(totalBulkAddresses);
        expect(balances[addressOne]).to.equal(finalAddressOneBalance);
        expect(balances[addressTwo]).to.equal(finalAddressTwoBalance);
      });
    });
  });

  describe('Eth Native', () => {
    let originalAddressOneBalance: string, originalAddressTwoBalance: string;
    let finalAddressOneBalance: string, finalAddressTwoBalance: string;
    const transferAmount = '3';

    beforeAll(async () => {
      await resetChainNode(ethChainId);
      const web3 = new Web3(
        new Web3.providers.HttpProvider('http://localhost:8545'),
      );
      originalAddressOneBalance = (
        await web3.eth.getBalance(addressOne)
      ).toString();
      originalAddressTwoBalance = (
        await web3.eth.getBalance(addressTwo)
      ).toString();
      await sdk.getETH(addressOne, transferAmount);
      await sdk.getETH(addressTwo, transferAmount);
      const transferAmountBN = new BN(toWei(transferAmount, 'ether'));
      finalAddressOneBalance = new BN(originalAddressOneBalance)
        .add(transferAmountBN)
        .toString(10);
      finalAddressTwoBalance = new BN(originalAddressTwoBalance)
        .add(transferAmountBN)
        .toString(10);
    });

    describe('Single address', () => {
      test('should not fail if no address is given', async () => {
        const balance = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ETHNative,
          addresses: [],
          sourceOptions: {
            evmChainId: ethChainId,
          },
          cacheRefresh: true,
        });
        expect(Object.keys(balance).length).to.equal(0);
      });

      test('should not fail if a single invalid address is given', async () => {
        const balance = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ETHNative,
          addresses: [DISCORD_BOT_ADDRESS],
          sourceOptions: {
            evmChainId: ethChainId,
          },
          cacheRefresh: true,
        });

        expect(Object.keys(balance).length).to.equal(0);
      });

      test('should return a single balance', async () => {
        const balance = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ETHNative,
          addresses: [addressOne],
          sourceOptions: {
            evmChainId: ethChainId,
          },
          cacheRefresh: true,
        });

        expect(Object.keys(balance).length).to.equal(1);
        expect(balance[addressOne]).to.equal(finalAddressOneBalance);
      });
    });

    describe('on-chain batching', () => {
      test('should return many balances', async () => {
        const balances = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ETHNative,
          addresses: [addressOne, addressTwo],
          sourceOptions: {
            evmChainId: ethChainId,
          },
          cacheRefresh: true,
        });

        expect(Object.keys(balances).length).to.equal(2);
        expect(balances[addressOne]).to.equal(finalAddressOneBalance);
        expect(balances[addressTwo]).to.equal(finalAddressTwoBalance);
      });

      test('should not throw if a single address fails', async () => {
        const balances = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ETHNative,
          addresses: [addressOne, DISCORD_BOT_ADDRESS, addressTwo],
          sourceOptions: {
            evmChainId: ethChainId,
          },
          cacheRefresh: true,
        });

        expect(Object.keys(balances).length).to.equal(2);
        expect(balances[addressOne]).to.equal(finalAddressOneBalance);
        expect(balances[addressTwo]).to.equal(finalAddressTwoBalance);
      });

      test('should correctly batch balance requests', async () => {
        const balances = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ETHNative,
          addresses: bulkAddresses,
          sourceOptions: {
            evmChainId: ethChainId,
          },
          cacheRefresh: true,
          batchSize: 5,
        });

        expect(Object.keys(balances).length).to.equal(totalBulkAddresses);
        expect(balances[addressOne]).to.equal(finalAddressOneBalance);
        expect(balances[addressTwo]).to.equal(finalAddressTwoBalance);
        checkZeroBalances(balances, [addressOne, addressTwo]);
      });
    });

    describe('off-chain batching', () => {
      const newEthChainId = 1864339501;
      beforeAll(async () => {
        // set eth_chain_id to some random value that is NOT
        // defined in mapNodeToBalanceFetcherContract. This
        // forces an off-chain batching strategy
        await models.ChainNode.update(
          { eth_chain_id: newEthChainId },
          {
            where: {
              eth_chain_id: ethChainId,
            },
          },
        );
      });

      test('should return many balances', async () => {
        const balances = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ETHNative,
          addresses: [addressOne, addressTwo],
          sourceOptions: {
            evmChainId: newEthChainId,
          },
          cacheRefresh: true,
        });

        expect(Object.keys(balances).length).to.equal(2);
        expect(balances[addressOne]).to.equal(finalAddressOneBalance);
        expect(balances[addressTwo]).to.equal(finalAddressTwoBalance);
      });

      test('should not throw if a single address fails', async () => {
        const balances = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ETHNative,
          addresses: [addressOne, DISCORD_BOT_ADDRESS, addressTwo],
          sourceOptions: {
            evmChainId: newEthChainId,
          },
          cacheRefresh: true,
        });

        expect(Object.keys(balances).length).to.equal(2);
        expect(balances[addressOne]).to.equal(finalAddressOneBalance);
        expect(balances[addressTwo]).to.equal(finalAddressTwoBalance);
      });

      test('should correctly batch balance requests', async () => {
        const balances = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ETHNative,
          addresses: bulkAddresses,
          sourceOptions: {
            evmChainId: newEthChainId,
          },
          cacheRefresh: true,
          batchSize: 5,
        });

        expect(Object.keys(balances).length).to.equal(totalBulkAddresses);
        expect(balances[addressOne]).to.equal(finalAddressOneBalance);
        expect(balances[addressTwo]).to.equal(finalAddressTwoBalance);
        checkZeroBalances(balances, [addressOne, addressTwo]);
      });
    });
  });

  describe('ERC721', () => {
    let nft: ERC721;
    let addressOne721: string, addressTwo721: string;
    beforeAll(async () => {
      await resetChainNode(ethChainId);
      nft = await sdk.deployNFT();
      await nft.mint('1', 1);
      await nft.mint('2', 2);
      await nft.mint('3', 2);
      const addresses = await sdk.getAccounts();
      addressOne721 = addresses[1];
      addressTwo721 = addresses[2];
    });

    describe('Single address', () => {
      test('should not fail if no address is given', async () => {
        const balance = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ERC721,
          addresses: [],
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: nft.address,
          },
          cacheRefresh: true,
        });

        expect(Object.keys(balance).length).to.equal(0);
      });

      test('should not fail if a single invalid address is given', async () => {
        const balance = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ERC721,
          addresses: [DISCORD_BOT_ADDRESS],
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: nft.address,
          },
          cacheRefresh: true,
        });

        expect(Object.keys(balance).length).to.equal(0);
      });

      test('should return a single balance', async () => {
        const balance = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ERC721,
          addresses: [addressOne721],
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: nft.address,
          },
          cacheRefresh: true,
        });

        expect(Object.keys(balance).length).to.equal(1);
        expect(balance[addressOne721]).to.equal('1');
      });
    });

    describe('off-chain batching', () => {
      test('should return many balances', async () => {
        const balances = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ERC721,
          addresses: [addressOne721, addressTwo721],
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: nft.address,
          },
          cacheRefresh: true,
        });

        expect(Object.keys(balances).length).to.equal(2);
        expect(balances[addressOne721]).to.equal('1');
        expect(balances[addressTwo721]).to.equal('2');
      });

      test('should not throw if a single address fails', async () => {
        const balances = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ERC721,
          addresses: [addressOne721, DISCORD_BOT_ADDRESS, addressTwo721],
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: nft.address,
          },
          cacheRefresh: true,
        });

        expect(Object.keys(balances).length).to.equal(2);
        expect(balances[addressOne721]).to.equal('1');
        expect(balances[addressTwo721]).to.equal('2');
      });

      test('should correctly batch balance requests', async () => {
        const bulkAddresses721 = generateEVMAddresses(20);
        bulkAddresses721.splice(4, 0, addressOne721);
        bulkAddresses721.splice(5, 0, addressTwo721);

        const balances = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ERC721,
          addresses: bulkAddresses721,
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: nft.address,
          },
          cacheRefresh: true,
          batchSize: 22,
        });

        expect(Object.keys(balances).length).to.equal(totalBulkAddresses);
        expect(balances[addressOne721]).to.equal('1');
        expect(balances[addressTwo721]).to.equal('2');
        checkZeroBalances(balances, [addressOne721, addressTwo721]);
      });
    });
  });

  describe('ERC1155', () => {
    let erc1155: ERC1155;
    beforeAll(async () => {
      await resetChainNode(ethChainId);
      erc1155 = await sdk.deployErc1155();
      await erc1155.mint('1', 10, addressOne);
      await erc1155.mint('1', 20, addressTwo);
      await erc1155.mint('2', 1, addressOne);
      await erc1155.mint('3', 1, addressTwo);
    });

    describe('Single address', () => {
      test('should not fail if no address is given', async () => {
        const balance = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ERC1155,
          addresses: [],
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: erc1155.address,
            tokenId: 1,
          },
          cacheRefresh: true,
        });

        expect(Object.keys(balance).length).to.equal(0);
      });

      test('should not fail if a single invalid address is given', async () => {
        const balance = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ERC1155,
          addresses: [DISCORD_BOT_ADDRESS],
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: erc1155.address,
            tokenId: 1,
          },
          cacheRefresh: true,
        });

        expect(Object.keys(balance).length).to.equal(0);
      });

      test('should return a single balance', async () => {
        const balance = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ERC1155,
          addresses: [addressOne],
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: erc1155.address,
            tokenId: 1,
          },
          cacheRefresh: true,
        });

        expect(Object.keys(balance).length).to.equal(1);
        expect(balance[addressOne]).to.equal('10');

        const balanceTwo = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ERC1155,
          addresses: [addressTwo],
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: erc1155.address,
            tokenId: 1,
          },
          cacheRefresh: true,
        });

        expect(Object.keys(balanceTwo).length).to.equal(1);
        expect(balanceTwo[addressTwo]).to.equal('20');
      });
    });

    describe('on-chain batching', () => {
      test('should return many balances', async () => {
        const balances = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ERC1155,
          addresses: [addressOne, addressTwo],
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: erc1155.address,
            tokenId: 1,
          },
          cacheRefresh: true,
        });

        expect(Object.keys(balances).length).to.equal(2);
        expect(balances[addressOne]).to.equal('10');
        expect(balances[addressTwo]).to.equal('20');
      });

      test('should not throw if a single address fails', async () => {
        const balances = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ERC1155,
          addresses: [addressOne, DISCORD_BOT_ADDRESS, addressTwo],
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: erc1155.address,
            tokenId: 1,
          },
          cacheRefresh: true,
        });

        expect(Object.keys(balances).length).to.equal(2);
        expect(balances[addressOne]).to.equal('10');
        expect(balances[addressTwo]).to.equal('20');
      });

      test('should correctly batch balance requests', async () => {
        const balances = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ERC1155,
          addresses: bulkAddresses,
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: erc1155.address,
            tokenId: 1,
          },
          cacheRefresh: true,
          batchSize: 5,
        });

        expect(Object.keys(balances).length).to.equal(totalBulkAddresses);
        expect(balances[addressOne]).to.equal('10');
        expect(balances[addressTwo]).to.equal('20');
        checkZeroBalances(balances, [addressOne, addressTwo]);
      });
    });
  });

  describe('Caching', () => {
    // the TTL of balances in TBC in seconds
    const balanceTTL = 20;
    const chainLinkAddress = '0x514910771AF9Ca656af840dff83E8264EcF986CA';
    const transferAmount = '76';

    beforeAll(async () => {
      await resetChainNode(ethChainId);
      // clear all Redis keys
      await cache().flushAll();
    });

    test('should cache for TTL but not longer', async () => {
      const erc20 = sdk.getErc20Contract(chainLinkAddress);
      const originalAddressOneBalance = await erc20.getBalance(addressOne);

      const balance = await tokenBalanceCache.getBalances(
        {
          balanceSourceType: BalanceSourceType.ERC20,
          addresses: [addressOne],
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: chainLinkAddress,
          },
          cacheRefresh: true,
        },
        balanceTTL,
      );
      expect(Object.keys(balance).length).to.equal(1);
      expect(balance[addressOne]).to.equal(originalAddressOneBalance);

      // this must complete in under balanceTTL time or the test fails
      await erc20.transfer(addressOne, transferAmount);

      const balanceTwo = await tokenBalanceCache.getBalances(
        {
          balanceSourceType: BalanceSourceType.ERC20,
          addresses: [addressOne],
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: chainLinkAddress,
          },
        },
        balanceTTL,
      );
      expect(Object.keys(balanceTwo).length).to.equal(1);
      expect(balanceTwo[addressOne]).to.equal(originalAddressOneBalance);

      await delay(20000);

      const transferAmountBN = new BN(toWei(transferAmount, 'ether'));
      const finalAddressOneBalance = new BN(originalAddressOneBalance)
        .add(transferAmountBN)
        .toString(10);

      const balanceThree = await tokenBalanceCache.getBalances(
        {
          balanceSourceType: BalanceSourceType.ERC20,
          addresses: [addressOne],
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: chainLinkAddress,
          },
        },
        balanceTTL,
      );
      expect(Object.keys(balanceThree).length).to.equal(1);
      expect(balanceThree[addressOne]).to.equal(finalAddressOneBalance);
    });
  });
});
