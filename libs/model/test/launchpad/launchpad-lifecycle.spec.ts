import { Actor, command, dispose, query } from '@hicommonwealth/core';
import * as protocols from '@hicommonwealth/evm-protocols';
import * as schemas from '@hicommonwealth/schemas';
import { BalanceType } from '@hicommonwealth/shared';
import Chance from 'chance';
import dayjs from 'dayjs';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import z from 'zod';
import { CreateQuest, UpdateQuest } from '../../src/aggregates/quest';
import { CreateLaunchpadTrade, CreateToken } from '../../src/aggregates/token';
import { GetXps, Xp } from '../../src/aggregates/user';
import { config } from '../../src/config';
import { models } from '../../src/database';
import { emitEvent, equalEvmAddresses } from '../../src/utils';
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
    await models.sequelize.query(`
      CREATE OR REPLACE FUNCTION create_quest_xp_leaderboard(quest_id_param INTEGER, tier_param INTEGER)
          RETURNS VOID
          LANGUAGE plpgsql
        AS $$
        DECLARE
            view_name TEXT;
            user_index_name TEXT;
            rank_index_name TEXT;
            create_view_sql TEXT;
            create_user_index_sql TEXT;
            create_rank_index_sql TEXT;
        BEGIN
            -- Generate dynamic names
            view_name := 'quest_' || quest_id_param || '_xp_leaderboard';
            user_index_name := 'quest_' || quest_id_param || '_xp_leaderboard_user_id';
            rank_index_name := 'quest_' || quest_id_param || '_xp_leaderboard_rank';
        
            -- Drop existing view if it exists
            EXECUTE 'DROP MATERIALIZED VIEW IF EXISTS "' || view_name || '" CASCADE';
        
            -- Build the CREATE MATERIALIZED VIEW statement
            create_view_sql := '
                CREATE MATERIALIZED VIEW "' || view_name || '" AS
                WITH user_xp_combined AS (
                    SELECT
                        l.user_id as user_id,
                        COALESCE(l.xp_points, 0) as xp_points,
                        0 as creator_xp_points,
                        0 as referrer_xp_points
                    FROM "XpLogs" l
                             JOIN "QuestActionMetas" m ON l.action_meta_id = m.id
                             JOIN "Quests" q ON m.quest_id = q.id
                    WHERE l.user_id IS NOT NULL AND q.id = ' || quest_id_param || '
        
                    UNION ALL
        
                    SELECT
                        l.creator_user_id as user_id,
                        0 as xp_points,
                        COALESCE(l.creator_xp_points, 0) as creator_xp_points,
                        0 as referrer_xp_points
                    FROM "XpLogs" l
                             JOIN "QuestActionMetas" m ON l.action_meta_id = m.id
                             JOIN "Quests" q ON m.quest_id = q.id
                    WHERE l.creator_user_id IS NOT NULL AND q.id = ' || quest_id_param || '
        
                    UNION ALL
        
                    SELECT
                        l.referrer_user_id as user_id,
                        0 as xp_points,
                        0 as creator_xp_points,
                        COALESCE(l.referrer_xp_points, 0) as referrer_xp_points
                    FROM "XpLogs" l
                             JOIN "QuestActionMetas" m ON l.action_meta_id = m.id
                             JOIN "Quests" q ON m.quest_id = q.id
                    WHERE l.referrer_user_id IS NOT NULL AND q.id = ' || quest_id_param || '
                ),
                aggregated_xp AS (
                    SELECT
                        user_id,
                        SUM(xp_points)::int as total_user_xp,
                        SUM(creator_xp_points)::int as total_creator_xp,
                        SUM(referrer_xp_points)::int as total_referrer_xp
                    FROM user_xp_combined
                    GROUP BY user_id
                )
                SELECT
                    a.user_id,
                    (a.total_user_xp + a.total_creator_xp + a.total_referrer_xp) as xp_points,
                    u.tier,
                    ROW_NUMBER() OVER (ORDER BY (a.total_user_xp + a.total_creator_xp + a.total_referrer_xp) DESC, a.user_id ASC)::int as rank
                FROM aggregated_xp a
                         JOIN "Users" u ON a.user_id = u.id
                WHERE u.tier > ' || tier_param;
        
            -- Execute the CREATE MATERIALIZED VIEW
            EXECUTE create_view_sql;
        
            -- Create indexes
            create_user_index_sql := '
                CREATE UNIQUE INDEX "' || user_index_name || '"
                ON "' || view_name || '" (user_id)';
        
            create_rank_index_sql := '
                CREATE INDEX "' || rank_index_name || '"
                ON "' || view_name || '" (rank DESC)';
        
            EXECUTE create_user_index_sql;
            EXECUTE create_rank_index_sql;
        
            RAISE NOTICE 'Created materialized view: %', view_name;
        END;
        $$;
    `);
    const { community, actors, node } = await seedCommunity({
      roles: ['superadmin', 'admin'],
      chain_node: {
        url: `https://base-sepolia.g.alchemy.com/v2/${config.ALCHEMY.APP_KEYS.PUBLIC}`,
        private_url: `https://base-sepolia.g.alchemy.com/v2/${config.ALCHEMY.APP_KEYS.PUBLIC}`,
        name: 'Base Sepolia Testnet',
        eth_chain_id: protocols.ValidChains.SepoliaBase,
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
        image_url: 'https://example.com/image.png',
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
        icon_url: 'https://example.com/icon.png',
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
      eth_chain_id: protocols.ValidChains.SepoliaBase,
    };
    const results = await command(CreateLaunchpadTrade(), {
      actor,
      payload,
    });
    expect(results).to.deep.equal({
      eth_chain_id: protocols.ValidChains.SepoliaBase,
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
          community_token_amount: results!.community_token_amount,
          floating_supply: results!.floating_supply,
          eth_amount: AMOUNT1,
          block_timestamp: Math.floor(new Date().getTime() / 1000),
        } as unknown as z.infer<schemas.OutboxSchemas['LaunchpadTokenTraded']>,
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
