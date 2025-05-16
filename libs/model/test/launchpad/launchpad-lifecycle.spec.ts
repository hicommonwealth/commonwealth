import { Actor, command, dispose } from '@hicommonwealth/core';
import * as protocols from '@hicommonwealth/evm-protocols';
import { config, equalEvmAddresses } from '@hicommonwealth/model';
import { BalanceType, CommunityTierMap } from '@hicommonwealth/shared';
import { seed } from 'model/src/tester';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { ChainNodeAttributes } from '../../src';
import { CreateLaunchpadTrade, CreateToken } from '../../src/aggregates/token';

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
      eth_chain_id: protocols.commonProtocol.ValidChains.SepoliaBase,
      balance_type: BalanceType.Ethereum,
    })) as ChainNodeAttributes[];

    const [user] = await seed('User', {
      isAdmin: true,
    });

    const [community] = await seed('Community', {
      tier: CommunityTierMap.ChainVerified,
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

    vi.spyOn(protocols, 'getLaunchpadTokenDetails').mockResolvedValue({
      name: 'Test Token',
      symbol: 'DMLND',
      created_at: new Date(),
      creator_address: actor.address!,
      namespace: community!.namespace!,
      token_address: TOKEN_ADDRESS,
      launchpad_liquidity: '594115082271506067334',
      curve_id: '1',
      total_supply: '1000',
      reserve_ration: '1',
      initial_purchase_eth_amount: '1',
    });
  });

  afterAll(async () => {
    vi.restoreAllMocks();
    await dispose()();
  });

  test('Create Token works given txHash and chainNodeId', async () => {
    const results = await command(CreateToken(), {
      actor,
      payload: {
        transaction_hash: CREATE_TOKEN_TXN_HASH,
        eth_chain_id: node.eth_chain_id!,
        description: 'test',
        icon_url: 'test',
        community_id: community_id!,
      },
    });

    expect(equalEvmAddresses(results?.token_address, TOKEN_ADDRESS)).to.be.true;
    expect(results?.symbol).to.equal('DMLND');
    expect(results?.creator_address).to.equal(actor.address);
  });

  test('Get a launchpad trade txn and project it', async () => {
    const payload = {
      transaction_hash: TRADE_TOKEN_TXN_HASH,
      eth_chain_id: protocols.commonProtocol.ValidChains.SepoliaBase,
    };
    const results = await command(CreateLaunchpadTrade(), {
      actor,
      payload,
    });
    expect(results).to.deep.equal({
      eth_chain_id: protocols.commonProtocol.ValidChains.SepoliaBase,
      transaction_hash: TRADE_TOKEN_TXN_HASH,
      token_address: TOKEN_ADDRESS.toLowerCase(),
      trader_address: '0x2ce1f5d4f84b583ab320cac0948adde52a131fbe',
      is_buy: true,
      community_token_amount: '534115082271506067334',
      price: 3.98859030778e-7,
      floating_supply: '535115082271506067334',
      timestamp: 1731523956,
    });
  });
});
