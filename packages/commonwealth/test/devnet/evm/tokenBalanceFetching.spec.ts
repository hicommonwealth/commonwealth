import BN from 'bn.js';
import { expect } from 'chai';
import { RedisCache } from 'common-common/src/redisCache';
import { BalanceType } from 'common-common/src/types';
import Web3 from 'web3';
import { toWei } from 'web3-utils';
import models from '../../../server/database';
import { BalanceSourceType } from '../../../server/util/requirementsModule/requirementsTypes';
import { TokenBalanceCache } from '../../../server/util/tokenBalanceCache/tokenBalanceCache';
import { ChainTesting } from '../../util/evm-chain-testing/sdk/chainTesting';
import { ERC1155 } from '../../util/evm-chain-testing/sdk/erc1155';
import { ERC721 } from '../../util/evm-chain-testing/sdk/nft';

async function resetChainNode(ethChainId: number) {
  await models.ChainNode.destroy({
    where: {
      url: 'http://localhost:8545',
    },
  });
  await models.ChainNode.create({
    url: 'http://localhost:8545',
    eth_chain_id: ethChainId,
    balance_type: BalanceType.Ethereum,
    name: 'Local EVM Chain',
  });
}

describe('Token Balance Cache EVM Tests', function () {
  this.timeout(80000);

  let tbc: TokenBalanceCache;
  const sdk = new ChainTesting('http://127.0.0.1:3000');

  const addressOne = '0xCEB3C3D4B78d5d10bd18930DC0757ddB588A862a';
  const addressTwo = '0xD54f2E2173D0a5eA8e0862Aed18b270aFF08389e';
  const discobotAddress = '0xdiscordbot';

  // ganache chain id
  const ethChainId = 1337;

  before(async () => {
    const redisCache = new RedisCache();
    tbc = new TokenBalanceCache(models, redisCache);
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
      const transferAmountBN = new BN(toWei(transferAmount));
      finalAddressOneBalance = new BN(originalAddressOneBalance)
        .add(transferAmountBN)
        .toString(10);
      finalAddressTwoBalance = new BN(originalAddressTwoBalance)
        .add(transferAmountBN)
        .toString(10);
    });

    describe('Single address', () => {
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

      it('should not fail if a single invalid address is given', async () => {
        const balance = await tbc.getBalances({
          balanceSourceType: BalanceSourceType.ERC20,
          addresses: [discobotAddress],
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
    });

    describe('on-chain batching', () => {
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
        const balances = await tbc.getBalances({
          balanceSourceType: BalanceSourceType.ERC20,
          addresses: [addressOne, addressTwo],
          sourceOptions: {
            evmChainId: newEthChainId,
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
            evmChainId: newEthChainId,
            contractAddress: chainLinkAddress,
          },
        });

        expect(Object.keys(balances).length).to.equal(2);
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
      console.log(
        'Original balances:',
        originalAddressOneBalance,
        originalAddressTwoBalance,
      );
      await sdk.getETH(addressOne, transferAmount);
      await sdk.getETH(addressTwo, transferAmount);
      const transferAmountBN = new BN(toWei(transferAmount));
      finalAddressOneBalance = new BN(originalAddressOneBalance)
        .add(transferAmountBN)
        .toString(10);
      finalAddressTwoBalance = new BN(originalAddressTwoBalance)
        .add(transferAmountBN)
        .toString(10);
      console.log(
        'Final balances:',
        finalAddressOneBalance,
        finalAddressTwoBalance,
      );
    });

    describe('Single address', () => {
      it('should not fail if no address is given', async () => {
        const balance = await tbc.getBalances({
          balanceSourceType: BalanceSourceType.ETHNative,
          addresses: [],
          sourceOptions: {
            evmChainId: ethChainId,
          },
        });
        expect(Object.keys(balance).length).to.equal(0);
      });

      it('should not fail if a single invalid address is given', async () => {
        const balance = await tbc.getBalances({
          balanceSourceType: BalanceSourceType.ETHNative,
          addresses: [discobotAddress],
          sourceOptions: {
            evmChainId: ethChainId,
          },
        });

        expect(Object.keys(balance).length).to.equal(0);
      });

      it('should return a single balance', async () => {
        const balance = await tbc.getBalances({
          balanceSourceType: BalanceSourceType.ETHNative,
          addresses: [addressOne],
          sourceOptions: {
            evmChainId: ethChainId,
          },
        });

        console.log('Balances:', balance);
        expect(Object.keys(balance).length).to.equal(1);
        expect(balance[addressOne]).to.equal(finalAddressOneBalance);
      });
    });

    describe('on-chain batching', () => {
      it('should return many balances', async () => {
        const balances = await tbc.getBalances({
          balanceSourceType: BalanceSourceType.ETHNative,
          addresses: [addressOne, addressTwo],
          sourceOptions: {
            evmChainId: ethChainId,
          },
        });

        expect(Object.keys(balances).length).to.equal(2);
        expect(balances[addressOne]).to.equal(finalAddressOneBalance);
        expect(balances[addressTwo]).to.equal(finalAddressTwoBalance);
      });

      it('should not throw if a single address fails', async () => {
        const balances = await tbc.getBalances({
          balanceSourceType: BalanceSourceType.ETHNative,
          addresses: [addressOne, discobotAddress, addressTwo],
          sourceOptions: {
            evmChainId: ethChainId,
          },
        });

        expect(Object.keys(balances).length).to.equal(2);
        expect(balances[addressOne]).to.equal(finalAddressOneBalance);
        expect(balances[addressTwo]).to.equal(finalAddressTwoBalance);
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
        const balances = await tbc.getBalances({
          balanceSourceType: BalanceSourceType.ETHNative,
          addresses: [addressOne, addressTwo],
          sourceOptions: {
            evmChainId: newEthChainId,
          },
        });

        expect(Object.keys(balances).length).to.equal(2);
        expect(balances[addressOne]).to.equal(finalAddressOneBalance);
        expect(balances[addressTwo]).to.equal(finalAddressTwoBalance);
      });

      it('should not throw if a single address fails', async () => {
        const balances = await tbc.getBalances({
          balanceSourceType: BalanceSourceType.ETHNative,
          addresses: [addressOne, discobotAddress, addressTwo],
          sourceOptions: {
            evmChainId: newEthChainId,
          },
        });

        expect(Object.keys(balances).length).to.equal(2);
        expect(balances[addressOne]).to.equal(finalAddressOneBalance);
        expect(balances[addressTwo]).to.equal(finalAddressTwoBalance);
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
      const addresses = await sdk.getAccounts();
      addressOne721 = addresses[1];
      addressTwo721 = addresses[2];
    });

    describe('Single address', () => {
      it('should not fail if no address is given', async () => {
        const balance = await tbc.getBalances({
          balanceSourceType: BalanceSourceType.ERC721,
          addresses: [],
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: nft.address,
          },
        });

        expect(Object.keys(balance).length).to.equal(0);
      });

      it('should not fail if a single invalid address is given', async () => {
        const balance = await tbc.getBalances({
          balanceSourceType: BalanceSourceType.ERC721,
          addresses: [discobotAddress],
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: nft.address,
          },
        });

        expect(Object.keys(balance).length).to.equal(0);
      });

      it('should return a single balance', async () => {
        const balance = await tbc.getBalances({
          balanceSourceType: BalanceSourceType.ERC721,
          addresses: [addressOne721],
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: nft.address,
          },
        });

        expect(Object.keys(balance).length).to.equal(1);
        expect(balance[addressOne721]).to.equal('1');
      });
    });

    describe('off-chain batching', () => {
      it('should return many balances', async () => {
        const balances = await tbc.getBalances({
          balanceSourceType: BalanceSourceType.ERC721,
          addresses: [addressOne721, addressTwo721],
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: nft.address,
          },
        });

        expect(Object.keys(balances).length).to.equal(2);
        expect(balances[addressOne721]).to.equal('1');
        expect(balances[addressTwo721]).to.equal('1');
      });

      it('should not throw if a single address fails', async () => {
        const balances = await tbc.getBalances({
          balanceSourceType: BalanceSourceType.ERC721,
          addresses: [addressOne721, discobotAddress, addressTwo721],
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: nft.address,
          },
        });

        expect(Object.keys(balances).length).to.equal(2);
        expect(balances[addressOne721]).to.equal('1');
        expect(balances[addressTwo721]).to.equal('1');
      });
    });
  });

  describe.only('ERC1155', () => {
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
        const balance = await tbc.getBalances({
          balanceSourceType: BalanceSourceType.ERC1155,
          addresses: [],
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: erc1155.address,
            tokenId: 1,
          },
        });

        expect(Object.keys(balance).length).to.equal(0);
      });

      it('should not fail if a single invalid address is given', async () => {
        const balance = await tbc.getBalances({
          balanceSourceType: BalanceSourceType.ERC1155,
          addresses: [discobotAddress],
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: erc1155.address,
            tokenId: 1,
          },
        });

        expect(Object.keys(balance).length).to.equal(0);
      });

      it('should return a single balance', async () => {
        const balance = await tbc.getBalances({
          balanceSourceType: BalanceSourceType.ERC1155,
          addresses: [addressOne],
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: erc1155.address,
            tokenId: 1,
          },
        });

        expect(Object.keys(balance).length).to.equal(1);
        expect(balance[addressOne]).to.equal('10');

        const balanceTwo = await tbc.getBalances({
          balanceSourceType: BalanceSourceType.ERC1155,
          addresses: [addressTwo],
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: erc1155.address,
            tokenId: 1,
          },
        });

        expect(Object.keys(balanceTwo).length).to.equal(1);
        expect(balanceTwo[addressTwo]).to.equal('20');
      });
    });

    describe('on-chain batching', () => {
      it('should return many balances', async () => {
        const balances = await tbc.getBalances({
          balanceSourceType: BalanceSourceType.ERC1155,
          addresses: [addressOne, addressTwo],
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: erc1155.address,
            tokenId: 1,
          },
        });

        expect(Object.keys(balances).length).to.equal(2);
        expect(balances[addressOne]).to.equal('10');
        expect(balances[addressTwo]).to.equal('20');
      });

      it('should not throw if a single address fails', async () => {
        const balances = await tbc.getBalances({
          balanceSourceType: BalanceSourceType.ERC1155,
          addresses: [addressOne, discobotAddress, addressTwo],
          sourceOptions: {
            evmChainId: ethChainId,
            contractAddress: erc1155.address,
            tokenId: 1,
          },
        });

        expect(Object.keys(balances).length).to.equal(2);
        expect(balances[addressOne]).to.equal('10');
        expect(balances[addressTwo]).to.equal('20');
      });
    });
  });
});
