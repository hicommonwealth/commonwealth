import { Secp256k1HdWallet } from '@cosmjs/amino';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import {
  QueryClient,
  SigningStargateClient,
  coins,
  setupBankExtension,
  setupStakingExtension,
} from '@cosmjs/stargate';
import { Tendermint34Client } from '@cosmjs/tendermint-rpc';
import { RedisCache, delay } from '@hicommonwealth/adapters';
import BN from 'bn.js';
import { use as chaiUse, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import models from '../../../server/database';
import { BalanceSourceType } from '../../../server/util/requirementsModule/requirementsTypes';
import { TokenBalanceCache } from '../../../server/util/tokenBalanceCache/tokenBalanceCache';

chaiUse(chaiAsPromised);

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
  let tbc: TokenBalanceCache;
  // mnemonic + token allocation can be found in cosmos-chain-test/[version]/bootstrap.sh files
  const addressOne = 'cosmos1zf45elxg5alxxeewvumpprfqtxmy2ufhzvetgx';
  const addressTwo = 'cosmos1f85wzgz83gkq09g9gj79c6w9gydu87a7e6hax7';
  const discobotAddress = '0xdiscordbot';
  const cosmosChainId = 'csdkv1ci';
  const addressOneBalance = '50000000000';
  const addressTwoBalance = '30000000000';
  let redisCache: RedisCache;

  before(async () => {
    redisCache = new RedisCache();
    await redisCache.init('redis://localhost:6379');
    tbc = new TokenBalanceCache(models, redisCache);
  });

  it('should return a single balance', async () => {
    const balance = await tbc.getBalances({
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
    const balance = await tbc.getBalances({
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
    const balances = await tbc.getBalances({
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
    const balances = await tbc.getBalances({
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
    const balances = await tbc.getBalances({
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
      tbc = new TokenBalanceCache(models, redisCache, balanceTTL);
      await redisCache.client.flushAll();
    });

    it('should cache for TTL but not longer', async () => {
      const chainNode = await models.ChainNode.findOne({
        where: {
          cosmos_chain_id: cosmosChainId,
        },
      });
      const rpcEndpoint = chainNode.private_url || chainNode.url;
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

      const balance = await tbc.getBalances({
        balanceSourceType: BalanceSourceType.CosmosNative,
        addresses: [addressOne],
        sourceOptions: {
          cosmosChainId,
        },
        cacheRefresh: true,
      });
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

      const balanceTwo = await tbc.getBalances({
        balanceSourceType: BalanceSourceType.CosmosNative,
        addresses: [addressOne],
        sourceOptions: {
          cosmosChainId,
        },
      });
      expect(Object.keys(balanceTwo).length).to.equal(1);
      expect(balanceTwo[addressOne]).to.equal(originalAddressOneBalance);
      await delay(20000);

      const balanceThree = await tbc.getBalances({
        balanceSourceType: BalanceSourceType.CosmosNative,
        addresses: [addressOne],
        sourceOptions: {
          cosmosChainId,
        },
      });
      const finalBn = new BN(originalAddressOneBalance);
      expect(Object.keys(balanceThree).length).to.equal(1);
      expect(balanceThree[addressOne]).to.equal(
        finalBn.subn(500).subn(76).toString(10),
      );
    });
  });
});
