import { Actor, command, dispose } from '@hicommonwealth/core';
import Chance from 'chance';
import moment from 'moment';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CreateGroup, JoinCommunity } from '../../src/aggregates/community';
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
    const meta = await models.CommunityGoalMeta.create({
      name: 'members goal',
      description: 'reach 3 members',
      type: 'members',
      target: 3,
    });

    // setup community quest with goal
    const quest = await command(CreateQuest(), {
      actor: superadmin,
      payload: {
        name: 'xp members goal quest',
        description: chance.sentence(),
        image_url: chance.url(),
        start_date: moment().add(2, 'day').toDate(),
        end_date: moment().add(3, 'day').toDate(),
        max_xp_to_end: 100,
        quest_type: 'common',
        community_id,
      },
    });
    // setup quest actions
    await command(UpdateQuest(), {
      actor: superadmin,
      payload: {
        quest_id: quest!.id!,
        action_metas: [
          {
            event_name: 'CommunityGoalReached',
            reward_amount: 10,
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

    // join first two users
    await command(JoinCommunity(), {
      actor: actor1,
      payload: { community_id },
    });
    await command(JoinCommunity(), {
      actor: actor2,
      payload: { community_id },
    });
    await drainOutbox(['CommunityJoined'], CommunityGoalsPolicy);
    // check goals
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

    // check goals
    const goal2 = await models.CommunityGoalReached.findOne({
      where: { community_id, community_goal_meta_id: meta.id },
    });
    expect(goal2?.reached_at).toBeTruthy();

    const e = await drainOutbox(['CommunityGoalReached'], Xp);
    expect(e.length).toBe(1);

    // check xp awarded
    const xp = await models.XpLog.findOne({
      where: { user_id: superadmin.user.id! },
    });
    expect(xp?.xp_points).toBe(10);
  });

  it('should reach threads goal', async () => {
    const meta = await models.CommunityGoalMeta.create({
      name: 'threads goal',
      description: 'reach 3 threads',
      type: 'threads',
      target: 3,
    });

    // setup community quest with goal
    const quest = await command(CreateQuest(), {
      actor: superadmin,
      payload: {
        name: 'xp threads goal quest',
        description: chance.sentence(),
        image_url: chance.url(),
        start_date: moment().add(2, 'day').toDate(),
        end_date: moment().add(3, 'day').toDate(),
        max_xp_to_end: 100,
        quest_type: 'common',
        community_id,
      },
    });
    // setup quest actions
    await command(UpdateQuest(), {
      actor: superadmin,
      payload: {
        quest_id: quest!.id!,
        action_metas: [
          {
            event_name: 'CommunityGoalReached',
            reward_amount: 20,
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

    // create two threads
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
    // check goals
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

    // check goals
    const goal2 = await models.CommunityGoalReached.findOne({
      where: { community_id, community_goal_meta_id: meta.id },
    });
    expect(goal2?.reached_at).toBeTruthy();

    const e = await drainOutbox(['CommunityGoalReached'], Xp);
    expect(e.length).toBe(2); // two goals now

    // check xp awarded
    const user = await models.User.findOne({
      where: { id: superadmin.user.id! },
    });
    expect(user?.xp_points).toBe(30); // from 10 + 20
  });

  it('should reach groups goal', async () => {
    const meta = await models.CommunityGoalMeta.create({
      name: 'threads goal',
      description: 'reach 3 groups',
      type: 'groups',
      target: 3,
    });

    // setup community quest with goal
    const quest = await command(CreateQuest(), {
      actor: superadmin,
      payload: {
        name: 'xp groups goal quest',
        description: chance.sentence(),
        image_url: chance.url(),
        start_date: moment().add(2, 'day').toDate(),
        end_date: moment().add(3, 'day').toDate(),
        max_xp_to_end: 100,
        quest_type: 'common',
        community_id,
      },
    });
    // setup quest actions
    await command(UpdateQuest(), {
      actor: superadmin,
      payload: {
        quest_id: quest!.id!,
        action_metas: [
          {
            event_name: 'CommunityGoalReached',
            reward_amount: 30,
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

    // create two threads
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
    // check goals
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

    // check goals
    const goal2 = await models.CommunityGoalReached.findOne({
      where: { community_id, community_goal_meta_id: meta.id },
    });
    expect(goal2?.reached_at).toBeTruthy();

    const e = await drainOutbox(['CommunityGoalReached'], Xp);
    expect(e.length).toBe(3); // three goals now

    // check xp awarded
    const user = await models.User.findOne({
      where: { id: superadmin.user.id! },
    });
    expect(user?.xp_points).toBe(60); // from 10 + 20 + 30
  });
});
