import { ChainBase, ChainType } from '@hicommonwealth/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import { models } from '../../src/database';
import { generateUniqueId } from '../../src/policies/utils/community-indexer-utils';

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
    const shortName = await generateUniqueId('ab');
    expect(shortName.error).toContain(
      'formatted community name invalid or too short: original="ab"',
    );
    expect(shortName.id).toBeNull();
    expect(shortName.name).toBeNull();

    const emptyName = await generateUniqueId('   ');
    expect(emptyName.error).toContain(
      'formatted community name invalid or too short: original="   "',
    );
    expect(emptyName.id).toBeNull();
    expect(emptyName.name).toBeNull();
  });

  it('should generate base ID when no conflicts exist', async () => {
    const result = await generateUniqueId('Test Community');
    expect(result.error).toBeNull();
    expect(result.id).toBe('test-community');
    expect(result.name).toBe('Test Community');
  });

  it('should handle existing base ID and generate sequential variant', async () => {
    await models.Community.create({
      id: 'test-community',
      name: 'Test Community',
      ...baseFields,
    });

    const result = await generateUniqueId('Test Community');
    expect(result.error).toBeNull();
    expect(result.id).toBe('test-community-2');
    expect(result.name).toBe('Test Community (2)');
  });

  it('should generate sequential numbers without using gaps', async () => {
    await models.Community.create({
      id: 'test-community',
      name: 'Test Community',
      ...baseFields,
    });
    await models.Community.create({
      id: 'test-community-2',
      name: 'Test Community (2)',
      ...baseFields,
    });
    await models.Community.create({
      id: 'test-community-3',
      name: 'Test Community (3)',
      ...baseFields,
    });

    await models.Community.create({
      id: 'test-community-5',
      name: 'Test Community (5)',
      ...baseFields,
    });

    const result = await generateUniqueId('Test Community');
    expect(result.error).toBeNull();
    expect(result.id).toBe('test-community-6');
    expect(result.name).toBe('Test Community (6)');
  });

  it('should return error when more than 10 communities exist', async () => {
    for (let i = 0; i < 10; i++) {
      const result = await generateUniqueId('Test Community');
      expect(result.error).toBeNull();
      const { id, name } = result;
      const c = await models.Community.create({
        id: id!,
        name: name!,
        ...baseFields,
      });
      if (i === 0) {
        expect(c.id).toBe('test-community');
        expect(c.name).toBe('Test Community');
      } else {
        expect(c.id).toBe(`test-community-${i + 1}`);
        expect(c.name).toBe(`Test Community (${i + 1})`);
      }
    }

    const result = await generateUniqueId('Test Community');
    expect(result.error).toContain(
      'too many conflicting community IDs for: test-community',
    );
    expect(result.id).toBeNull();
    expect(result.name).toBeNull();
  });

  it('should handle special characters in community names', async () => {
    const result = await generateUniqueId('Test & Community @ 123!');
    expect(result.error).toBeNull();
    expect(result.id).toBe('test-community-123');
    expect(result.name).toBe('Test & Community @ 123!');
  });
});
