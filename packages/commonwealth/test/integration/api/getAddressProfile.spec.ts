import { AddressInstance, models } from '@hicommonwealth/model';
import chai from 'chai';
import getAddressProfiles, {
  GetAddressProfileReq,
} from '../../../server/routes/getAddressProfile';
import { postReq, res } from '../../unit/unitHelpers';
import { testAddresses, testProfiles } from './external/dbEntityHooks.spec';

describe('getAddressProfile tests', () => {
  it('should return profile of a single address', async () => {
    const r: GetAddressProfileReq = {
      chains: [testAddresses[0].community_id],
      addresses: [testAddresses[0].address],
    } as GetAddressProfileReq;

    const resp = await getAddressProfiles(models, postReq(r), res());

    const matchingProfile = testProfiles.filter(
      (p) => p.id === resp['result'][0]['profileId'],
    )[0];

    chai.assert.equal(resp['result'].length, 1);
    chai.assert.equal(
      resp['result'][0]['profileId'],
      testAddresses[0].profile_id,
    );
    chai.assert.equal(resp['result'][0]['name'], matchingProfile.profile_name);
    chai.assert.equal(
      resp['result'][0]['avatarUrl'],
      matchingProfile.avatar_url,
    );
  });

  it('should return profile of multiple addresses of the same profile', async () => {
    chai.assert.equal(testAddresses[0].profile_id, testAddresses[1].profile_id);

    const r: GetAddressProfileReq = {
      chains: [testAddresses[0].community_id],
      addresses: [testAddresses[0].address, testAddresses[1].address],
    } as GetAddressProfileReq;

    const resp = await getAddressProfiles(models, postReq(r), res());

    const matchingProfile = testProfiles.filter(
      (p) => p.id === resp['result'][0]['profileId'],
    )[0];

    chai.assert.equal(resp['result'].length, 2);
    chai.assert.equal(
      resp['result'][0]['profileId'],
      testAddresses[0].profile_id,
    );
    chai.assert.equal(resp['result'][0]['name'], matchingProfile.profile_name);
    chai.assert.equal(
      resp['result'][0]['avatarUrl'],
      matchingProfile.avatar_url,
    );

    chai.assert.equal(
      resp['result'][1]['profileId'],
      testAddresses[1].profile_id,
    );
    chai.assert.equal(resp['result'][1]['name'], matchingProfile.profile_name);
    chai.assert.equal(
      resp['result'][1]['avatarUrl'],
      matchingProfile.avatar_url,
    );
  });

  it('should return profiles of multiple addresses of the different profiles', async () => {
    chai.assert.equal(testAddresses[0].profile_id, testAddresses[1].profile_id);
    chai.assert.notEqual(
      testAddresses[1].profile_id,
      testAddresses[2].profile_id,
    );

    const r: GetAddressProfileReq = {
      chains: [testAddresses[0].community_id],
      addresses: [
        testAddresses[0].address,
        testAddresses[1].address,
        testAddresses[2].address,
      ],
    } as GetAddressProfileReq;

    const resp = await getAddressProfiles(models, postReq(r), res());

    chai.assert.equal(resp['result'].length, 3);

    const results = resp['result'];
    const findAddressProfileResult = (testAddress: AddressInstance) => {
      const matchingProfile = testProfiles.find(
        (p) => p.id === testAddress.profile_id,
      );

      return results.find(
        (x) =>
          x.profileId === testAddress.profile_id &&
          x.name === matchingProfile.profile_name &&
          x.avatarUrl === matchingProfile.avatar_url,
      );
    };
    chai.assert.isDefined(findAddressProfileResult(testAddresses[0]));
    chai.assert.isDefined(findAddressProfileResult(testAddresses[1]));
    chai.assert.isDefined(findAddressProfileResult(testAddresses[2]));
  });
});
