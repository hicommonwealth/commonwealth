import { Actor, command, dispose } from '@hicommonwealth/core';
import { config } from '@hicommonwealth/model';
import { BalanceType, commonProtocol } from '@hicommonwealth/shared';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { bootstrap_testing, seed } from 'model/src/tester';
import { afterAll, beforeAll, describe, test } from 'vitest';
import { ChainNodeAttributes } from '../../src';
import { CreateLaunchpadTrade, CreateToken } from '../../src/token';

chai.use(chaiAsPromised);

const transaction_hash =
  '0x754d65b374aa224c0f74b0951e88f97e223b1fdd7e0ec468e253c486ae7e8a68';
const token_address = '0x48651D8dE5F3c1634C77A46f77836FE2338fdc0C';

describe('Launchpad Lifecycle', () => {
  let actor: Actor;
  let community_id: string;
  let node: ChainNodeAttributes;

  beforeAll(async () => {
    await bootstrap_testing(true);
    [node] = (await seed('ChainNode', {
      url: `https://base-sepolia.g.alchemy.com/v2/${config.ALCHEMY.APP_KEYS.PUBLIC}`,
      private_url: `https://base-sepolia.g.alchemy.com/v2/${config.ALCHEMY.APP_KEYS.PUBLIC}`,
      name: 'Base Sepolia Testnet',
      eth_chain_id: commonProtocol.ValidChains.SepoliaBase,
      balance_type: BalanceType.Ethereum,
    })) as ChainNodeAttributes[];

    const [user] = await seed('User', {
      isAdmin: true,
    });

    const [community] = await seed('Community', {
      namespace: 'Tim Testing 3',
      chain_node_id: node?.id,
      lifetime_thread_count: 0,
      profile_count: 1,
      Addresses: [
        {
          role: 'admin',
          user_id: user!.id,
          verified: new Date(),
        },
      ],
      CommunityStakes: [
        {
          stake_id: 2,
          stake_token: '',
          vote_weight: 1,
          stake_enabled: true,
        },
      ],
    });

    community_id = community!.id!;

    actor = {
      address: community!.Addresses![0].address,
      user: { email: '', id: user!.id },
    };
  });

  afterAll(async () => {
    await dispose()();
  });

  test(
    'Create Token works given txHash and chainNodeId',
    { timeout: 10_000 },
    async () => {
      const payload = {
        transaction_hash,
        chain_node_id: node!.id!,
        description: 'test',
        icon_url: 'test',
        community_id: community_id!,
      };

      const results = await command(CreateToken(), {
        actor,
        payload,
      });

      expect(results?.token_address).to.equal(token_address);
      expect(results?.symbol).to.equal('tim3');
    },
  );

  // TODO: complete test in #9867
  test.skip(
    'Get a launchpad trade txn and project it',
    { timeout: 10_000 },
    async () => {
      const buyTxHash = '';
      const payload = {
        transaction_hash: buyTxHash,
        eth_chain_id: commonProtocol.ValidChains.SepoliaBase,
      };
      const results = await command(CreateLaunchpadTrade(), {
        actor,
        payload,
      });
      expect(results).to.deep.equal({
        eth_chain_id: commonProtocol.ValidChains.SepoliaBase,
        transaction_hash: buyTxHash,
        token_address,
        trader_address: '',
        is_buy: true,
        community_token_amount: 1n,
        price: 1n,
        floating_supply: 1n,
        timestamp: 1,
      });
    },
  );
});
