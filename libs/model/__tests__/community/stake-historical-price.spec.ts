import { BalanceType, dispose, query } from '@hicommonwealth/core';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { GetStakeHistoricalPrice } from '../../src/community/GetStakeHistoricalPrice.query';
import { seed } from '../../src/test';

chai.use(chaiAsPromised);

describe('Stake Historical Price', () => {
  let community_id;

  before(async () => {
    const [node] = await seed(
      'ChainNode',
      {
        url: 'https://ethereum-sepolia.publicnode.com',
        name: 'Sepolia Testnet',
        eth_chain_id: 11155111,
        balance_type: BalanceType.Ethereum,
        contracts: [],
      },
      // { mock: true, log: true },
    );

    const [user] = await seed(
      'User',
      { isAdmin: true, selected_community_id: null },
      // { mock: true, log: true },
    );
    const [community] = await seed(
      'Community',
      {
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
      },
      // { mock: true, log: true },
    );

    community_id = community!.id!;

    const [transaction1] = await seed(
      'StakeTransaction',
      {
        transaction_hash: '1',
        stake_id: 2,
        community_id,
        timestamp: Date.now(),
        stake_price: 88,
        stake_amount: 1,
      },
      // { mock: true, log: true },
    );

    const [transaction2] = await seed(
      'StakeTransaction',
      {
        transaction_hash: '2',
        stake_id: 2,
        community_id,
        timestamp: 1000,
        stake_price: 10,
        stake_amount: 1,
      },
      // { mock: true, log: true },
    );
    const [transaction3] = await seed(
      'StakeTransaction',
      {
        transaction_hash: '3',
        stake_id: 2,
        community_id,
        timestamp: 1,
        stake_price: 99,
        stake_amount: 1,
      },
      // { mock: true, log: true },
    );
  });

  after(async () => {
    await dispose()();
  });

  it('should return undefined if no historical price', async () => {
    const results = await query(GetStakeHistoricalPrice(), {
      payload: { past_date_epoch: 1, community_id: 'non-existing' },
    });
    expect(results?.old_price).to.equal(undefined);
  });

  it('should return the historical price', async () => {
    const results = await query(GetStakeHistoricalPrice(), {
      payload: {
        past_date_epoch: (Date.now() - 24 * 60 * 60 * 1000) / 1000, // date 24 horus ago
        community_id,
      },
    });
    expect(results?.old_price).to.equal('10');
  });
});
