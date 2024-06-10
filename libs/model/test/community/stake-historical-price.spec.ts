import { Actor, dispose, query } from '@hicommonwealth/core';
import { BalanceType } from '@hicommonwealth/shared';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { bootstrap_testing, seed } from 'model/src/tester';
import { afterAll, beforeAll, describe, test } from 'vitest';
import { GetStakeHistoricalPrice } from '../../src/community/GetStakeHistoricalPrice.query';

chai.use(chaiAsPromised);

describe('Stake Historical Price', () => {
  let community_id: string;
  let actor: Actor;

  beforeAll(async () => {
    await bootstrap_testing(true);
    const [node] = await seed('ChainNode', {
      url: 'https://ethereum-sepolia.publicnode.com',
      name: 'Sepolia Testnet',
      eth_chain_id: 11155111,
      balance_type: BalanceType.Ethereum,
    });

    const [user] = await seed('User', {
      isAdmin: true,
    });
    const [community] = await seed('Community', {
      chain_node_id: node?.id,
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

    actor = {
      user: { id: user!.id!, email: user!.email! },
      address_id: community!.Addresses![0].address,
    };

    community_id = community!.id!;

    await seed('StakeTransaction', {
      transaction_hash: '1',
      stake_id: 2,
      community_id,
      timestamp: Math.floor(Date.now() / 1000),
      stake_price: '88',
      stake_direction: 'buy',
      stake_amount: 1,
    });

    await seed('StakeTransaction', {
      transaction_hash: '2',
      stake_id: 2,
      community_id,
      timestamp: 1000,
      stake_price: '10',
      stake_direction: 'buy',
      stake_amount: 1,
    });
    await seed('StakeTransaction', {
      transaction_hash: '3',
      stake_id: 2,
      community_id,
      timestamp: 1,
      stake_price: '99',
      stake_direction: 'buy',
      stake_amount: 1,
    });
  });

  afterAll(async () => {
    await dispose()();
  });

  test('should return undefined if no historical price', async () => {
    const results = await query(GetStakeHistoricalPrice(), {
      actor,
      payload: {
        past_date_epoch: 1,
        community_id: 'non-existing',
        stake_id: 2,
      },
    });
    expect(results).to.deep.equal([]);
  });

  test('should return the historical price', async () => {
    const results = await query(GetStakeHistoricalPrice(), {
      actor,
      payload: {
        past_date_epoch: Math.floor(Date.now() / 1000) - 24 * 60 * 60, // date 24 horus ago
        community_id,
        stake_id: 2,
      },
    });
    expect(results).to.exist;
    expect(results![0]!.old_price).to.equal('88');
  });
});
