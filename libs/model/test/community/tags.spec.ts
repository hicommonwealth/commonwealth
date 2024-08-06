import { Actor, dispose, query } from '@hicommonwealth/core';
import { GetCommunities } from 'model/src/community';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { seed } from '../../src/tester';

describe('Tags', () => {
  let actor: Actor;
  let tag1Id: number;
  let tag2Id: number;

  beforeAll(async () => {
    const [node] = await seed('ChainNode', {});
    const [tag1] = await seed('Tags', { name: 'tag1' });
    const [tag2] = await seed('Tags', { name: 'tag2' });
    const [communityNoTags] = await seed('Community', {
      chain_node_id: node?.id,
      active: true,
    });
    const [community1Tag1Only] = await seed('Community', {
      chain_node_id: node?.id,
      active: true,
    });
    const [community1tag1Tag] = await seed('CommunityTags', {
      community_id: community1Tag1Only?.id,
      tag_id: tag1?.id,
    });
    const [community2Tag1And2] = await seed('Community', {
      chain_node_id: node?.id,
      active: true,
    });
    const [community2tag1Tag] = await seed('CommunityTags', {
      community_id: community2Tag1And2?.id,
      tag_id: tag1?.id,
    });
    const [community2tag2Tag] = await seed('CommunityTags', {
      community_id: community2Tag1And2?.id,
      tag_id: tag2?.id,
    });

    tag1Id = tag1!.id!;
    tag2Id = tag2!.id!;
  });

  afterAll(async () => {
    await dispose()();
  });

  test('should query all communities when no tag passed', async () => {
    const communityResults = await query(GetCommunities(), {
      actor,
      payload: {},
    });
    console.log(communityResults);
    expect(communityResults?.results).to.have.length(3);
  });

  test('should query both tagged communities with tag 1 provided', async () => {
    const communityResults = await query(GetCommunities(), {
      actor,
      payload: { tag_ids: [tag1Id] },
    });
    console.log(communityResults);
    expect(communityResults?.results).to.have.length(2);
  });

  test('should query single community with tag 1 and 2 provided', async () => {
    const communityResults = await query(GetCommunities(), {
      actor,
      payload: { tag_ids: [tag1Id, tag2Id] },
    });
    console.log(communityResults);
    expect(communityResults?.results).to.have.length(1);
  });
});
