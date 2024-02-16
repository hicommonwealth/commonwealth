import { InvalidState, command, dispose } from '@hicommonwealth/core';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Chance } from 'chance';
import {
  CreateGroup,
  Errors,
  MAX_GROUPS_PER_COMMUNITY,
} from '../../src/community/CreateGroup.command';
import { seedDb } from '../../src/test';

chai.use(chaiAsPromised);
const chance = Chance();

describe('Group lifecycle', () => {
  const context = {
    id: 'common-protocol',
    actor: {
      user: { id: 2, email: '' },
      address_id: '0xtestAddress',
    },
    payload: {
      metadata: {
        name: chance.name(),
        description: chance.sentence(),
        required_requirements: 1,
        membership_ttl: 100,
      },
      requirements: [], // TODO:
      topics: [], // TODO:
    },
  };

  before(async () => {
    await seedDb();
  });

  after(async () => {
    await dispose()();
  });

  it('should create group when none exists', async () => {
    const results = await command(CreateGroup, context);
    expect(results?.groups?.at(0)?.metadata).to.includes(
      context.payload.metadata,
    );
  });

  it('should fail creation when group with same id found', () => {
    expect(command(CreateGroup, context)).to.eventually.be.rejectedWith(
      InvalidState,
      Errors.GroupAlreadyExists,
    );
  });

  it('should fail creation when community reached max number of groups allowed', async () => {
    // create max groups
    for (let i = 1; i < MAX_GROUPS_PER_COMMUNITY; i++) {
      await command(CreateGroup, {
        ...context,
        payload: {
          ...context.payload,
          metadata: { name: chance.name(), description: chance.sentence() },
        },
      });
    }

    const invalid = {
      ...context,
      payload: {
        metadata: {
          name: chance.name(),
          description: chance.sentence(),
          required_requirements: 1,
          membership_ttl: 100,
        },
        requirements: [], // TODO:
        topics: [], // TODO:
      },
    };
    expect(command(CreateGroup, invalid)).to.eventually.be.rejectedWith(
      InvalidState,
      Errors.MaxGroups,
    );
  });

  it('should fail creation when sending invalid topics', () => {
    console.log('testing');
    const invalid = {
      ...context,
      payload: {
        metadata: {
          name: chance.name(),
          description: chance.sentence(),
          required_requirements: 1,
          membership_ttl: 100,
        },
        requirements: [],
        topics: [1, 2, 3],
      },
    };
    expect(command(CreateGroup, invalid)).to.eventually.be.rejectedWith(
      InvalidState,
      Errors.InvalidTopics,
    );
  });
});
