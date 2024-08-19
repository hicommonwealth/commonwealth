import { Actor, dispose, query } from '@hicommonwealth/core';
import { GetCommunities, GetCommunity } from 'model/src/community';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { seed } from '../../src/tester';

describe('Tags', () => {
  let actor: Actor;
  let tag1Id: number;
  let tag2Id: number;
  let community2id: string;

  beforeAll(async () => {
    const [node] = await seed('ChainNode', {});
    const [tag1] = await seed('Tags', { name: 'tag1' });
    const [tag2] = await seed('Tags', { name: 'tag2' });
    await seed('Community', {
      chain_node_id: node!.id!,
      active: true,
      thread_count: 0,
      profile_count: 0,
    });
    const [community1Tag1Only] = await seed('Community', {
      chain_node_id: node!.id!,
      active: true,
      thread_count: 0,
      profile_count: 0,
    });
    await seed('CommunityTags', {
      community_id: community1Tag1Only!.id!,
      tag_id: tag1!.id!,
    });
    const [community2Tag1And2] = await seed('Community', {
      chain_node_id: node!.id!,
      active: true,
      thread_count: 0,
      profile_count: 0,
    });
    await seed('CommunityTags', {
      community_id: community2Tag1And2!.id!,
      tag_id: tag1!.id!,
    });
    await seed('CommunityTags', {
      community_id: community2Tag1And2!.id!,
      tag_id: tag2!.id!,
    });

    tag1Id = tag1!.id!;
    tag2Id = tag2!.id!;
    community2id = community2Tag1And2!.id!;
  });

  afterAll(async () => {
    await dispose()();
  });

  test('should query all communities when no tag passed', async () => {
    const communityResults = await query(GetCommunities(), {
      actor,
      payload: {} as any,
    });
    expect(communityResults?.results).to.have.length(3);
  });

  test('should query both tagged communities with tag 1 provided', async () => {
    const communityResults = await query(GetCommunities(), {
      actor,
      payload: { tag_ids: [tag1Id].join(',') } as any,
    });
    expect(communityResults?.results).to.have.length(2);
  });

  test('should query single community with tag 1 and 2 provided', async () => {
    const communityResults = await query(GetCommunities(), {
      actor,
      payload: { tag_ids: [tag1Id, tag2Id].join(',') } as any,
    });
    expect(communityResults?.results).to.have.length(1);

    const singleCommunityResults = await query(GetCommunity(), {
      actor,
      payload: { id: community2id },
    });
    expect(
      singleCommunityResults?.CommunityTags?.map(({ tag_id }) => tag_id),
    ).to.have.same.members([tag1Id, tag2Id]);
  });

  test('should fail on invalid tag string', async () => {
    try {
      await query(GetCommunities(), {
        actor,
        payload: { tag_ids: 'abkjdgkjsagj,daskgjdsakgjsdg' } as any,
      });
    } catch (e) {
      expect((e as Error).message).to.include('Invalid query payload');
      return;
    }
  });
});
