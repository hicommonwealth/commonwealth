import { Actor, command, dispose } from '@hicommonwealth/core';
import { commonProtocol } from '@hicommonwealth/evm-protocols';
import { config, equalEvmAddresses } from '@hicommonwealth/model';
import { BalanceType } from '@hicommonwealth/shared';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { seed } from 'model/src/tester';
import { afterAll, beforeAll, describe, test } from 'vitest';
import { ChainNodeAttributes } from '../../src';
import { CreateLaunchpadToken, CreateLaunchpadTrade } from '../../src/token';

chai.use(chaiAsPromised);

const CREATE_TOKEN_TXN_HASH =
  '0x735a6ec2a5d1b71634e74183f2436f4b76855e613e97fc008f2df486d9eb73db';
const TRADE_TOKEN_TXN_HASH =
  '0xf516b28f2baba449b2776c190580200320165f5436a94f5f2dc35500a3001aee';
const TOKEN_ADDRESS = '0x656a7C7429a7Ef95f55A1c1F4cc0D5D0B9E11b87';

describe('Launchpad Lifecycle', () => {
  let actor: Actor;
  let community_id: string;
  let node: ChainNodeAttributes;

  beforeAll(async () => {
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
      namespace: 'DogeMoonLanding',
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

  test('Create Token works given txHash and chainNodeId', async () => {
    const payload = {
      transaction_hash: CREATE_TOKEN_TXN_HASH,
      chain_node_id: node!.id!,
      description: 'test',
      icon_url: 'test',
      community_id: community_id!,
    };

    const results = await command(CreateLaunchpadToken(), {
      actor,
      payload,
    });

    expect(equalEvmAddresses(results?.token_address, TOKEN_ADDRESS)).to.be.true;
    expect(results?.symbol).to.equal('DMLND');
  });

  test('Get a launchpad trade txn and project it', async () => {
    const payload = {
      transaction_hash: TRADE_TOKEN_TXN_HASH,
      eth_chain_id: commonProtocol.ValidChains.SepoliaBase,
    };
    const results = await command(CreateLaunchpadTrade(), {
      actor,
      payload,
    });
    expect(results).to.deep.equal({
      eth_chain_id: commonProtocol.ValidChains.SepoliaBase,
      transaction_hash: TRADE_TOKEN_TXN_HASH,
      token_address: TOKEN_ADDRESS.toLowerCase(),
      trader_address: '0x2cE1F5d4f84B583Ab320cAc0948AddE52a131FBE',
      is_buy: true,
      community_token_amount: '534115082271506067334',
      price: 3.98859030778e-7,
      floating_supply: '535115082271506067334',
      timestamp: 1731523956,
    });
  });
});
