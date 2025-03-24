import { Actor, command, dispose } from '@hicommonwealth/core';
import { CommunityGoalType } from '@hicommonwealth/shared';
import Chance from 'chance';
import moment from 'moment';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  CreateGroup,
  JoinCommunity,
  UpdateCommunity,
  UpdateRole,
} from '../../src/aggregates/community';
import { CreateQuest, UpdateQuest } from '../../src/aggregates/quest';
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
    const meta = await models.CommunityGoalMeta.create({
      name: type as string,
      description: `reach ${target} ${type}`,
      type,
      target,
    });

    const quest = await command(CreateQuest(), {
      actor: superadmin,
      payload: {
        name: `xp ${type} quest`,
        description: chance.sentence(),
        image_url: chance.url(),
        start_date: moment().add(2, 'day').toDate(),
        end_date: moment().add(3, 'day').toDate(),
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
            content_id: `goal:${meta.id}`,
          },
        ],
      },
    });

    // hack start date to make it active
    await models.Quest.update(
      { start_date: moment().subtract(3, 'day').toDate() },
      { where: { id: quest!.id } },
    );

    return meta;
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
      base: community!.base,
      chain_node_id: community!.chain_node_id!,
      active: true,
      lifetime_thread_count: 0,
      profile_count: 0,
      topics: [{}],
      Addresses: [
        {
          user_id: superadmin.user.id,
          role: 'admin', // receiving xp
        },
      ],
    });
    community_id = target!.id;
    topic_id = community!.topics!.at(0)!.id!;
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
});
