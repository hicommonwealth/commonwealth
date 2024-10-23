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
import { cache, dispose } from '@hicommonwealth/core';
import {
  CommunityAttributes,
  tester,
  tokenBalanceCache,
  type DB,
} from '@hicommonwealth/model';
import {
  BalanceSourceType,
  BalanceType,
  ChainBase,
  ChainNetwork,
  ChainType,
  CosmosGovernanceVersion,
  delay,
} from '@hicommonwealth/shared';
import BN from 'bn.js';
import { use as chaiUse, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { afterAll, beforeAll, describe, test } from 'vitest';

chaiUse(chaiAsPromised);

// same mnemonic as defined in cosmos-chain-testing bootstrap files
const addressOneMnemonic =
  'jewel disease neglect feel mother dry hire yellow minute main tray famous';

async function generateCosmosAddresses(numberOfAddresses: number) {
  const addresses: string[] = [];
  for (let i = 0; i < numberOfAddresses; i++) {
    // Generate a new wallet with a random mnemonic
    const wallet = await Secp256k1HdWallet.generate(12, { prefix: 'cosmos' });
    // Get the first account from the wallet
    const [firstAccount] = await wallet.getAccounts();
    addresses.push(firstAccount.address);
  }

  return addresses;
}

describe('Token Balance Cache Cosmos Tests', { timeout: 30_000 }, function () {
  // mnemonic + token allocation can be found in cosmos-chain-test/[version]/bootstrap.sh files
  const cosmosChainId = 'csdkv1local';
  const addressOne = 'cosmos1zf45elxg5alxxeewvumpprfqtxmy2ufhzvetgx';
  const addressTwo = 'cosmos1f85wzgz83gkq09g9gj79c6w9gydu87a7e6hax7';
  const discobotAddress = '0xdiscordbot';
  const addressOneBalance = '50000000000';
  const addressTwoBalance = '30000000000';

  let models: DB;

  const resetChainNodes = async (): Promise<void> => {
    const stargazeChainNode = await models.ChainNode.findOne({
      where: {
        cosmos_chain_id: 'stargaze',
      },
    });
    const junoChainNode = await models.ChainNode.findOne({
      where: {
        cosmos_chain_id: 'juno',
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
        cosmos_gov_version: CosmosGovernanceVersion.v1,
      });
      await models.Community.create({
        id: 'stargaze',
        network: ChainNetwork.Stargaze,
        default_symbol: 'STARS',
        name: 'Stargaze',
        icon_url: 'assets/img/protocols/cosmos.png',
        active: true,
        type: ChainType.Chain,
        base: ChainBase.CosmosSDK,
        chain_node_id: stargazeNode.id,
        bech32_prefix: 'stars',
        collapsed_on_homepage: false,
        custom_stages: [],
        directory_page_enabled: false,
        snapshot_spaces: [],
        stages_enabled: true,
        social_links: [],
      } as unknown as CommunityAttributes);
    }

    if (junoChainNode) {
      await models.ChainNode.update(
        {
          url: 'https://rpc.cosmos.directory/juno',
        },
        {
          where: {
            cosmos_chain_id: 'juno',
          },
        },
      );
    } else {
      await models.ChainNode.create({
        url: 'https://rpc.cosmos.directory/juno',
        name: 'Juno',
        balance_type: BalanceType.Cosmos,
        cosmos_chain_id: 'juno',
        bech32: 'juno',
      });
    }
  };

  beforeAll(async () => {
    models = await tester.seedDb();
    cache({
      adapter: new RedisCache('redis://localhost:6379'),
    });
    await cache().ready();
    await resetChainNodes();
  });

  afterAll(async () => {
    await dispose()();
  });

  describe('Cosmos Native', function () {
    test('should return a single balance', async () => {
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

    test('should not throw if a single address fails', async () => {
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

    test('should only return a single result per address', async () => {
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

    test('should return many balances', async () => {
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

    test('should correctly batch balance requests', async () => {
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

      beforeAll(async () => {
        await cache().flushAll();
      });

      test(
        'should cache for TTL but not longer',
        { timeout: 30_000 },
        async () => {
          const chainNode = await models.ChainNode.findOne({
            where: {
              cosmos_chain_id: cosmosChainId,
            },
          });
          const rpcEndpoint = chainNode!.url!;
          const tmClient = await Tendermint34Client.connect(rpcEndpoint);
          const api = QueryClient.withExtensions(
            tmClient,
            setupBankExtension,
            setupStakingExtension,
          );
          const { params } = await api.staking.params();
          const denom = params?.bondDenom;
          const { amount } = await api.bank.balance(addressOne, denom!);
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
          const wallet =
            await DirectSecp256k1HdWallet.fromMnemonic(addressOneMnemonic);
          const client = await SigningStargateClient.connectWithSigner(
            rpcEndpoint,
            wallet,
          );
          const transferAmount = coins(76, denom!);
          await client.sendTokens(addressOne, addressTwo, transferAmount, {
            amount: coins(500, denom!),
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
        },
      );
    });
  });

  describe('CW721', function () {
    const stargazeChainId = 'stargaze';
    // These are onchain stargaze wallets, one with an NFT and one without
    const addressWithNft = 'stars1g98znshl3dh49x402fj3tdwjj5ysf9f0p3m2l2';
    const addressWithoutNft = 'stars18q3tlnx8vguv2fadqslm7x59ejauvsmntc09ae';
    const contractAddress =
      'stars183uw93940vj49tmpzez09c03w6qn6cgmy03v9srh8n2ntmt9lh3qzn2lac'; // slime world

    test('should return a single cw721 balance', async () => {
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

    test('should return many cw721 balances', async () => {
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

    test('should not throw if a single address fails', async () => {
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

    test('should not throw if a single address out of many fails', async () => {
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

    test('should correctly batch balance requests', async () => {
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

      beforeAll(async () => {
        await cache().flushAll();
      });

      test(
        'should cache balance, then refresh after TTL',
        { timeout: 30_000 },
        async () => {
          const chainNode = await models.ChainNode.findOne({
            where: {
              cosmos_chain_id: stargazeChainId,
            },
          });
          const tmClient = await tokenBalanceCache.getTendermintClient({
            chainNode: chainNode!,
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

          await delay(20000);

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
        },
      );
    });
  });

  describe('CW20', function () {
    const junoChainId = 'juno';
    const addressWithToken = 'juno1g98znshl3dh49x402fj3tdwjj5ysf9f0rl0vn8'; // has 2 WYND
    const addressWithoutToken = 'juno12p9k7kr628j8xt5z05xz0m4268nv9l9gfls8f0';
    const contractAddressWYND =
      'juno1mkw83sv6c7sjdvsaplrzc8yaes9l42p4mhy0ssuxjnyzl87c9eps7ce3m9';
    const contractAddress = contractAddressWYND;

    test('should return a single cw20 balance', async () => {
      const balance = await tokenBalanceCache.getBalances({
        balanceSourceType: BalanceSourceType.CW20,
        addresses: [addressWithToken],
        sourceOptions: {
          cosmosChainId: junoChainId,
          contractAddress,
        },
        cacheRefresh: true,
      });

      expect(Object.keys(balance).length).to.equal(1);
      expect(balance[addressWithToken]).to.equal('3000000');
    });

    test('should return many cw20 balances', async () => {
      const balances = await tokenBalanceCache.getBalances({
        balanceSourceType: BalanceSourceType.CW20,
        addresses: [addressWithToken, addressWithoutToken],
        sourceOptions: {
          cosmosChainId: junoChainId,
          contractAddress,
        },
        cacheRefresh: true,
      });

      expect(Object.keys(balances).length).to.equal(2);
      expect(balances[addressWithToken]).to.equal('3000000');
      expect(balances[addressWithoutToken]).to.equal('0');
    });

    test('should not throw if a single address fails', async () => {
      const balance = await tokenBalanceCache.getBalances({
        balanceSourceType: BalanceSourceType.CW20,
        addresses: [discobotAddress],
        sourceOptions: {
          cosmosChainId: junoChainId,
          contractAddress,
        },
        cacheRefresh: true,
      });

      expect(Object.keys(balance).length).to.equal(0);
    });

    test('should not throw if a single address out of many fails', async () => {
      const balance = await tokenBalanceCache.getBalances({
        balanceSourceType: BalanceSourceType.CW20,
        addresses: [addressWithToken, discobotAddress],
        sourceOptions: {
          cosmosChainId: junoChainId,
          contractAddress,
        },
        cacheRefresh: true,
      });

      expect(Object.keys(balance).length).to.equal(1);
      expect(balance[addressWithToken]).to.equal('3000000');
    });

    test('should correctly batch balance requests', async () => {
      const bulkAddresses = await generateCosmosAddresses(20);
      bulkAddresses.splice(4, 0, addressWithToken);
      bulkAddresses.splice(5, 0, addressWithoutToken);
      const balances = await tokenBalanceCache.getBalances({
        balanceSourceType: BalanceSourceType.CW20,
        addresses: bulkAddresses,
        sourceOptions: {
          cosmosChainId: junoChainId,
          contractAddress,
        },
        cacheRefresh: true,
        batchSize: 5,
      });
      expect(Object.keys(balances).length).to.equal(22);
      expect(balances[addressWithToken]).to.equal('3000000');
      expect(balances[addressWithoutToken]).to.equal('0');
    });

    describe('Caching CW20', () => {
      const balanceTTL = 20;

      beforeAll(async () => {
        await cache().flushAll();
      });

      test(
        'should cache balance, then refresh after TTL',
        { timeout: 30_000 },
        async () => {
          const chainNode = await models.ChainNode.findOne({
            where: {
              cosmos_chain_id: junoChainId,
            },
          });
          const tmClient = await tokenBalanceCache.getTendermintClient({
            chainNode: chainNode!,
          });
          const api = QueryClient.withExtensions(tmClient, setupWasmExtension);

          const key = {
            balance: {
              address: addressWithToken,
            },
          };
          const response = await api.wasm.queryContractSmart(
            contractAddress,
            key,
          );
          const expectedAddressOneBalance = response.balance.toString();

          const balance = await tokenBalanceCache.getBalances(
            {
              balanceSourceType: BalanceSourceType.CW20,
              addresses: [addressWithToken],
              sourceOptions: {
                cosmosChainId: junoChainId,
                contractAddress,
              },
              cacheRefresh: true,
            },
            balanceTTL,
          );

          expect(Object.keys(balance).length).to.equal(1);
          expect(balance[addressWithToken]).to.equal(expectedAddressOneBalance);

          await delay(20000);

          const balanceAfterTTL = await tokenBalanceCache.getBalances(
            {
              balanceSourceType: BalanceSourceType.CW20,
              addresses: [addressWithToken],
              sourceOptions: {
                cosmosChainId: junoChainId,
                contractAddress,
              },
            },
            balanceTTL,
          );

          expect(Object.keys(balanceAfterTTL).length).to.equal(1);
          expect(balanceAfterTTL[addressWithToken]).to.equal(
            expectedAddressOneBalance,
          );
        },
      );
    });
  });
});
