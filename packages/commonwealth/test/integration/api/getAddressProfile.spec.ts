import { dispose, query } from '@hicommonwealth/core';
import { User } from '@hicommonwealth/model';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { TestServer, testServer } from '../../../server-test';

describe('getAddressProfile tests', () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await testServer();
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
    expect(addresses?.length).toBe(1);
    expect(addresses?.at(0)?.name).toBe(testUser.profile.name);
    expect(addresses?.at(0)?.avatarUrl).toBe(testUser.profile.avatar_url);
  });

  test('should return profile of multiple addresses of the same profile', async () => {
    expect(server.e2eTestEntities.testAddresses[0].user_id).toBe(
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
    expect(addresses?.length).toBe(2);

    const user1 = addresses?.at(0);
    const user2 = addresses?.at(1);
    const matchingUser = server.e2eTestEntities.testUsers.filter(
      (u) => u.id === user1?.userId,
    )[0];
    expect(user1?.userId).toBe(server.e2eTestEntities.testAddresses[0].user_id);
    expect(user1?.name).toBe(matchingUser.profile.name);
    expect(user1?.avatarUrl).toBe(matchingUser.profile.avatar_url);

    expect(user2?.userId).toBe(server.e2eTestEntities.testAddresses[1].user_id);
    expect(user2?.name).toBe(matchingUser.profile.name);
    expect(user2?.avatarUrl).toBe(matchingUser.profile.avatar_url);
  });

  test('should return profiles of multiple addresses of the different profiles', async () => {
    expect(server.e2eTestEntities.testAddresses[0].user_id).toBe(
      server.e2eTestEntities.testAddresses[1].user_id,
    );
    expect(server.e2eTestEntities.testAddresses[1].user_id).not.toBe(
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
    expect(addresses?.length).toBe(3);
  });
});
