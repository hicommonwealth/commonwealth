import { Secp256k1HdWallet } from '@cosmjs/amino';
import { setupWasmExtension } from '@cosmjs/cosmwasm-stargate';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import {
  QueryClient,
  SigningStargateClient,
  coins,
  setupBankExtension,
  setupStakingExtension,
} from '@cosmjs/stargate';
import { Tendermint34Client } from '@cosmjs/tendermint-rpc';
import { RedisCache } from '@hicommonwealth/adapters';
import {
  BalanceSourceType,
  BalanceType,
  ChainBase,
  ChainNetwork,
  ChainType,
  cache,
  delay,
  dispose,
} from '@hicommonwealth/core';
import { models, tokenBalanceCache } from '@hicommonwealth/model';
import BN from 'bn.js';
import { use as chaiUse, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

chaiUse(chaiAsPromised);

const resetChainNode = async (): Promise<void> => {
  const stargazeChainNode = await models.ChainNode.findOne({
    where: {
      cosmos_chain_id: 'stargaze',
    },
  });

  if (stargazeChainNode) {
    await models.ChainNode.update(
      {
        url: 'https://rpc.cosmos.directory/stargaze',
      },
      {
        where: {
          cosmos_chain_id: 'stargaze',
        },
      },
    );
  } else {
    const stargazeNode = await models.ChainNode.create({
      url: 'https://rpc.cosmos.directory/stargaze',
      name: 'Stargaze',
      balance_type: BalanceType.Cosmos,
      cosmos_chain_id: 'stargaze',
      bech32: 'stars',
    });
    await models.Community.create({
      id: 'stargaze',
      network: ChainNetwork.Stargaze,
      default_symbol: 'STARS',
      name: 'Stargaze',
      icon_url: '/static/img/protocols/cosmos.png',
      active: true,
      type: ChainType.Chain,
      base: ChainBase.CosmosSDK,
      has_chain_events_listener: true,
      chain_node_id: stargazeNode.id,
      bech32_prefix: 'stars',
    });
  }
};

// same mnemonic as defined in cosmos-chain-testing bootstrap files
const addressOneMnemonic =
  'jewel disease neglect feel mother dry hire yellow minute main tray famous';

async function generateCosmosAddresses(numberOfAddresses: number) {
  const addresses = [];
  for (let i = 0; i < numberOfAddresses; i++) {
    // Generate a new wallet with a random mnemonic
    const wallet = await Secp256k1HdWallet.generate(12, { prefix: 'cosmos' });
    // Get the first account from the wallet
    const [firstAccount] = await wallet.getAccounts();
    addresses.push(firstAccount.address);
  }

  return addresses;
}

describe('Token Balance Cache Cosmos Tests', function () {
  this.timeout(80_000);
  // mnemonic + token allocation can be found in cosmos-chain-test/[version]/bootstrap.sh files
  const cosmosChainId = 'csdkv1ci';
  const addressOne = 'cosmos1zf45elxg5alxxeewvumpprfqtxmy2ufhzvetgx';
  const addressTwo = 'cosmos1f85wzgz83gkq09g9gj79c6w9gydu87a7e6hax7';
  const discobotAddress = '0xdiscordbot';
  const addressOneBalance = '50000000000';
  const addressTwoBalance = '30000000000';

  before(async () => {
    cache(new RedisCache());
  });

  after(async () => {
    await dispose()();
  });

  describe('Cosmos Native', function () {
    it('should return a single balance', async () => {
      const balance = await tokenBalanceCache.getBalances({
        balanceSourceType: BalanceSourceType.CosmosNative,
        addresses: [addressOne],
        sourceOptions: {
          cosmosChainId,
        },
        cacheRefresh: true,
      });

      console.log(balance);
      expect(Object.keys(balance).length).to.equal(1);
      expect(balance[addressOne]).to.equal(addressOneBalance);
    });

    it('should not throw if a single address fails', async () => {
      const balance = await tokenBalanceCache.getBalances({
        balanceSourceType: BalanceSourceType.CosmosNative,
        addresses: [addressOne, discobotAddress],
        sourceOptions: {
          cosmosChainId,
        },
        cacheRefresh: true,
      });

      expect(Object.keys(balance).length).to.equal(1);
      expect(balance[addressOne]).to.equal(addressOneBalance);
    });

    it('should only return a single result per address', async () => {
      const balances = await tokenBalanceCache.getBalances({
        balanceSourceType: BalanceSourceType.CosmosNative,
        addresses: [addressOne, addressOne],
        sourceOptions: {
          cosmosChainId,
        },
        cacheRefresh: true,
      });

      expect(Object.keys(balances).length).to.equal(1);
      expect(balances[addressOne]).to.equal(addressOneBalance);
    });

    it('should return many balances', async () => {
      const balances = await tokenBalanceCache.getBalances({
        balanceSourceType: BalanceSourceType.CosmosNative,
        addresses: [addressOne, addressTwo],
        sourceOptions: {
          cosmosChainId,
        },
        cacheRefresh: true,
      });

      expect(Object.keys(balances).length).to.equal(2);
      expect(balances[addressOne]).to.equal(addressOneBalance);
      expect(balances[addressTwo]).to.equal(addressTwoBalance);
    });

    it('should correctly batch balance requests', async () => {
      const bulkAddresses = await generateCosmosAddresses(20);
      bulkAddresses.splice(4, 0, addressOne);
      bulkAddresses.splice(5, 0, addressTwo);
      const balances = await tokenBalanceCache.getBalances({
        balanceSourceType: BalanceSourceType.CosmosNative,
        addresses: bulkAddresses,
        sourceOptions: {
          cosmosChainId,
        },
        cacheRefresh: true,
        batchSize: 5,
      });

      expect(Object.keys(balances).length).to.equal(22);
      expect(balances[addressOne]).to.equal(addressOneBalance);
      expect(balances[addressTwo]).to.equal(addressTwoBalance);
    });

    describe('Caching', () => {
      const balanceTTL = 20;

      before('Set TBC caching TTL and reset Redis', async () => {
        await cache().flushAll();
      });

      it('should cache for TTL but not longer', async () => {
        const chainNode = await models.ChainNode.findOne({
          where: {
            cosmos_chain_id: cosmosChainId,
          },
        });
        const rpcEndpoint = chainNode.url;
        const tmClient = await Tendermint34Client.connect(rpcEndpoint);
        const api = QueryClient.withExtensions(
          tmClient,
          setupBankExtension,
          setupStakingExtension,
        );
        const { params } = await api.staking.params();
        const denom = params?.bondDenom;
        const { amount } = await api.bank.balance(addressOne, denom);
        const originalAddressOneBalance = amount;

        const balance = await tokenBalanceCache.getBalances(
          {
            balanceSourceType: BalanceSourceType.CosmosNative,
            addresses: [addressOne],
            sourceOptions: {
              cosmosChainId,
            },
            cacheRefresh: true,
          },
          balanceTTL,
        );
        expect(Object.keys(balance).length).to.equal(1);
        expect(balance[addressOne]).to.equal(originalAddressOneBalance);

        // transfer tokens
        const wallet = await DirectSecp256k1HdWallet.fromMnemonic(
          addressOneMnemonic,
        );
        const client = await SigningStargateClient.connectWithSigner(
          rpcEndpoint,
          wallet,
        );
        const transferAmount = coins(76, denom);
        await client.sendTokens(addressOne, addressTwo, transferAmount, {
          amount: coins(500, denom),
          gas: '200000',
        });

        const balanceTwo = await tokenBalanceCache.getBalances(
          {
            balanceSourceType: BalanceSourceType.CosmosNative,
            addresses: [addressOne],
            sourceOptions: {
              cosmosChainId,
            },
          },
          balanceTTL,
        );
        expect(Object.keys(balanceTwo).length).to.equal(1);
        expect(balanceTwo[addressOne]).to.equal(originalAddressOneBalance);
        await delay(20000);

        const balanceThree = await tokenBalanceCache.getBalances(
          {
            balanceSourceType: BalanceSourceType.CosmosNative,
            addresses: [addressOne],
            sourceOptions: {
              cosmosChainId,
            },
          },
          balanceTTL,
        );
        const finalBn = new BN(originalAddressOneBalance);
        expect(Object.keys(balanceThree).length).to.equal(1);
        expect(balanceThree[addressOne]).to.equal(
          finalBn.subn(500).subn(76).toString(10),
        );
      });
    });
  });

  describe('CW721', function () {
    const stargazeChainId = 'stargaze';
    // These are onchain stargaze wallets, one with an NFT and one without
    const addressWithNft = 'stars1g98znshl3dh49x402fj3tdwjj5ysf9f0p3m2l2';
    const addressWithoutNft = 'stars18q3tlnx8vguv2fadqslm7x59ejauvsmntc09ae';
    const contractAddress =
      'stars183uw93940vj49tmpzez09c03w6qn6cgmy03v9srh8n2ntmt9lh3qzn2lac'; // slime world

    before(async () => {
      await resetChainNode();
    });

    it('should return a single cw721 balance', async () => {
      const balance = await tokenBalanceCache.getBalances({
        balanceSourceType: BalanceSourceType.CW721,
        addresses: [addressWithNft],
        sourceOptions: {
          cosmosChainId: stargazeChainId,
          contractAddress,
        },
        cacheRefresh: true,
      });

      expect(Object.keys(balance).length).to.equal(1);
      expect(balance[addressWithNft]).to.equal('1');
    });
    it('should return many cw721 balances', async () => {
      const balances = await tokenBalanceCache.getBalances({
        balanceSourceType: BalanceSourceType.CW721,
        addresses: [addressWithNft, addressWithoutNft],
        sourceOptions: {
          cosmosChainId: stargazeChainId,
          contractAddress,
        },
        cacheRefresh: true,
      });

      expect(Object.keys(balances).length).to.equal(2);
      expect(balances[addressWithNft]).to.equal('1');
      expect(balances[addressWithoutNft]).to.equal('0');
    });
    it('should not throw if a single address fails', async () => {
      const balance = await tokenBalanceCache.getBalances({
        balanceSourceType: BalanceSourceType.CW721,
        addresses: [discobotAddress],
        sourceOptions: {
          cosmosChainId: stargazeChainId,
          contractAddress,
        },
        cacheRefresh: true,
      });

      expect(Object.keys(balance).length).to.equal(0);
    });
    it('should not throw if a single address out of many fails', async () => {
      const balance = await tokenBalanceCache.getBalances({
        balanceSourceType: BalanceSourceType.CW721,
        addresses: [addressWithNft, discobotAddress],
        sourceOptions: {
          cosmosChainId: stargazeChainId,
          contractAddress,
        },
        cacheRefresh: true,
      });

      expect(Object.keys(balance).length).to.equal(1);
      expect(balance[addressWithNft]).to.equal('1');
    });
    it('should correctly batch balance requests', async () => {
      const bulkAddresses = await generateCosmosAddresses(20);
      bulkAddresses.splice(4, 0, addressWithNft);
      bulkAddresses.splice(5, 0, addressWithoutNft);
      const balances = await tokenBalanceCache.getBalances({
        balanceSourceType: BalanceSourceType.CW721,
        addresses: bulkAddresses,
        sourceOptions: {
          cosmosChainId: stargazeChainId,
          contractAddress,
        },
        cacheRefresh: true,
        batchSize: 5,
      });
      expect(Object.keys(balances).length).to.equal(22);
      expect(balances[addressWithNft]).to.equal('1');
      expect(balances[addressWithoutNft]).to.equal('0');
    });

    describe('Caching CW721', () => {
      const balanceTTL = 20;

      before('Set TBC caching TTL and reset Redis', async () => {
        await cache().flushAll();
      });

      it('should cache balance, then refresh after TTL', async () => {
        const chainNode = await models.ChainNode.findOne({
          where: {
            cosmos_chain_id: stargazeChainId,
          },
        });
        const tmClient = await tokenBalanceCache.getTendermintClient({
          chainNode,
        });
        const api = QueryClient.withExtensions(tmClient, setupWasmExtension);

        const key = {
          tokens: {
            owner: addressWithNft,
            start_after: null,
            limit: null,
          },
        };
        const response = await api.wasm.queryContractSmart(
          contractAddress,
          key,
        );
        const expectedAddressOneBalance = response.tokens.length.toString();

        const balance = await tokenBalanceCache.getBalances(
          {
            balanceSourceType: BalanceSourceType.CW721,
            addresses: [addressWithNft],
            sourceOptions: {
              cosmosChainId: stargazeChainId,
              contractAddress,
            },
            cacheRefresh: true,
          },
          balanceTTL,
        );

        expect(Object.keys(balance).length).to.equal(1);
        expect(balance[addressWithNft]).to.equal(expectedAddressOneBalance);

        delay(20000);

        const balanceAfterTTL = await tokenBalanceCache.getBalances(
          {
            balanceSourceType: BalanceSourceType.CW721,
            addresses: [addressWithNft],
            sourceOptions: {
              cosmosChainId: stargazeChainId,
              contractAddress,
            },
          },
          balanceTTL,
        );

        expect(Object.keys(balanceAfterTTL).length).to.equal(1);
        expect(balanceAfterTTL[addressWithNft]).to.equal(
          expectedAddressOneBalance,
        );
      });
    });
  });
});
