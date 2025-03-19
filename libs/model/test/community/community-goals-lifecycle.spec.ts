import { Actor, command, dispose } from '@hicommonwealth/core';
import { CommunityGoalsPolicy } from '@hicommonwealth/model';
import Chance from 'chance';
import { JoinCommunity } from 'model/src/aggregates/community';
import moment from 'moment';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CreateQuest, UpdateQuest } from '../../src/aggregates/quest';
import { Xp } from '../../src/aggregates/user';
import { models } from '../../src/database';
import { seed } from '../../src/tester';
import { drainOutbox, seedCommunity } from '../utils';

const chance = new Chance();

describe('community goals lifecycle', () => {
  let community_id: string;
  let actor1: Actor, actor2: Actor, actor3: Actor;
  let superadmin: Actor;
  let goal_id: number;

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
      Addresses: [
        {
          user_id: superadmin.user.id,
          role: 'admin', // receiving xp
        },
      ],
    });
    community_id = target!.id;

    // config community goals
    const meta = await models.CommunityGoalMeta.create({
      name: 'test',
      description: 'test',
      type: 'members',
      target: 3,
    });
    goal_id = meta.id!;
  });

  afterAll(async () => {
    await dispose()();
  });

  it('should set reached goals', async () => {
    // setup community quest with goal
    const quest = await command(CreateQuest(), {
      actor: superadmin,
      payload: {
        name: 'xp goal quest',
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
            content_id: `goal:${goal_id}`,
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
      where: { community_id },
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
      where: { community_id },
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
});
