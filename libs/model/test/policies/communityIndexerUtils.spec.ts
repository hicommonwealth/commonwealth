import { Actor, command, dispose } from '@hicommonwealth/core';
import { BalanceType, ChainBase, ChainType } from '@hicommonwealth/shared';
import { seed } from 'model/src/tester';
import { emitEvent } from 'model/src/utils/utils';
import { Op } from 'sequelize';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CreateCommunity } from '../../src/aggregates/community';
import { models } from '../../src/database';
import { CommunityIndexerWorker } from '../../src/policies';
import { generateUniqueId } from '../../src/policies/utils/community-indexer-utils';
import { drainOutbox } from '../utils';

const MOCK_TOKEN_ID = 1234;
const MOCK_TOKEN_ADDRESS = '0x2345678901234567890123456789012345678901';

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
    token_address: MOCK_TOKEN_ADDRESS,
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
    // create seed dummy community
    await models.ChainNode.create({
      id: baseFields.chain_node_id,
      name: 'Test Chain Node',
      url: 'test-url',
      balance_type: BalanceType.Ethereum,
      eth_chain_id: 1,
    });
    await seed('Community', {
      id: 'dummy',
      name: 'Dummy Community',
      Addresses: [
        {
          address: testActor.address!,
          user_id: testActor.user.id,
          community_id: 'dummy',
          role: 'admin',
          verified: true,
        },
      ],
      ...baseFields,
    });
  });

  afterAll(async () => {
    await dispose()();
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
    {
      const invalidName = await generateUniqueId('👍', MOCK_TOKEN_ID);
      expect(invalidName).toMatchObject({
        error: 'invalid community name: original="👍"',
        id: null,
        name: null,
      });
      expect(invalidName.id).toBeNull();
      expect(invalidName.name).toBeNull();
    }
    {
      const invalidName = await generateUniqueId('!@#$%^&*()', MOCK_TOKEN_ID);
      expect(invalidName).toMatchObject({
        error: 'invalid community name: original="!@#$%^&*()"',
        id: null,
        name: null,
      });
      expect(invalidName.id).toBeNull();
      expect(invalidName.name).toBeNull();
    }
    {
      const invalidName = await generateUniqueId('$$$', MOCK_TOKEN_ID);
      expect(invalidName).toMatchObject({
        error: 'invalid community name: original="$$$"',
        id: null,
        name: null,
      });
      expect(invalidName.id).toBeNull();
      expect(invalidName.name).toBeNull();
    }
    {
      const invalidName = await generateUniqueId('あいうえお', MOCK_TOKEN_ID);
      expect(invalidName).toMatchObject({
        error: 'invalid community name: original="あいうえお"',
        id: null,
        name: null,
      });
      expect(invalidName.id).toBeNull();
      expect(invalidName.name).toBeNull();
    }
    {
      const invalidName = await generateUniqueId('你好', MOCK_TOKEN_ID);
      expect(invalidName).toMatchObject({
        error: 'invalid community name: original="你好"',
        id: null,
        name: null,
      });
      expect(invalidName.id).toBeNull();
      expect(invalidName.name).toBeNull();
    }
  });

  it('should generate base ID when no conflicts exist', async () => {
    // test short name
    const shortName = await generateUniqueId('a', MOCK_TOKEN_ID);
    expect(shortName).toMatchObject({
      error: null,
      id: `clanker-a-${MOCK_TOKEN_ID}`,
      name: 'a',
    });

    // valid name with special characters
    const validName = await generateUniqueId('$$$a$b$c$$$', MOCK_TOKEN_ID);
    expect(validName).toMatchObject({
      error: null,
      id: `clanker-a-b-c-${MOCK_TOKEN_ID}`,
      name: '$$$a$b$c$$$',
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
    const result1 = await generateUniqueId('Enumerated Community', 2000);
    expect(result1).toMatchObject({
      error: null,
      id: `clanker-enumerated-community-2000`,
      name: `Enumerated Community`,
    });
    await command(CreateCommunity(), {
      actor: testActor,
      payload: {
        id: result1.id!,
        name: result1.name!,
        ...baseFields,
      },
    });

    const result2 = await generateUniqueId('Enumerated Community', 2001);
    expect(result2).toMatchObject({
      error: null,
      id: `clanker-enumerated-community-2001`,
      name: `Enumerated Community #2`,
    });
    await command(CreateCommunity(), {
      actor: testActor,
      payload: {
        id: result2.id!,
        name: result2.name!,
        ...baseFields,
      },
    });

    {
      await models.Community.create({
        id: 'clanker-enumerated-community-already-exists',
        name: 'Enumerated Community #3',
        ...baseFields,
      });
    }

    const result3 = await generateUniqueId('Enumerated Community', 2002);
    expect(result3).toMatchObject({
      error: null,
      id: `clanker-enumerated-community-2002`,
      name: `Enumerated Community #4`,
    });
    await command(CreateCommunity(), {
      actor: testActor,
      payload: {
        id: result3.id!,
        name: result3.name!,
        ...baseFields,
      },
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

  it('should handle duplicate named consecutive tokens', async () => {
    await emitEvent(models.Outbox, [
      {
        event_name: 'ClankerTokenFound',
        event_payload: {
          id: 996,
          name: '$kull',
          pair: '',
          type: 'proxy',
          symbol: '$💀',
          img_url: '',
          tx_hash:
            '0x18c9fa160213cbb953a98da45b29962d55536873f16f63ac36fe8db5a83c330b',
          cast_hash: '0x4694b500cf55de0e3185f534f77bf2a232a3fa74',
          created_at: new Date('2024-11-14T07:00:15.348Z'),
          presale_id: '',
          pool_address: '0x169C5834cB358E76BF64907c24E7666000464B8E',
          requestor_fid: 195117,
          contract_address: '0x0f090B9e83B56841612f8E91F336650eFb3f8274',
        },
      },
    ]);

    await emitEvent(models.Outbox, [
      {
        event_name: 'ClankerTokenFound',
        event_payload: {
          id: 997,
          name: '$kull',
          pair: '',
          type: 'proxy',
          symbol: '$💀',
          img_url: '',
          tx_hash:
            '0x55c74823b5d98878ae277cbb1ffb5daf9ddbaf43b8c6398bdf1c79ccd3af7103',
          cast_hash: '0xf3bd0187b74ae0897c4136b732b4b41c558bd9b6',
          created_at: new Date('2024-11-14T07:02:57.620Z'),
          presale_id: '',
          pool_address: '0x454891dE1059D6df1A02DeFdD973F0a87aF42447',
          requestor_fid: 195117,
          contract_address: '0x0b8A44312C30892ec9d313A75d20141682E52ED1',
        },
      },
    ]);

    const numCommunitiesBefore = await models.Community.count();

    await drainOutbox(['ClankerTokenFound'], CommunityIndexerWorker);

    const numCommunitiesAfter = await models.Community.count();
    expect(numCommunitiesAfter).toBe(numCommunitiesBefore + 2);

    const communities = await models.Community.findAll({
      where: {
        name: {
          [Op.like]: '%$kull%',
        },
      },
      order: [['created_at', 'ASC']],
    });
    expect(communities.length).toBe(2);
    expect(communities[0].name).toBe('$kull');
    expect(communities[1].name).toBe('$kull #2');
  });
});
