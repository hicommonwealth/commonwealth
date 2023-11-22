import { use as chaiUse, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { RedisCache } from 'common-common/src/redisCache';
import models from '../../../server/database';
import { BalanceSourceType } from '../../../server/util/requirementsModule/requirementsTypes';
import { TokenBalanceCache } from '../../../server/util/tokenBalanceCache/tokenBalanceCache';

chaiUse(chaiAsPromised);

describe.only('Token Balance Cache Cosmos Tests', () => {
  let tbc: TokenBalanceCache;
  // mnemonic + token allocation can be found in cosmos-chain-test/[version]/bootstrap.sh files
  const addressOne = 'cosmos1zf45elxg5alxxeewvumpprfqtxmy2ufhzvetgx';
  const addressTwo = 'cosmos1f85wzgz83gkq09g9gj79c6w9gydu87a7e6hax7';
  const discobotAddress = '0xdiscordbot';
  const cosmosChainId = 'csdkv1ci';
  const addressOneBalance = '50000000000';
  const addressTwoBalance = '30000000000';

  before(async () => {
    const redisCache = new RedisCache();
    tbc = new TokenBalanceCache(models, redisCache);
  });

  // it('should fail if a bech32 prefix is not provided');
  it('should return a single balance', async () => {
    const balance = await tbc.getBalances({
      balanceSourceType: BalanceSourceType.CosmosNative,
      addresses: [addressOne],
      sourceOptions: {
        cosmosChainId,
      },
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
    });

    expect(Object.keys(balances).length).to.equal(2);
    expect(balances[addressOne]).to.equal(addressOneBalance);
    expect(balances[addressTwo]).to.equal(addressTwoBalance);
  });
});
