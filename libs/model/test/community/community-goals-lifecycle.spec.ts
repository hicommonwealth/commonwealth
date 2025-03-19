import { Actor, command, dispose } from '@hicommonwealth/core';
import { CommunityGoalsPolicy } from '@hicommonwealth/model';
import { JoinCommunity } from 'model/src/aggregates/community';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { models } from '../../src/database';
import { seed } from '../../src/tester';
import { drainOutbox, seedCommunity } from '../utils';

describe('community goals lifecycle', () => {
  let community_id: string;
  let actor1: Actor, actor2: Actor, actor3: Actor;

  beforeAll(async () => {
    const { community, actors } = await seedCommunity({
      roles: ['admin', 'member', 'rejected'],
    });
    actor1 = actors.admin;
    actor2 = actors.member;
    actor3 = actors.rejected;

    const [target] = await seed('Community', {
      base: community!.base,
      chain_node_id: community!.chain_node_id!,
      active: true,
      lifetime_thread_count: 0,
      profile_count: 0,
      Addresses: [],
    });
    community_id = target!.id;

    // config community goals
    const meta = await models.CommunityGoalMeta.create({
      name: 'test',
      description: 'test',
      type: 'members',
      target: 3,
    });
    await models.CommunityGoalReached.create({
      community_goal_meta_id: meta.id!,
      community_id,
    });
  });

  afterAll(async () => {
    await dispose()();
  });

  it('should set reached goals', async () => {
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

    const e = await drainOutbox(['CommunityGoalReached']);
    expect(e.length).toBe(1);
  });
});
