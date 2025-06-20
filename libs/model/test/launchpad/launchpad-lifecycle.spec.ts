import { Actor, command, dispose, query } from '@hicommonwealth/core';
import * as protocols from '@hicommonwealth/evm-protocols';
import { BalanceType } from '@hicommonwealth/shared';
import Chance from 'chance';
import dayjs from 'dayjs';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { config, emitEvent, equalEvmAddresses } from '../../src';
import { CreateQuest, UpdateQuest } from '../../src/aggregates/quest';
import { CreateLaunchpadTrade, CreateToken } from '../../src/aggregates/token';
import { GetXps, Xp } from '../../src/aggregates/user';
import { models } from '../../src/database';
import { drainOutbox, seedCommunity } from '../utils';

const chance = new Chance();

const CREATE_TOKEN_TXN_HASH =
  '0x735a6ec2a5d1b71634e74183f2436f4b76855e613e97fc008f2df486d9eb73db';
const TRADE_TOKEN_TXN_HASH =
  '0xf516b28f2baba449b2776c190580200320165f5436a94f5f2dc35500a3001aee';
const TOKEN_ADDRESS = '0x656a7C7429a7Ef95f55A1c1F4cc0D5D0B9E11b87';
const TRADER_ADDRESS = '0x2ce1f5d4f84b583ab320cac0948adde52a131fbe';
const AMOUNT1 = 12 * 10 ** 18;
const AMOUNT2 = 5 * 10 ** 18;

describe('Launchpad Lifecycle', () => {
  let actor: Actor;
  let community_id: string;
  let eth_chain_id: number;

  beforeAll(async () => {
    const { community, actors, node } = await seedCommunity({
      roles: ['superadmin', 'admin'],
      chain_node: {
        url: `https://base-sepolia.g.alchemy.com/v2/${config.ALCHEMY.APP_KEYS.PUBLIC}`,
        private_url: `https://base-sepolia.g.alchemy.com/v2/${config.ALCHEMY.APP_KEYS.PUBLIC}`,
        name: 'Base Sepolia Testnet',
        eth_chain_id: protocols.commonProtocol.ValidChains.SepoliaBase,
        balance_type: BalanceType.Ethereum,
      },
      namespace: 'DogeMoonLanding',
      override_addresses: ['', TRADER_ADDRESS],
    });

    actor = actors.admin;
    community_id = community!.id!;
    eth_chain_id = node!.eth_chain_id!;

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

    // create a quest with launchpad action metas
    // setup quest
    const quest = await command(CreateQuest(), {
      actor: actors.superadmin,
      payload: {
        name: 'launchpad quest',
        description: chance.sentence(),
        image_url: chance.url(),
        start_date: dayjs().add(2, 'day').toDate(),
        end_date: dayjs().add(3, 'day').toDate(),
        max_xp_to_end: 100,
        quest_type: 'common',
      },
    });
    // setup quest actions
    await command(UpdateQuest(), {
      actor: actors.superadmin,
      payload: {
        quest_id: quest!.id!,
        action_metas: [
          {
            event_name: 'LaunchpadTokenRecordCreated',
            reward_amount: 10,
            creator_reward_weight: 0,
          },
          {
            event_name: 'LaunchpadTokenTraded',
            reward_amount: 0,
            creator_reward_weight: 0,
            amount_multiplier: 10,
            content_id: 'threshold:10',
          },
        ],
      },
    });
    // hack start date to make it active
    await models.Quest.update(
      { start_date: dayjs().subtract(3, 'day').toDate() },
      { where: { id: quest!.id } },
    );
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
        eth_chain_id,
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
      trader_address: TRADER_ADDRESS,
      is_buy: true,
      community_token_amount: '534115082271506067334',
      price: 3.98859030778e-7,
      floating_supply: '535115082271506067334',
      timestamp: 1731523956,
    });

    // simulate CE worker that emits LaunchpadTokenTraded event
    await emitEvent(models.Outbox, [
      {
        event_name: 'LaunchpadTokenTraded',
        event_payload: {
          eth_chain_id,
          transaction_hash: TRADE_TOKEN_TXN_HASH,
          is_buy: true,
          token_address: results!.token_address as `0x${string}`,
          trader_address: results!.trader_address as `0x${string}`,
          // @ts-ignore - this is a mock
          community_token_amount: results!.community_token_amount,
          // @ts-ignore - this is a mock
          floating_supply: results!.floating_supply,
          // @ts-ignore - this is a mock
          eth_amount: AMOUNT1,
          // @ts-ignore - this is a mock
          block_timestamp: Math.floor(new Date().getTime() / 1000),
        },
      },
    ]);

    // should have projected launchpad events
    // drain the outbox
    const events = await drainOutbox(
      ['LaunchpadTokenRecordCreated', 'LaunchpadTokenTraded'],
      Xp,
    );
    expect(events.length).to.equal(2);

    // validate projection
    const xps = await query(GetXps(), {
      actor,
      payload: { user_id: actor.user.id },
    });
    expect(xps?.length).to.equal(2);
    expect(xps!.at(0)!.event_name === 'LaunchpadTokenTraded');
    expect(xps!.at(0)!.xp_points).to.equal(120); // 12 * 10
    expect(xps!.at(1)!.event_name === 'LaunchpadTokenRecordCreated');
    expect(xps!.at(1)!.xp_points).to.equal(10);
    // TODO: add another trade below threshold
  });
});
