import {
  Actor,
  InvalidState,
  command,
  dispose,
  query,
} from '@hicommonwealth/core';
import { Chance } from 'chance';
import { GetCommunities } from 'model/src/community';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import {
  CreateGroup,
  Errors,
  MAX_GROUPS_PER_COMMUNITY,
} from '../../src/community/CreateGroup.command';
import { seed } from '../../src/tester';

const chance = Chance();

describe('Group lifecycle', () => {
  let actor: Actor;

  const payload = {
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
    const [node] = await seed('ChainNode', {});
    const [user] = await seed('User', { isAdmin: true });
    const [community] = await seed('Community', {
      chain_node_id: node?.id!,
      active: true,
      Addresses: [
        {
          role: 'admin',
          user_id: user!.id,
        },
      ],
    });

    payload.id = community!.id!;
    actor = {
      user: { id: user!.id!, email: user!.email!, isAdmin: user?.isAdmin },
      address_id: community!.Addresses!.at(0)!.address!,
    };
  });

  afterAll(async () => {
    await dispose()();
  });

  test('should fail to query community via has_groups when none exists', async () => {
    const communityResults = await query(GetCommunities(), {
      actor,
      payload: { has_groups: true } as any,
    });
    expect(communityResults?.results).to.have.length(0);
  });

  test('should create group when none exists', async () => {
    const results = await command(CreateGroup(), { actor, payload });
    expect(results?.groups?.at(0)?.metadata).to.includes(payload.metadata);

    const communityResults = await query(GetCommunities(), {
      actor,
      payload: { has_groups: true } as any,
    });
    expect(communityResults?.results?.at(0)?.id).to.equal(payload.id);
  });

  test('should fail creation when group with same id found', async () => {
    await expect(() =>
      command(CreateGroup(), { actor, payload }),
    ).rejects.toThrow(InvalidState);
  });

  test('should fail creation when sending invalid topics', async () => {
    await expect(
      command(CreateGroup(), {
        actor,
        payload: {
          id: payload.id,
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

  test('should fail creation when community reached max number of groups allowed', async () => {
    // create max groups
    for (let i = 1; i < MAX_GROUPS_PER_COMMUNITY; i++) {
      await command(CreateGroup(), {
        actor,
        payload: {
          id: payload.id,
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
          id: payload.id,
          metadata: { name: chance.name(), description: chance.sentence() },
          requirements: [],
          topics: [],
        },
      }),
    ).rejects.toThrow(Errors.MaxGroups);
  });
});
