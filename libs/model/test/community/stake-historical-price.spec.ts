import { BalanceType, dispose, query } from '@hicommonwealth/core';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { GetStakeHistoricalPrice } from '../../src/community/GetStakeHistoricalPrice.query';
import { seed } from '../../src/tester/index';

chai.use(chaiAsPromised);

describe('Stake Historical Price', () => {
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
          stake_weight: 1,
          vote_weight: 1,
          stake_enabled: true,
        },
      ],
      topics: [],
      groups: [],
      discord_config_id: null,
    });

    community_id = community!.id!;

    await seed('StakeTransaction', {
      transaction_hash: '1',
      stake_id: 2,
      community_id,
      timestamp: Math.floor(Date.now() / 1000),
      stake_price: 88,
      stake_direction: 'buy',
      stake_amount: 1,
    });

    await seed('StakeTransaction', {
      transaction_hash: '2',
      stake_id: 2,
      community_id,
      timestamp: 1000,
      stake_price: 10,
      stake_direction: 'buy',
      stake_amount: 1,
    });
    await seed('StakeTransaction', {
      transaction_hash: '3',
      stake_id: 2,
      community_id,
      timestamp: 1,
      stake_price: 99,
      stake_direction: 'buy',
      stake_amount: 1,
    });
  });

  after(async () => {
    await dispose()();
  });

  it('should return undefined if no historical price', async () => {
    const results = await query(GetStakeHistoricalPrice(), {
      payload: { past_date_epoch: 1, community_id: 'non-existing' },
    });
    expect(results).to.deep.equal([]);
  });

  it('should return the historical price', async () => {
    const results = await query(GetStakeHistoricalPrice(), {
      payload: {
        past_date_epoch: Math.floor(Date.now() / 1000) - 24 * 60 * 60, // date 24 horus ago
        community_id,
      },
    });
    expect(results[0].old_price).to.equal('88');
  });
});
