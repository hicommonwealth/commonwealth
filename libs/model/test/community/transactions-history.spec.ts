import { Actor, command, dispose, query } from '@hicommonwealth/core';
import { ValidChains } from '@hicommonwealth/evm-protocols';
import { BalanceType, CommunityTierMap } from '@hicommonwealth/shared';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import {
  CreateStakeTransaction,
  GetTransactions,
} from '../../src/aggregates/community';
import { seed } from '../../src/tester';

describe('Transactions history', () => {
  const actor: Actor = { user: { email: '' } };
  let payload;
  let community_id: string;

  beforeAll(async () => {
    const [node] = await seed('ChainNode', {
      url: 'https://ethereum-sepolia.publicnode.com',
      private_url: 'https://ethereum-sepolia.publicnode.com',
      name: 'Sepolia Testnet',
      eth_chain_id: ValidChains.Sepolia,
      balance_type: BalanceType.Ethereum,
    });

    const [user] = await seed('User', {
      isAdmin: true,
    });
    const [community] = await seed('Community', {
      tier: CommunityTierMap.ChainVerified,
      namespace: 'qaa',
      chain_node_id: node?.id,
      lifetime_thread_count: 0,
      profile_count: 1,
      Addresses: [
        {
          role: 'admin',
          user_id: user!.id,
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
  });

  afterAll(async () => {
    await dispose()();
  });

  test('should create stake transactions and be able to query them', async () => {
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

    const getResult = await query(GetTransactions(), {
      actor,
      payload: { addresses: results?.address },
    });

    expect(
      getResult?.find(
        (t) =>
          t?.transaction_hash ===
          '0x924f40cfea663b2579816173f048b61ab2b118e0c7c055d7b00dbd9cd15eb7c0',
      ),
    ).to.exist;
  }); // increase timeout because crypto calls take a while

  test('should fail if transaction is not related to community', async () => {
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
      expect((e as Error).message).to.equal(
        'Transaction is not associated with provided community',
      );
      return;
    }

    throw Error(
      'Create stake transaction passed on unrelated community, it should fail!',
    );
  }); // increase timeout because crypto calls take a while
});
