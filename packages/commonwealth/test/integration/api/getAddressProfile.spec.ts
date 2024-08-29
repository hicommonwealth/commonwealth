import { dispose } from '@hicommonwealth/core';
import { models } from '@hicommonwealth/model';
import { GetAddressProfileReq } from '@hicommonwealth/schemas';
import chai from 'chai';
import { afterAll, beforeAll, describe, test } from 'vitest';
import { z } from 'zod';
import { TestServer, testServer } from '../../../server-test';
import getAddressProfiles from '../../../server/routes/getAddressProfile';
import { postReq, res } from '../../unit/unitHelpers';

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
    const r: z.infer<typeof GetAddressProfileReq> = {
      communities: [server.e2eTestEntities.testAddresses[0].community_id!],
      addresses: [server.e2eTestEntities.testAddresses[0].address],
    };

    const resp = await getAddressProfiles(models, postReq(r), res());
    const profile = resp['result'][0];

    chai.assert.equal(resp['result'].length, 1);
    chai.assert.equal(profile.name, testUser.profile.name);
    chai.assert.equal(profile.avatarUrl, testUser.profile.avatar_url);
  });

  test('should return profile of multiple addresses of the same profile', async () => {
    chai.assert.equal(
      server.e2eTestEntities.testAddresses[0].user_id,
      server.e2eTestEntities.testAddresses[1].user_id,
    );

    const r: z.infer<typeof GetAddressProfileReq> = {
      communities: [server.e2eTestEntities.testAddresses[0].community_id!],
      addresses: [
        server.e2eTestEntities.testAddresses[0].address,
        server.e2eTestEntities.testAddresses[1].address,
      ],
    };

    const resp = await getAddressProfiles(models, postReq(r), res());
    const user1 = resp['result'][0];
    const user2 = resp['result'][1];

    const matchingUser = server.e2eTestEntities.testUsers.filter(
      (u) => u.id === user1.userId,
    )[0];

    chai.assert.equal(resp['result'].length, 2);
    chai.assert.equal(
      user1.userId,
      server.e2eTestEntities.testAddresses[0].user_id,
    );
    chai.assert.equal(user1.name, matchingUser.profile.name);
    chai.assert.equal(user1.avatarUrl, matchingUser.profile.avatar_url);

    chai.assert.equal(
      user2.userId,
      server.e2eTestEntities.testAddresses[1].user_id,
    );
    chai.assert.equal(user2.name, matchingUser.profile.name);
    chai.assert.equal(user2.avatarUrl, matchingUser.profile.avatar_url);
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

    const r: z.infer<typeof GetAddressProfileReq> = {
      communities: [server.e2eTestEntities.testAddresses[0].community_id!],
      addresses: [
        server.e2eTestEntities.testAddresses[0].address,
        server.e2eTestEntities.testAddresses[1].address,
        server.e2eTestEntities.testAddresses[2].address,
      ],
    };

    const resp = await getAddressProfiles(models, postReq(r), res());
    chai.assert.equal(resp['result'].length, 3);
  });
});
