import { Actor, command, dispose } from '@hicommonwealth/core';
import { CommunityGoalType, CommunityTierMap } from '@hicommonwealth/shared';
import Chance from 'chance';
import dayjs from 'dayjs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  CreateGroup,
  JoinCommunity,
  UpdateCommunity,
  UpdateCommunityTags,
  UpdateRole,
} from '../../src/aggregates/community';
import { CreateQuest, UpdateQuest } from '../../src/aggregates/quest';
import { CreateCommunityGoalMeta } from '../../src/aggregates/super-admin';
import { CreateThread } from '../../src/aggregates/thread';
import { Xp } from '../../src/aggregates/user';
import { models } from '../../src/database';
import { CommunityGoalsPolicy } from '../../src/policies';
import { seed } from '../../src/tester';
import { drainOutbox, seedCommunity } from '../utils';

const chance = new Chance();

describe('community goals lifecycle', () => {
  let community_id: string;
  let topic_id: number;
  let actor1: Actor, actor2: Actor, actor3: Actor;
  let superadmin: Actor;

  async function createQuest(
    type: CommunityGoalType,
    target: number,
    reward_amount: number,
  ) {
    const meta = await command(CreateCommunityGoalMeta(), {
      actor: superadmin,
      payload: {
        name: type as string,
        description: `reach ${target} ${type}`,
        type,
        target,
      },
    });

    const quest = await command(CreateQuest(), {
      actor: superadmin,
      payload: {
        name: `xp ${type} quest`,
        description: chance.sentence(),
        image_url: 'https://example.com/image.png',
        start_date: dayjs().add(2, 'day').toDate(),
        end_date: dayjs().add(3, 'day').toDate(),
        max_xp_to_end: 100,
        quest_type: 'common',
        community_id,
      },
    });

    await command(UpdateQuest(), {
      actor: superadmin,
      payload: {
        quest_id: quest!.id!,
        action_metas: [
          {
            event_name: 'CommunityGoalReached',
            reward_amount,
            creator_reward_weight: 0,
            content_id: `goal:${meta!.id}`,
          },
        ],
      },
    });

    // hack start date to make it active
    await models.Quest.update(
      { start_date: dayjs().subtract(3, 'day').toDate() },
      { where: { id: quest!.id } },
    );

    return meta!;
  }

  beforeAll(async () => {
    const { community, actors } = await seedCommunity({
      roles: ['admin', 'member', 'rejected', 'superadmin'],
    });
    actor1 = actors.admin;
    actor2 = actors.member;
    actor3 = actors.rejected;
    superadmin = actors.superadmin;

    const [target] = await seed('Community', {
      tier: CommunityTierMap.ChainVerified,
      base: community!.base,
      chain_node_id: community!.chain_node_id!,
      active: true,
      lifetime_thread_count: 0,
      profile_count: 0,
      topics: [{ name: 'goals-test-topic' }],
      Addresses: [
        {
          user_id: superadmin.user.id,
          role: 'admin', // receiving xp
        },
      ],
    });
    community_id = target!.id;
    topic_id = community!.topics!.at(0)!.id!;
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
  });

  afterAll(async () => {
    await dispose()();
  });

  it('should reach members goal', async () => {
    const meta = await createQuest('members', 3, 10);

    await command(JoinCommunity(), {
      actor: actor1,
      payload: { community_id },
    });
    await command(JoinCommunity(), {
      actor: actor2,
      payload: { community_id },
    });
    await drainOutbox(['CommunityJoined'], CommunityGoalsPolicy);

    const goal = await models.CommunityGoalReached.findOne({
      where: { community_id, community_goal_meta_id: meta.id },
    });
    expect(goal?.reached_at).toBeNull();

    // one more user reaches the goal
    await command(JoinCommunity(), {
      actor: actor3,
      payload: { community_id },
    });
    await drainOutbox(['CommunityJoined'], CommunityGoalsPolicy);

    const goal2 = await models.CommunityGoalReached.findOne({
      where: { community_id, community_goal_meta_id: meta.id },
    });
    expect(goal2?.reached_at).toBeTruthy();

    const e = await drainOutbox(['CommunityGoalReached'], Xp);
    expect(e.length).toBe(1);

    const xp = await models.XpLog.findOne({
      where: { user_id: superadmin.user.id! },
    });
    expect(xp?.xp_points).toBe(10);
  });

  it('should reach threads goal', async () => {
    const meta = await createQuest('threads', 3, 20);

    await command(CreateThread(), {
      actor: actor1,
      payload: {
        community_id,
        topic_id,
        kind: 'discussion',
        read_only: false,
        stage: '',
        title: chance.name(),
        body: chance.name(),
      },
    });
    await command(CreateThread(), {
      actor: actor2,
      payload: {
        community_id,
        topic_id,
        kind: 'discussion',
        read_only: false,
        stage: '',
        title: chance.name(),
        body: chance.name(),
      },
    });
    await drainOutbox(['ThreadCreated'], CommunityGoalsPolicy);

    const goal = await models.CommunityGoalReached.findOne({
      where: { community_id, community_goal_meta_id: meta.id },
    });
    expect(goal?.reached_at).toBeNull();

    // create one more thread to reach the goal
    await command(CreateThread(), {
      actor: actor3,
      payload: {
        community_id,
        topic_id,
        kind: 'discussion',
        read_only: false,
        stage: '',
        title: chance.name(),
        body: chance.name(),
      },
    });
    await drainOutbox(['ThreadCreated'], CommunityGoalsPolicy);

    const goal2 = await models.CommunityGoalReached.findOne({
      where: { community_id, community_goal_meta_id: meta.id },
    });
    expect(goal2?.reached_at).toBeTruthy();

    const e = await drainOutbox(['CommunityGoalReached'], Xp);
    expect(e.length).toBe(2); // two goals now

    const user = await models.User.findOne({
      where: { id: superadmin.user.id! },
    });
    expect(user?.xp_points).toBe(30); // from 10 + 20
  });

  it('should reach groups goal', async () => {
    const meta = await createQuest('groups', 3, 30);

    await command(CreateGroup(), {
      actor: superadmin,
      payload: {
        community_id,
        topics: [],
        metadata: {
          name: chance.name(),
          description: chance.sentence(),
        },
        requirements: [],
      },
    });
    await command(CreateGroup(), {
      actor: superadmin,
      payload: {
        community_id,
        topics: [],
        metadata: {
          name: chance.name(),
          description: chance.sentence(),
        },
        requirements: [],
      },
    });
    await drainOutbox(['GroupCreated'], CommunityGoalsPolicy);

    const goal = await models.CommunityGoalReached.findOne({
      where: { community_id, community_goal_meta_id: meta.id },
    });
    expect(goal?.reached_at).toBeNull();

    // create one more group to reach the goal
    await command(CreateGroup(), {
      actor: superadmin,
      payload: {
        community_id,
        topics: [],
        metadata: {
          name: chance.name(),
          description: chance.sentence(),
        },
        requirements: [],
      },
    });
    await drainOutbox(['GroupCreated'], CommunityGoalsPolicy);

    const goal2 = await models.CommunityGoalReached.findOne({
      where: { community_id, community_goal_meta_id: meta.id },
    });
    expect(goal2?.reached_at).toBeTruthy();

    const e = await drainOutbox(['CommunityGoalReached'], Xp);
    expect(e.length).toBe(3); // three goals now

    const user = await models.User.findOne({
      where: { id: superadmin.user.id! },
    });
    expect(user?.xp_points).toBe(60); // from 10 + 20 + 30
  });

  it('should reach social links goal', async () => {
    const meta = await createQuest('social-links', 3, 1);

    // create one more group to reach the goal
    await command(UpdateCommunity(), {
      actor: superadmin,
      payload: {
        community_id,
        social_links: [
          'http://hicommonwealth.io',
          'http://hicommonwealth.io/discord',
          'http://hicommonwealth.io/twitter',
        ],
      },
    });
    await drainOutbox(['CommunityUpdated'], CommunityGoalsPolicy);

    const goal = await models.CommunityGoalReached.findOne({
      where: { community_id, community_goal_meta_id: meta.id },
    });
    expect(goal?.reached_at).toBeTruthy();

    const e = await drainOutbox(['CommunityGoalReached'], Xp);
    expect(e.length).toBe(4); // four goals now

    const user = await models.User.findOne({
      where: { id: superadmin.user.id! },
    });
    expect(user?.xp_points).toBe(61); // from 10 + 20 + 30 + 1
  });

  it('should reach moderators goal', async () => {
    const meta = await createQuest('moderators', 2, 3);

    // add two moderators to reach goal
    await command(UpdateRole(), {
      actor: superadmin,
      payload: {
        community_id,
        address: actor1.address!,
        role: 'moderator',
      },
    });
    await command(UpdateRole(), {
      actor: superadmin,
      payload: {
        community_id,
        address: actor2.address!,
        role: 'moderator',
      },
    });
    await drainOutbox(['RoleUpdated'], CommunityGoalsPolicy);

    const goal = await models.CommunityGoalReached.findOne({
      where: { community_id, community_goal_meta_id: meta.id },
    });
    expect(goal?.reached_at).toBeTruthy();

    const e = await drainOutbox(['CommunityGoalReached'], Xp);
    expect(e.length).toBe(5); // five goals now

    const user = await models.User.findOne({
      where: { id: superadmin.user.id! },
    });
    expect(user?.xp_points).toBe(64); // from 10 + 20 + 30 + 1 + 3
  });

  it('should reach tags goal', async () => {
    const meta = await createQuest('tags', 2, 4);

    const [tag1] = await seed('Tags');
    const [tag2] = await seed('Tags');

    // add two tags to reach goal
    const result = await command(UpdateCommunityTags(), {
      actor: superadmin,
      payload: {
        community_id,
        tag_ids: [tag1!.id!, tag2!.id!],
      },
    });
    expect(result).toEqual({
      community_id,
      tags: [
        {
          id: tag1!.id!,
          name: tag1!.name,
          created_at: result!.tags[0].created_at,
          updated_at: result!.tags[0].updated_at,
        },
        {
          id: tag2!.id!,
          name: tag2!.name,
          created_at: result!.tags[1].created_at,
          updated_at: result!.tags[1].updated_at,
        },
      ],
    });

    await drainOutbox(['CommunityTagsUpdated'], CommunityGoalsPolicy);

    const goal = await models.CommunityGoalReached.findOne({
      where: { community_id, community_goal_meta_id: meta.id },
    });
    expect(goal?.reached_at).toBeTruthy();

    const e = await drainOutbox(['CommunityGoalReached'], Xp);
    expect(e.length).toBe(6); // six goals now

    const user = await models.User.findOne({
      where: { id: superadmin.user.id! },
    });
    expect(user?.xp_points).toBe(68); // from 10 + 20 + 30 + 1 + 3 + 4
  });
});
