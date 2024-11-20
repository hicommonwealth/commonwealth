import { dispose, query } from '@hicommonwealth/core';
import { User } from '@hicommonwealth/model';
import chai from 'chai';
import { afterAll, beforeAll, describe, test } from 'vitest';
import { TestServer, testServer } from '../../../server-test';

describe('getAddressProfile tests', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await testServer(import.meta);
  });

  afterAll(async () => {
    await dispose()();
  });

  test('should return profile of a single address', async () => {
    const testUser = server.e2eTestEntities.testUsers[0];
    const payload = {
      communities: server.e2eTestEntities.testAddresses[0].community_id!,
      addresses: server.e2eTestEntities.testAddresses[0].address,
    };

    const addresses = await query(User.GetUserAddresses(), {
      actor: { user: { id: testUser.id, email: testUser.email! } },
      payload,
    });
    chai.assert.equal(addresses?.length, 1);
    chai.assert.equal(addresses?.at(0)?.name, testUser.profile.name);
    chai.assert.equal(addresses?.at(0)?.avatarUrl, testUser.profile.avatar_url);
  });

  test('should return profile of multiple addresses of the same profile', async () => {
    chai.assert.equal(
      server.e2eTestEntities.testAddresses[0].user_id,
      server.e2eTestEntities.testAddresses[1].user_id,
    );

    const payload = {
      communities: server.e2eTestEntities.testAddresses[0].community_id!,
      addresses: [
        server.e2eTestEntities.testAddresses[0].address,
        server.e2eTestEntities.testAddresses[1].address,
      ].join(','),
    };

    const testUser = server.e2eTestEntities.testUsers[0];
    const addresses = await query(User.GetUserAddresses(), {
      actor: { user: { id: testUser.id, email: testUser.email! } },
      payload,
    });
    chai.assert.equal(addresses?.length, 2);

    const user1 = addresses?.at(0);
    const user2 = addresses?.at(1);
    const matchingUser = server.e2eTestEntities.testUsers.filter(
      (u) => u.id === user1?.userId,
    )[0];
    chai.assert.equal(
      user1?.userId,
      server.e2eTestEntities.testAddresses[0].user_id,
    );
    chai.assert.equal(user1?.name, matchingUser.profile.name);
    chai.assert.equal(user1?.avatarUrl, matchingUser.profile.avatar_url);

    chai.assert.equal(
      user2?.userId,
      server.e2eTestEntities.testAddresses[1].user_id,
    );
    chai.assert.equal(user2?.name, matchingUser.profile.name);
    chai.assert.equal(user2?.avatarUrl, matchingUser.profile.avatar_url);
  });

  test('should return profiles of multiple addresses of the different profiles', async () => {
    chai.assert.equal(
      server.e2eTestEntities.testAddresses[0].user_id,
      server.e2eTestEntities.testAddresses[1].user_id,
    );
    chai.assert.notEqual(
      server.e2eTestEntities.testAddresses[1].user_id,
      server.e2eTestEntities.testAddresses[2].user_id,
    );

    const payload = {
      communities: server.e2eTestEntities.testAddresses[0].community_id!,
      addresses: [
        server.e2eTestEntities.testAddresses[0].address,
        server.e2eTestEntities.testAddresses[1].address,
        server.e2eTestEntities.testAddresses[2].address,
      ].join(','),
    };

    const testUser = server.e2eTestEntities.testUsers[0];
    const addresses = await query(User.GetUserAddresses(), {
      actor: { user: { id: testUser.id, email: testUser.email! } },
      payload,
    });
    chai.assert.equal(addresses?.length, 3);
  });
});
