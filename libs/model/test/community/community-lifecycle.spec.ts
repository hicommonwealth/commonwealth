import {
  Actor,
  InvalidState,
  command,
  dispose,
  query,
} from '@hicommonwealth/core';
import { ChainNodeAttributes } from '@hicommonwealth/model';
import { ChainBase, ChainType } from '@hicommonwealth/shared';
import { Chance } from 'chance';
import { CreateCommunity, GetCommunities } from 'model/src/community';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import {
  CreateGroup,
  Errors,
  MAX_GROUPS_PER_COMMUNITY,
} from '../../src/community/CreateGroup.command';
import { seed } from '../../src/tester';

const chance = Chance();

describe('Community lifecycle', () => {
  let node: ChainNodeAttributes;
  let actor: Actor;
  const group_payload = {
    id: '',
    metadata: {
      name: chance.name(),
      description: chance.sentence(),
      required_requirements: 1,
      membership_ttl: 100,
    },
    requirements: [],
    topics: [],
  };

  beforeAll(async () => {
    const [_node] = await seed('ChainNode', { eth_chain_id: 1 });
    const [user] = await seed('User', { isAdmin: true });
    const [base] = await seed('Community', {
      chain_node_id: _node!.id!,
      base: ChainBase.Ethereum,
      active: true,
      lifetime_thread_count: 0,
      profile_count: 1,
      Addresses: [
        {
          role: 'member',
          user_id: user!.id,
        },
      ],
    });

    node = _node!;
    actor = {
      user: { id: user!.id!, email: user!.email!, isAdmin: user!.isAdmin! },
      address: base?.Addresses?.at(0)?.address,
    };
  });

  afterAll(async () => {
    await dispose()();
  });

  test('should create community', async () => {
    const name = chance.name();
    const result = await command(CreateCommunity(), {
      actor,
      payload: {
        id: name,
        type: ChainType.Offchain,
        name,
        default_symbol: name.substring(0, 8).replace(' ', ''),
        network: 'network',
        base: ChainBase.Ethereum,
        eth_chain_id: node.eth_chain_id!,
        social_links: [],
        user_address: actor.address!,
        node_url: node.url,
        directory_page_enabled: false,
        tags: [],
      },
    });
    expect(result?.community?.id).toBe(name);
    expect(result?.admin_address).toBe(actor.address);
    // connect group payload to new community
    group_payload.id = result!.community!.id;
  });

  test('should fail to query community via has_groups when none exists', async () => {
    const communityResults = await query(GetCommunities(), {
      actor,
      payload: { has_groups: true } as any,
    });
    expect(communityResults?.results).to.have.length(0);
  });

  test('should create group when none exists', async () => {
    const results = await command(CreateGroup(), {
      actor,
      payload: group_payload,
    });
    expect(results?.groups?.at(0)?.metadata).to.includes(
      group_payload.metadata,
    );

    const communityResults = await query(GetCommunities(), {
      actor,
      payload: { has_groups: true } as any,
    });
    expect(communityResults?.results?.at(0)?.id).to.equal(group_payload.id);
  });

  test('should fail group creation when group with same id found', async () => {
    await expect(() =>
      command(CreateGroup(), { actor, payload: group_payload }),
    ).rejects.toThrow(InvalidState);
  });

  test('should fail group creation when sending invalid topics', async () => {
    await expect(
      command(CreateGroup(), {
        actor,
        payload: {
          id: group_payload.id,
          metadata: {
            name: chance.name(),
            description: chance.sentence(),
            required_requirements: 1,
          },
          requirements: [],
          topics: [1, 2, 3],
        },
      }),
    ).rejects.toThrow(Errors.InvalidTopics);
  });

  test('should fail group creation when community reached max number of groups allowed', async () => {
    // create max groups
    for (let i = 1; i < MAX_GROUPS_PER_COMMUNITY; i++) {
      await command(CreateGroup(), {
        actor,
        payload: {
          id: group_payload.id,
          metadata: { name: chance.name(), description: chance.sentence() },
          requirements: [],
          topics: [],
        },
      });
    }

    await expect(() =>
      command(CreateGroup(), {
        actor,
        payload: {
          id: group_payload.id,
          metadata: { name: chance.name(), description: chance.sentence() },
          requirements: [],
          topics: [],
        },
      }),
    ).rejects.toThrow(Errors.MaxGroups);
  });
});
