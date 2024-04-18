import { RedisCache } from '@hicommonwealth/adapters';
import { BalanceSourceType, cache, delay, dispose } from '@hicommonwealth/core';
import {
  tester,
  tokenBalanceCache,
  type Balances,
  type DB,
} from '@hicommonwealth/model';
import { BalanceType } from '@hicommonwealth/shared';
import BN from 'bn.js';
import { expect } from 'chai';
import Web3 from 'web3';
import Web3Utils from 'web3-utils';
import { ChainTesting } from '../../util/evm-chain-testing/sdk/chainTesting';
import { ERC1155 } from '../../util/evm-chain-testing/sdk/erc1155';
import { ERC721 } from '../../util/evm-chain-testing/sdk/nft';

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

describe('Token Balance Cache EVM Tests', function () {
  this.timeout(160000);

  let models: DB;

  const sdk = new ChainTesting('http://127.0.0.1:3000');

  const addressOne = '0xCEB3C3D4B78d5d10bd18930DC0757ddB588A862a';
  const addressTwo = '0xD54f2E2173D0a5eA8e0862Aed18b270aFF08389e';
  const discobotAddress = '0xdiscordbot';

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

  before(async () => {
    models = await tester.seedDb();
    cache(new RedisCache('redis://localhost:6379'));
    await cache().ready();
  });

  after(async () => {
    await dispose()();
  });

  describe('ERC20', () => {
    const chainLinkAddress = '0x514910771AF9Ca656af840dff83E8264EcF986CA';
    let originalAddressOneBalance: string, originalAddressTwoBalance: string;
    let finalAddressOneBalance: string, finalAddressTwoBalance: string;
    const transferAmount = '76';

    before('Transfer balances to addresses', async () => {
      await resetChainNode(ethChainId);
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
      const transferAmountBN = new BN(Web3Utils.toWei(transferAmount));
      finalAddressOneBalance = new BN(originalAddressOneBalance)
        .add(transferAmountBN)
        .toString(10);
      finalAddressTwoBalance = new BN(originalAddressTwoBalance)
        .add(transferAmountBN)
        .toString(10);
    });

    describe('Single address', () => {
      it('should not fail if no address is given', async () => {
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

      it('should not fail if a single invalid address is given', async () => {
        const balance = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ERC20,
          addresses: [discobotAddress],
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: chainLinkAddress,
          },
          cacheRefresh: true,
        });

        expect(Object.keys(balance).length).to.equal(0);
      });

      it('should return a single balance', async () => {
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
      it('should return many balances', async () => {
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

      it('should not throw if a single address fails', async () => {
        const balances = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ERC20,
          addresses: [addressOne, discobotAddress, addressTwo],
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

      it('should correctly batch balance requests', async () => {
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
      before('Update ChainNodes.eth_chain_id', async () => {
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

      it('should return many balances', async () => {
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

      it('should not throw if a single address fails', async () => {
        const balances = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ERC20,
          addresses: [addressOne, discobotAddress, addressTwo],
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

      it('should correctly batch balance requests', async () => {
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

    before('Transfer balances to addresses', async () => {
      await resetChainNode(ethChainId);
      const web3 = new Web3(
        new Web3.providers.HttpProvider('http://localhost:8545'),
      );
      originalAddressOneBalance = await web3.eth.getBalance(addressOne);
      originalAddressTwoBalance = await web3.eth.getBalance(addressTwo);
      await sdk.getETH(addressOne, transferAmount);
      await sdk.getETH(addressTwo, transferAmount);
      const transferAmountBN = new BN(Web3Utils.toWei(transferAmount));
      finalAddressOneBalance = new BN(originalAddressOneBalance)
        .add(transferAmountBN)
        .toString(10);
      finalAddressTwoBalance = new BN(originalAddressTwoBalance)
        .add(transferAmountBN)
        .toString(10);
    });

    describe('Single address', () => {
      it('should not fail if no address is given', async () => {
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

      it('should not fail if a single invalid address is given', async () => {
        const balance = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ETHNative,
          addresses: [discobotAddress],
          sourceOptions: {
            evmChainId: ethChainId,
          },
          cacheRefresh: true,
        });

        expect(Object.keys(balance).length).to.equal(0);
      });

      it('should return a single balance', async () => {
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
      it('should return many balances', async () => {
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

      it('should not throw if a single address fails', async () => {
        const balances = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ETHNative,
          addresses: [addressOne, discobotAddress, addressTwo],
          sourceOptions: {
            evmChainId: ethChainId,
          },
          cacheRefresh: true,
        });

        expect(Object.keys(balances).length).to.equal(2);
        expect(balances[addressOne]).to.equal(finalAddressOneBalance);
        expect(balances[addressTwo]).to.equal(finalAddressTwoBalance);
      });

      it('should correctly batch balance requests', async () => {
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
      before('Update ChainNodes.eth_chain_id', async () => {
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

      it('should return many balances', async () => {
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

      it('should not throw if a single address fails', async () => {
        const balances = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ETHNative,
          addresses: [addressOne, discobotAddress, addressTwo],
          sourceOptions: {
            evmChainId: newEthChainId,
          },
          cacheRefresh: true,
        });

        expect(Object.keys(balances).length).to.equal(2);
        expect(balances[addressOne]).to.equal(finalAddressOneBalance);
        expect(balances[addressTwo]).to.equal(finalAddressTwoBalance);
      });

      it('should correctly batch balance requests', async () => {
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
    before('Deploy/transfer NFT and reset ChainNode', async () => {
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
      it('should not fail if no address is given', async () => {
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

      it('should not fail if a single invalid address is given', async () => {
        const balance = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ERC721,
          addresses: [discobotAddress],
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: nft.address,
          },
          cacheRefresh: true,
        });

        expect(Object.keys(balance).length).to.equal(0);
      });

      it('should return a single balance', async () => {
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
      it('should return many balances', async () => {
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

      it('should not throw if a single address fails', async () => {
        const balances = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ERC721,
          addresses: [addressOne721, discobotAddress, addressTwo721],
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

      it('should correctly batch balance requests', async () => {
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
    before('Deploy/mint ERC1155 and reset ChainNode', async () => {
      await resetChainNode(ethChainId);
      erc1155 = await sdk.deployErc1155();
      await erc1155.mint('1', 10, addressOne);
      await erc1155.mint('1', 20, addressTwo);
      await erc1155.mint('2', 1, addressOne);
      await erc1155.mint('3', 1, addressTwo);
    });

    describe('Single address', () => {
      it('should not fail if no address is given', async () => {
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

      it('should not fail if a single invalid address is given', async () => {
        const balance = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ERC1155,
          addresses: [discobotAddress],
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: erc1155.address,
            tokenId: 1,
          },
          cacheRefresh: true,
        });

        expect(Object.keys(balance).length).to.equal(0);
      });

      it('should return a single balance', async () => {
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
      it('should return many balances', async () => {
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

      it('should not throw if a single address fails', async () => {
        const balances = await tokenBalanceCache.getBalances({
          balanceSourceType: BalanceSourceType.ERC1155,
          addresses: [addressOne, discobotAddress, addressTwo],
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

      it('should correctly batch balance requests', async () => {
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

    before('Set TBC caching TTL and reset chain node', async () => {
      await resetChainNode(ethChainId);
      // clear all Redis keys
      await cache().flushAll();
    });

    it('should cache for TTL but not longer', async () => {
      const originalAddressOneBalance = await sdk.getBalance(
        chainLinkAddress,
        addressOne,
      );

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
      await sdk.getErc20(chainLinkAddress, addressOne, transferAmount);

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

      const transferAmountBN = new BN(Web3Utils.toWei(transferAmount));
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
