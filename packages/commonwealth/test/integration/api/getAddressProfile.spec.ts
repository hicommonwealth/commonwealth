import { dispose } from '@hicommonwealth/core';
import { AddressInstance, models } from '@hicommonwealth/model';
import chai from 'chai';
import { TestServer, testServer } from '../../../server-test';
import getAddressProfiles, {
  GetAddressProfileReq,
} from '../../../server/routes/getAddressProfile';
import { postReq, res } from '../../unit/unitHelpers';

describe('getAddressProfile tests', () => {
  let server: TestServer;

  before(async () => {
    server = await testServer();
  });

  after(async () => {
    await dispose()();
  });

  it('should return profile of a single address', async () => {
    const r: GetAddressProfileReq = {
      communities: [server.e2eTestEntities.testAddresses[0].community_id],
      addresses: [server.e2eTestEntities.testAddresses[0].address],
    } as GetAddressProfileReq;

    const resp = await getAddressProfiles(models, postReq(r), res());

    const matchingProfile = server.e2eTestEntities.testProfiles.filter(
      (p) => p.id === resp['result'][0]['profileId'],
    )[0];

    chai.assert.equal(resp['result'].length, 1);
    chai.assert.equal(
      resp['result'][0]['profileId'],
      server.e2eTestEntities.testAddresses[0].profile_id,
    );
    chai.assert.equal(resp['result'][0]['name'], matchingProfile.profile_name);
    chai.assert.equal(
      resp['result'][0]['avatarUrl'],
      matchingProfile.avatar_url,
    );
  });

  it('should return profile of multiple addresses of the same profile', async () => {
    chai.assert.equal(
      server.e2eTestEntities.testAddresses[0].profile_id,
      server.e2eTestEntities.testAddresses[1].profile_id,
    );

    const r: GetAddressProfileReq = {
      communities: [server.e2eTestEntities.testAddresses[0].community_id],
      addresses: [
        server.e2eTestEntities.testAddresses[0].address,
        server.e2eTestEntities.testAddresses[1].address,
      ],
    } as GetAddressProfileReq;

    const resp = await getAddressProfiles(models, postReq(r), res());

    const matchingProfile = server.e2eTestEntities.testProfiles.filter(
      (p) => p.id === resp['result'][0]['profileId'],
    )[0];

    chai.assert.equal(resp['result'].length, 2);
    chai.assert.equal(
      resp['result'][0]['profileId'],
      server.e2eTestEntities.testAddresses[0].profile_id,
    );
    chai.assert.equal(resp['result'][0]['name'], matchingProfile.profile_name);
    chai.assert.equal(
      resp['result'][0]['avatarUrl'],
      matchingProfile.avatar_url,
    );

    chai.assert.equal(
      resp['result'][1]['profileId'],
      server.e2eTestEntities.testAddresses[1].profile_id,
    );
    chai.assert.equal(resp['result'][1]['name'], matchingProfile.profile_name);
    chai.assert.equal(
      resp['result'][1]['avatarUrl'],
      matchingProfile.avatar_url,
    );
  });

  it('should return profiles of multiple addresses of the different profiles', async () => {
    chai.assert.equal(
      server.e2eTestEntities.testAddresses[0].profile_id,
      server.e2eTestEntities.testAddresses[1].profile_id,
    );
    chai.assert.notEqual(
      server.e2eTestEntities.testAddresses[1].profile_id,
      server.e2eTestEntities.testAddresses[2].profile_id,
    );

    const r: GetAddressProfileReq = {
      communities: [server.e2eTestEntities.testAddresses[0].community_id],
      addresses: [
        server.e2eTestEntities.testAddresses[0].address,
        server.e2eTestEntities.testAddresses[1].address,
        server.e2eTestEntities.testAddresses[2].address,
      ],
    } as GetAddressProfileReq;

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
          x.name === matchingProfile.profile_name &&
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
