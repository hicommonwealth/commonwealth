import { dispose } from '@hicommonwealth/core';
import { expect } from 'chai';
import { afterAll, beforeAll, describe, it } from 'vitest';
import { seed } from '../../../../../libs/model/src/tester';
import { buildMCPTools } from '../../../server/api/mcp';

describe('buildMCPTools', () => {
  beforeAll(async () => {
    // seed a community
    await seed('Community', {
      id: 'ethereum',
      name: 'Ethereum',
      description: 'Ethereum is the best',
      profile_count: 1,
    });
  });

  afterAll(async () => {
    await dispose()();
  });

  it('should return an array of MCP tools', async () => {
    const tools = buildMCPTools();
    expect(Array.isArray(tools)).to.be.true;
    expect(tools.length).to.be.greaterThan(0);
    const getCommunityTool = tools.find((tool) => tool.name === 'getCommunity');
    expect(getCommunityTool).to.exist;
    expect(getCommunityTool!.inputSchema).to.exist;
    expect(getCommunityTool!.fn).to.exist;
    const community = (await getCommunityTool!.fn('test', {
      id: 'ethereum',
    })) as any;
    expect(community).to.exist;
    expect(community!.id).to.equal('ethereum');
    expect(community!.name).to.equal('Ethereum');
    expect(community!.description).to.equal('Ethereum is the best');
  });
});
