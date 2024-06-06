import { Actor, InvalidState, command, dispose } from '@hicommonwealth/core';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Chance } from 'chance';
import { afterAll, beforeAll, describe, test } from 'vitest';
import {
  CreateGroup,
  Errors,
  MAX_GROUPS_PER_COMMUNITY,
} from '../../src/community/CreateGroup.command';
import { seed } from '../../src/tester';

chai.use(chaiAsPromised);
const chance = Chance();

describe('Group lifecycle', () => {
  let id: string;
  let actor: Actor;

  const payload = {
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
      chain_node_id: node?.id,
      Addresses: [
        {
          role: 'admin',
          user_id: user!.id,
        },
      ],
    });

    id = community!.id!;
    actor = {
      user: { id: user!.id!, email: user!.email! },
      address_id: community!.Addresses!.at(0)!.address!,
    };
  });

  afterAll(async () => {
    await dispose()();
  });

  test('should create group when none exists', async () => {
    const results = await command(CreateGroup(), { id, actor, payload });
    expect(results?.groups?.at(0)?.metadata).to.includes(payload.metadata);
  });

  test('should fail creation when group with same id found', () => {
    expect(
      command(CreateGroup(), { id, actor, payload }),
    ).to.eventually.be.rejectedWith(InvalidState);
  });

  test('should fail creation when sending invalid topics', () => {
    const invalid = {
      id,
      actor,
      payload: {
        metadata: {
          name: chance.name(),
          description: chance.sentence(),
          required_requirements: 1,
        },
        requirements: [],
        topics: [1, 2, 3],
      },
    };
    expect(command(CreateGroup(), invalid)).to.eventually.be.rejectedWith(
      InvalidState,
      Errors.InvalidTopics,
    );
  });

  test('should fail creation when community reached max number of groups allowed', async () => {
    // create max groups
    for (let i = 1; i < MAX_GROUPS_PER_COMMUNITY; i++) {
      await command(CreateGroup(), {
        id,
        actor,
        payload: {
          ...payload,
          metadata: { name: chance.name(), description: chance.sentence() },
        },
      });
    }

    const invalid = {
      id,
      actor,
      payload: {
        metadata: {
          name: chance.name(),
          description: chance.sentence(),
        },
        requirements: [],
        topics: [],
      },
    };
    expect(command(CreateGroup(), invalid)).to.eventually.be.rejectedWith(
      InvalidState,
      Errors.MaxGroups,
    );
  });
});
