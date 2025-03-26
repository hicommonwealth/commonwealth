import { Actor, command } from '@hicommonwealth/core';
import { ChainBase, ChainType } from '@hicommonwealth/shared';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { CreateCommunity } from '../../src/aggregates/community';
import { models } from '../../src/database';
import { generateUniqueId } from '../../src/policies/utils/community-indexer-utils';

const MOCK_TOKEN_ID = 1234;

const testActor: Actor = {
  address: '0x1234567890123456789012345678901234567890',
  user: {
    id: 100,
    isAdmin: true,
    email: 'test@test.com',
  },
};

describe('generateUniqueId', () => {
  const baseFields = {
    default_symbol: 'TEST',
    network: 'test',
    base: ChainBase.Ethereum,
    type: ChainType.Token,
    social_links: [],
    directory_page_enabled: false,
    lifetime_thread_count: 0,
    profile_count: 0,
    snapshot_spaces: [],
    active: false,
    stages_enabled: true,
    custom_stages: [],
    collapsed_on_homepage: false,
    community_indexer_id: 'clanker',
    chain_node_id: 1,
    tags: [],
    user_id: testActor.user.id,
  };

  beforeAll(async () => {
    await models.CommunityIndexer.create({
      id: 'clanker',
      status: 'idle',
    });
    await models.User.create({
      id: testActor.user.id,
      email: testActor.user.email,
      profile: {
        name: 'Test User',
      },
      isAdmin: testActor.user.isAdmin,
      tier: 0,
    });
  });

  beforeEach(async () => {
    await models.Community.destroy({ where: {} });
  });

  it('should handle invalid input names', async () => {
    // test empty name
    const emptyName1 = await generateUniqueId('', MOCK_TOKEN_ID);
    expect(emptyName1).toMatchObject({
      error: 'invalid community name: original=""',
      id: null,
      name: null,
    });

    // test empty name with whitespace
    const emptyName2 = await generateUniqueId('   ', MOCK_TOKEN_ID);
    expect(emptyName2).toMatchObject({
      error: 'invalid community name: original="   "',
      id: null,
      name: null,
    });

    // test invalid name
    const invalidName = await generateUniqueId('👍', MOCK_TOKEN_ID);
    expect(invalidName).toMatchObject({
      error: 'invalid community name: original="👍"',
      id: null,
      name: null,
    });
    expect(invalidName.id).toBeNull();
    expect(invalidName.name).toBeNull();
  });

  it('should generate base ID when no conflicts exist', async () => {
    // test short name
    const shortName = await generateUniqueId('a', MOCK_TOKEN_ID);
    expect(shortName).toMatchObject({
      error: null,
      id: `clanker-a-${MOCK_TOKEN_ID}`,
      name: 'a',
    });

    // test typical name
    const result = await generateUniqueId('Test Community', MOCK_TOKEN_ID);
    expect(result.error).toBeNull();
    expect(result.id).toBe(`clanker-test-community-${MOCK_TOKEN_ID}`);
    expect(result.name).toBe('Test Community');
  });

  it('should fail on duplicate ID', async () => {
    await command(CreateCommunity(), {
      actor: testActor,
      payload: {
        id: `clanker-test-community-${MOCK_TOKEN_ID}`,
        name: 'Test Community',
        ...baseFields,
      },
    });

    const result = await generateUniqueId('Test Community', MOCK_TOKEN_ID);
    expect(result).toMatchObject({
      error: `community already exists: clanker-test-community-${MOCK_TOKEN_ID}`,
      id: null,
      name: null,
    });
  });

  it('should generate enumerated community names', async () => {
    await command(CreateCommunity(), {
      actor: testActor,
      payload: {
        id: `clanker-test-community-55`,
        name: 'Test Community',
        ...baseFields,
      },
    });
    await command(CreateCommunity(), {
      actor: testActor,
      payload: {
        id: `clanker-test-community-66`,
        name: 'Test Community #2',
        ...baseFields,
      },
    });
    await command(CreateCommunity(), {
      actor: testActor,
      payload: {
        id: `clanker-test-community-77`,
        name: 'Test Community #3',
        ...baseFields,
      },
    });
    await command(CreateCommunity(), {
      actor: testActor,
      payload: {
        id: `clanker-test-community-88`,
        name: 'Test Community #4',
        ...baseFields,
      },
    });

    // add similarly name community with different kebab case name
    await command(CreateCommunity(), {
      actor: testActor,
      payload: {
        id: `clanker-test-community-foobar-99`,
        name: 'Test CommunityFOOBAR',
        ...baseFields,
      },
    });

    const result = await generateUniqueId('Test Community', 100);
    expect(result).toMatchObject({
      error: null,
      id: `clanker-test-community-100`,
      name: 'Test Community #5',
    });
  });

  it('should handle special characters in community names', async () => {
    const result = await generateUniqueId(
      'Test & Community @ 123!',
      MOCK_TOKEN_ID,
    );
    expect(result).toMatchObject({
      error: null,
      id: `clanker-test-community-123-${MOCK_TOKEN_ID}`,
      name: 'Test & Community @ 123!',
    });
  });
});
