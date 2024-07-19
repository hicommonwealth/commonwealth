import { dispose } from '@hicommonwealth/core';
import { AddressInstance, models } from '@hicommonwealth/model';
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
    const testProfile = server.e2eTestEntities.testProfiles[0];
    const r: z.infer<typeof GetAddressProfileReq> = {
      communities: [server.e2eTestEntities.testAddresses[0].community_id!],
      addresses: [server.e2eTestEntities.testAddresses[0].address],
    };

    const resp = await getAddressProfiles(models, postReq(r), res());
    const profile = resp['result'][0];

    chai.assert.equal(resp['result'].length, 1);
    chai.assert.equal(profile.profileId, testProfile.id);
    chai.assert.equal(profile.name, testProfile.profile_name);
    chai.assert.equal(profile.avatarUrl, testProfile.avatar_url);
  });

  test('should return profile of multiple addresses of the same profile', async () => {
    chai.assert.equal(
      server.e2eTestEntities.testAddresses[0].profile_id,
      server.e2eTestEntities.testAddresses[1].profile_id,
    );

    const r: z.infer<typeof GetAddressProfileReq> = {
      communities: [server.e2eTestEntities.testAddresses[0].community_id!],
      addresses: [
        server.e2eTestEntities.testAddresses[0].address,
        server.e2eTestEntities.testAddresses[1].address,
      ],
    };

    const resp = await getAddressProfiles(models, postReq(r), res());
    const profile1 = resp['result'][0];
    const profile2 = resp['result'][1];

    const matchingProfile = server.e2eTestEntities.testProfiles.filter(
      (p) => p.id === profile1.profileId,
    )[0];

    chai.assert.equal(resp['result'].length, 2);
    chai.assert.equal(
      profile1.profileId,
      server.e2eTestEntities.testAddresses[0].profile_id,
    );
    chai.assert.equal(profile1.name, matchingProfile.profile_name);
    chai.assert.equal(profile1.avatarUrl, matchingProfile.avatar_url);

    chai.assert.equal(
      profile2.profileId,
      server.e2eTestEntities.testAddresses[1].profile_id,
    );
    chai.assert.equal(profile2.name, matchingProfile.profile_name);
    chai.assert.equal(profile2.avatarUrl, matchingProfile.avatar_url);
  });

  test('should return profiles of multiple addresses of the different profiles', async () => {
    chai.assert.equal(
      server.e2eTestEntities.testAddresses[0].profile_id,
      server.e2eTestEntities.testAddresses[1].profile_id,
    );
    chai.assert.notEqual(
      server.e2eTestEntities.testAddresses[1].profile_id,
      server.e2eTestEntities.testAddresses[2].profile_id,
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

    const results = resp['result'];
    const findAddressProfileResult = (testAddress: AddressInstance) => {
      const matchingProfile = server.e2eTestEntities.testProfiles.find(
        (p) => p.id === testAddress.profile_id,
      );

      return results.find(
        (x) =>
          x.profileId === testAddress.profile_id &&
          // @ts-expect-error StrictNullChecks
          x.name === matchingProfile.profile_name &&
          // @ts-expect-error StrictNullChecks
          x.avatarUrl === matchingProfile.avatar_url,
      );
    };
    chai.assert.isDefined(
      findAddressProfileResult(server.e2eTestEntities.testAddresses[0]),
    );
    chai.assert.isDefined(
      findAddressProfileResult(server.e2eTestEntities.testAddresses[1]),
    );
    chai.assert.isDefined(
      findAddressProfileResult(server.e2eTestEntities.testAddresses[2]),
    );
  });
});
