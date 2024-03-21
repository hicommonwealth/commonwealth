import { Actor, command, dispose } from '@hicommonwealth/core';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Chance } from 'chance';
import { CreateStakeTransaction } from '../../src/community/CreateStakeTransaction.command';

chai.use(chaiAsPromised);
const chance = Chance();

describe('Stake transactions', () => {
  let id;
  let actor: Actor;

  let payload;

  before(async () => {
    // const [node] = await seed(
    //   'ChainNode',
    //   {
    //     url: 'https://ethereum-sepolia.publicnode.com',
    //     name: 'Sepolia Testnet',
    //     eth_chain_id: 11155111,
    //     balance_type: BalanceType.Ethereum,
    //     contracts: [],
    //   },
    //   // { mock: true, log: true },
    // );
    // const [user] = await seed(
    //   'User',
    //   { isAdmin: true },
    //   // { mock: true, log: true },
    // );
    // const [community] = await seed(
    //   'Community',
    //   {
    //     id: 'qaa',
    //     chain_node_id: node?.id,
    //     Addresses: [
    //       {
    //         role: 'admin',
    //         user_id: user!.id,
    //         address: '0xf6885b5aC5AE36689038dAf30184AeEB266E61f5',
    //         profile_id: undefined,
    //       },
    //     ],
    //     CommunityStakes: [],
    //     topics: [],
    //     groups: [],
    //   },
    //   // { mock: true, log: true },
    // );
    //
    // id = community!.id!;
    // actor = {
    //   user: { id: user!.id!, email: user!.email! },
    //   address_id: community!.Addresses!.at(0)!.address!,
    // };
    payload = {
      transaction_hash:
        '0x924f40cfea663b2579816173f048b61ab2b118e0c7c055d7b00dbd9cd15eb7c0',
      community_id: 'qaa',
    };
  });

  after(async () => {
    await dispose()();
  });

  it('should create stake transaction', async () => {
    const results = await command(CreateStakeTransaction(), {
      id,
      actor,
      payload,
    });
    expect(results?.address).to.includes(actor.address_id);
  });
});
