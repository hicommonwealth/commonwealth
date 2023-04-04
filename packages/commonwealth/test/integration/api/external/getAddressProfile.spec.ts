import chai from 'chai';
import models from '../../../../server/database';
import getAddressProfile, { GetAddressProfileReq } from '../../../../server/routes/getAddressProfile';
import { postReq, res } from '../../../unit/unitHelpers';
import { testAddresses, testProfiles } from './dbEntityHooks.spec';

describe('getAddressProfile tests', () => {
  it('should fail if parameters aren\'t provided', async () => {
    let r: GetAddressProfileReq = {
      chain: 'fake chain',
    } as GetAddressProfileReq;

    let error = '';

    await getAddressProfile(
      models,
      postReq(r),
      res(),
      (e) => {
        error = e;
      }
    );

    chai.assert.equal(error['status'], 400);
    chai.assert.equal(error['name'], 'AppError');

    r = {
      addresses: testAddresses[0].address as unknown
    } as GetAddressProfileReq;

    error = '';

    await getAddressProfile(
      models,
      postReq(r),
      res(),
      (e) => {
        error = e;
      }
    );

    chai.assert.equal(error['status'], 400);
    chai.assert.equal(error['name'], 'AppError');
  });

  it('should fail if the chain doesn\'t exist', async () => {
    const r: GetAddressProfileReq = {
      chain: 'fake chain',
      addresses: testAddresses[0].address as unknown
    } as GetAddressProfileReq;

    let error = '';

    await getAddressProfile(
      models,
      postReq(r),
      res(),
      (e) => {
        error = e;
      }
    );

    chai.assert.equal(error['status'], 400);
    chai.assert.equal(error['name'], 'AppError');
  });

  it('should return profile of a single address', async () => {
    const r: GetAddressProfileReq = {
      chain: testAddresses[0].chain,
      addresses: testAddresses[0].address as unknown
    } as GetAddressProfileReq;

    let error = '';

    const resp = await getAddressProfile(
      models,
      postReq(r),
      res(),
      (e) => {
        error = e;
      }
    );

    const matchingProfile = testProfiles.filter(p => p.id === resp['result']['profileId'])[0];

    chai.assert.equal(error, '');
    chai.assert.equal(resp['result']['profileId'], testAddresses[0].profile_id);
    chai.assert.equal(resp['result']['name'], matchingProfile.profile_name);
    chai.assert.equal(resp['result']['avatarUrl'], matchingProfile.avatar_url);
  });

  it('should return profile of multiple addresses of the same profile', async () => {
    chai.assert.equal(testAddresses[0].profile_id, testAddresses[1].profile_id);

    const r: GetAddressProfileReq = {
      chain: testAddresses[0].chain,
      addresses: [testAddresses[0].address, testAddresses[1].address]
    } as GetAddressProfileReq;

    let error = '';

    const resp = await getAddressProfile(
      models,
      postReq(r),
      res(),
      (e) => {
        error = e;
      }
    );

    const matchingProfile = testProfiles.filter(p => p.id === resp['result']['profileId'])[0];

    chai.assert.equal(error, '');
    chai.assert.equal(resp['result']['profileId'], testAddresses[0].profile_id);
    chai.assert.equal(resp['result']['name'], matchingProfile.profile_name);
    chai.assert.equal(resp['result']['avatarUrl'], matchingProfile.avatar_url);
  });

  it('should return profiles of multiple addresses of the different profiles', async () => {
    chai.assert.equal(testAddresses[0].profile_id, testAddresses[1].profile_id);
    chai.assert.notEqual(testAddresses[1].profile_id, testAddresses[2].profile_id);

    const r: GetAddressProfileReq = {
      chain: testAddresses[0].chain,
      addresses: [testAddresses[0].address, testAddresses[1].address, testAddresses[2].address]
    } as GetAddressProfileReq;

    let error = '';

    const resp = await getAddressProfile(
      models,
      postReq(r),
      res(),
      (e) => {
        error = e;
      }
    );

    const matchingProfile = testProfiles.filter(p => p.id === resp['result']['profileId'])[0];

    chai.assert.equal(error, '');
    chai.assert.equal(resp['result']['profileId'], testAddresses[0].profile_id);
    chai.assert.equal(resp['result']['name'], matchingProfile.profile_name);
    chai.assert.equal(resp['result']['avatarUrl'], matchingProfile.avatar_url);
  });

});
