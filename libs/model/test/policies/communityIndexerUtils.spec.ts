import { ChainBase, ChainType } from '@hicommonwealth/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { models } from '../../src/database';
import { generateUniqueId } from '../../src/policies/utils/community-indexer-utils';

const MOCK_TOKEN_ID = 1234;

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
  };

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

  it('should return enumerated name when there are conflicts', async () => {
    await models.Community.create({
      id: `clanker-test-community-${MOCK_TOKEN_ID}`,
      name: 'Test Community',
      ...baseFields,
    });

    const result = await generateUniqueId('Test Community', MOCK_TOKEN_ID);
    expect(result).toMatchObject({
      error: null,
      id: `clanker-test-community-${MOCK_TOKEN_ID}`,
      name: 'Test Community (2)',
    });
  });

  it('should generate enumerated community names', async () => {
    await models.Community.create({
      id: `clanker-test-community-55`,
      name: 'Test Community',
      ...baseFields,
    });
    await models.Community.create({
      id: `clanker-test-community-66`,
      name: 'Test Community (2)',
      ...baseFields,
    });
    await models.Community.create({
      id: `clanker-test-community-77`,
      name: 'Test Community (3)',
      ...baseFields,
    });
    await models.Community.create({
      id: `clanker-test-community-88`,
      name: 'Test Community (4)',
      ...baseFields,
    });

    // add similarly name community with different kebab case name
    await models.Community.create({
      id: `clanker-test-community-foobar-99`,
      name: 'Test CommunityFOOBAR',
      ...baseFields,
    });

    const result = await generateUniqueId('Test Community', 100);
    expect(result).toMatchObject({
      error: null,
      id: `clanker-test-community-100`,
      name: 'Test Community (5)',
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
