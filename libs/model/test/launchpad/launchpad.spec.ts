import { Actor, command, dispose } from '@hicommonwealth/core';
import { BalanceType, commonProtocol } from '@hicommonwealth/shared';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { bootstrap_testing, seed } from 'model/src/tester';
import { afterAll, beforeAll, describe, test } from 'vitest';
import { CreateToken } from '../../src/token';

chai.use(chaiAsPromised);

describe('Launchpad', () => {
  let actor: Actor;
  let payload;
  let community_id: string;
  // @ts-ignore
  let node;

  beforeAll(async () => {
    await bootstrap_testing(true);
    [node] = await seed('ChainNode', {
      url: 'https://base-sepolia-rpc.publicnode.com',
      private_url: 'https://base-sepolia-rpc.publicnode.com',
      name: 'Base Sepolia Testnet',
      eth_chain_id: commonProtocol.ValidChains.SepoliaBase,
      balance_type: BalanceType.Ethereum,
    });

    const [user] = await seed('User', {
      isAdmin: true,
    });

    const [community] = await seed('Community', {
      namespace: 'testtest',
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
    { timeout: 10_0000000 },
    async () => {
      payload = {
        transaction_hash:
          '0x82802acbf566bf2f1c9ca7b2469810ac7017afc262ff60fe602ab3768ddb186d',
        // @ts-ignore
        chain_node_id: node?.id,
        description: 'test',
        icon_url: 'test',
        community_id,
      };

      let results = await command(CreateToken(), {
        actor,
        payload,
      });

      expect(results?.token_address).to.equal(
        '0x6893cfa091ddb564cf739ba3bfd08fa9d69f0061',
      );
      expect(results?.symbol).to.equal('ewrw');
      expect(results?.namespace).to.equal('fill this out when fixed');
    },
  );
});
