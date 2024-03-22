import { BalanceType, command, dispose } from '@hicommonwealth/core';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { CreateStakeTransaction } from '../../src/community/CreateStakeTransaction.command';
import { seed } from '../../src/test/index';

chai.use(chaiAsPromised);

describe('Stake transactions', () => {
  let payload;

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

    payload = {
      transaction_hashes: [
        '0x924f40cfea663b2579816173f048b61ab2b118e0c7c055d7b00dbd9cd15eb7c0',
        '0xa888cc839e3ba03f689b0c2e88dd4205a82fa8894c2a8098679277b96c24fd4f',
      ],
      community_id: community!.id!,
    };
  });

  after(async () => {
    await dispose()();
  });

  it('should create stake transactions', async () => {
    const results = await command(CreateStakeTransaction(), {
      payload,
    });
    // This address comes from the actual crypto transaction
    expect(results[0].address).to.equal(
      '0xf6885b5aC5AE36689038dAf30184AeEB266E61f5',
    );
    expect(results[0].stake_direction).to.equal('buy');
    expect(results[1].address).to.equal(
      '0xf6885b5aC5AE36689038dAf30184AeEB266E61f5',
    );
    expect(results[1].stake_direction).to.equal('sell');
  }).timeout(10000); // increase timeout because crypto calls take a while
});
