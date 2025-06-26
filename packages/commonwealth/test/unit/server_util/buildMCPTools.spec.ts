import { command, dispose } from '@hicommonwealth/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CreateApiKey } from '../../../../../libs/model/src/aggregates/user';
import { seed } from '../../../../../libs/model/src/tester';
import { buildMCPTools } from '../../../server/api/mcp';

describe('buildMCPTools', () => {
  const address = '0x1234567890123456789012345678901234567890';
  let apiKey: string | null = null;

  beforeAll(async () => {
    const [user] = await seed('User', {
      id: 1,
      email: 'test@test.com',
    });

    await seed('Community', {
      id: 'ethereum',
      name: 'Ethereum',
      description: 'Ethereum is the best',
      profile_count: 1,
      Addresses: [
        {
          address,
          community_id: 'ethereum',
          role: 'member',
          user_id: user!.id!,
          verified: new Date(),
        },
      ],
    });

    const result = await command(CreateApiKey(), {
      actor: {
        address,
        user: {
          id: user!.id!,
          email: user!.email!,
        },
      },
      payload: {},
    });

    apiKey = result?.api_key || null;
    expect(apiKey).toBeTruthy();
  });

  afterAll(async () => {
    await dispose()();
  });

  it('should return an array of MCP tools and be able to call them', async () => {
    const tools = buildMCPTools();
    expect(Array.isArray(tools)).toBe(true);
    expect(tools.length).toBeGreaterThan(0);
    const getCommunityTool = tools.find((tool) => tool.name === 'getCommunity');
    expect(getCommunityTool).toBeTruthy();
    expect(getCommunityTool!.inputSchema).toBeTruthy();
    expect(getCommunityTool!.fn).toBeTruthy();
    const combinedToken = `${address}:${apiKey!}`;
    const community = (await getCommunityTool!.fn(combinedToken, {
      id: 'ethereum',
    })) as any;
    expect(community).toBeTruthy();
    expect(community!.id).toBe('ethereum');
    expect(community!.name).toBe('Ethereum');
    expect(community!.description).toBe('Ethereum is the best');
  });

  it('should return an error if the api key is invalid', async () => {
    const tools = buildMCPTools();
    const getCommunityTool = tools.find((tool) => tool.name === 'getCommunity');
    const invalidCombinedKey = `${address}:invalid`;
    await expect(
      getCommunityTool!.fn(invalidCombinedKey, {
        id: 'ethereum',
      }),
    ).rejects.toThrow('Unauthorized');
  });
});
