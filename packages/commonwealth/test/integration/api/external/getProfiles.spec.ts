import 'chai/register-should';
import chai from 'chai';
import type { GetProfilesReq } from 'common-common/src/api/extApiTypes';
import {
  testAddresses,
  testProfiles,
} from 'test/integration/api/external/dbEntityHooks.spec';
import { get } from './appHook.spec';

describe('getProfiles Tests', () => {
  it('should return profiles with specified profile_id correctly', async () => {
    console.log(testAddresses.map((p) => p.address));
    const r: GetProfilesReq = {
      addresses: testAddresses.map((p) => p.address),
    };
    const resp = await get('/api/profiles', r, true);

    chai.assert.lengthOf(resp.result.profiles, 2);
    chai.assert.lengthOf(resp.result.profiles[0].Addresses, 1);
    chai.assert.isNotNull(resp.result.profiles[0].Addresses[0].Chain);
    chai.assert.lengthOf(resp.result.profiles[0].Addresses[0].Threads, 2);
    chai.assert.lengthOf(resp.result.profiles[0].Addresses[0].Comments, 2);
  });

  it('should return profiles with specified network correctly', async () => {
    const r: GetProfilesReq = { profile_ids: testProfiles.map((p) => p.id) };
    const resp = await get('/api/profiles', r, true);

    chai.assert.lengthOf(resp.result.profiles, 2);
    chai.assert.lengthOf(resp.result.profiles[0].Addresses, 1);
    chai.assert.isNotNull(resp.result.profiles[0].Addresses[0].Chain);
    chai.assert.lengthOf(resp.result.profiles[0].Addresses[0].Threads, 2);
    chai.assert.lengthOf(resp.result.profiles[0].Addresses[0].Comments, 2);
  });

  it('should return count only when specified correctly', async () => {
    const r: GetProfilesReq = {
      addresses: testAddresses.map((p) => p.address),
      count_only: true,
    };
    const resp = await get('/api/profiles', r, true);

    chai.assert.equal(resp.result.count, 2);
    chai.assert.isUndefined(resp.result.profiles);
  });

  it('should handle errors correctly', async () => {
    let resp = await get('/api/profiles', {}, true);

    chai.assert.lengthOf(resp.result, 1);
    chai.assert.equal(
      resp.result[0].msg,
      'Please provide a parameter to query by (addresses, profile_ids)'
    );

    resp = await get(
      '/api/profiles',
      { profile_ids: testProfiles.map((p) => p.id), count_only: 3 },
      true
    );

    chai.assert.lengthOf(resp.result, 1);
    chai.assert.equal(resp.result[0].msg, 'Invalid value');
    chai.assert.equal(resp.result[0].param, 'count_only');
  });
});
