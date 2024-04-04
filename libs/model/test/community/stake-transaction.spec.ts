import { Actor, BalanceType, command, dispose } from '@hicommonwealth/core';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { CreateStakeTransaction } from '../../src/community/CreateStakeTransaction.command';
import { seed } from '../../src/tester/index';
chai.use(chaiAsPromised);

describe.skip('Stake transactions', () => {
  const actor: Actor = { user: { email: '' } };
  let payload;
  let community_id;

  before(async () => {
    const [node] = await seed('ChainNode', {
      url: 'https://ethereum-sepolia.publicnode.com',
      name: 'Sepolia Testnet',
      eth_chain_id: 11155111,
      balance_type: BalanceType.Ethereum,
      contracts: [],
    });

    const [user] = await seed('User', {
      isAdmin: true,
      selected_community_id: null,
    });
    const [community] = await seed('Community', {
      namespace: 'qaa',
      chain_node_id: node?.id,
      Addresses: [
        {
          role: 'admin',
          user_id: user!.id,
          profile_id: undefined,
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
      topics: [],
      groups: [],
      discord_config_id: null,
    });

    community_id = community!.id!;
  });

  after(async () => {
    await dispose()();
  });

  it.skip(
    'should create stake transactions and be able to query them',
    async () => {
      payload = {
        transaction_hash:
          '0x924f40cfea663b2579816173f048b61ab2b118e0c7c055d7b00dbd9cd15eb7c0',
        community_id,
      };

      let results = await command(CreateStakeTransaction(), {
        actor,
        payload,
      });
      // This address comes from the actual crypto transaction
      expect(results?.address).to.equal(
        '0xf6885b5aC5AE36689038dAf30184AeEB266E61f5',
      );
      expect(results?.stake_direction).to.equal('buy');

      payload = {
        transaction_hash:
          '0x924f40cfea663b2579816173f048b61ab2b118e0c7c055d7b00dbd9cd15eb7c0',
        community_id,
      };

      results = await command(CreateStakeTransaction(), {
        actor,
        payload,
      });

      expect(results?.address).to.equal(
        '0xf6885b5aC5AE36689038dAf30184AeEB266E61f5',
      );
      expect(results?.stake_direction).to.equal('buy');

      // const getResult = await command(GetStakeTransaction(), {
      //   actor,
      //   payload: { community_id },
      // });

      // expect(
      //   getResult?.find(
      //     (t) =>
      //       t?.transaction_hash ===
      //       '0x924f40cfea663b2579816173f048b61ab2b118e0c7c055d7b00dbd9cd15eb7c0',
      //   ),
      // ).to.exist;
    },
  ).timeout(10000); // increase timeout because crypto calls take a while

  it('should fail if transaction is not related to community', async () => {
    payload = {
      transaction_hash:
        '0x84939478bc5fbcca178e006dccdfaab6aebed40ef0a7b02684487780c10d8ce8',
      community_id,
    };

    try {
      await command(CreateStakeTransaction(), {
        actor,
        payload,
      });
    } catch (e) {
      expect(e.message).to.equal(
        'Transaction is not associated with provided community',
      );
      return;
    }

    throw Error(
      'Create stake transaction passed on unrelated community, it should fail!',
    );
  }).timeout(10000); // increase timeout because crypto calls take a while
});
