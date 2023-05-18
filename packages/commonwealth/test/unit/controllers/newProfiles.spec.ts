import axios from 'axios';
import { expect } from 'chai';
import 'chai/register-should';
import sinon from 'sinon';
import {
  testAddresses,
  testProfiles,
} from 'test/integration/api/external/dbEntityHooks.spec';
import NewProfilesController, {
  newProfilesChunkSize,
} from '../../../client/scripts/controllers/server/newProfiles';
import MinimumProfile from '../../../client/scripts/models/MinimumProfile';
import app from '../../../client/scripts/state';

app.serverUrl = () => '/api';

describe('NewProfilesController tests', async () => {
  let newProfilesController;
  const axiosStub = sinon.stub(axios, 'post');

  axiosStub.withArgs(`${app.serverUrl()}/updateProfile/v2`).resolves({
    data: {
      result: {
        status: 'Success',
      },
    },
  });

  axiosStub.withArgs(`${app.serverUrl()}/getAddressProfile`).resolves({
    data: {
      result: new Array(newProfilesChunkSize + 1).fill({
        name: '',
        address: testAddresses[0].address,
        avatarUrl: '',
        profileId: 1,
        lastActive: new Date(),
      }),
    },
  });

  beforeEach(() => {
    newProfilesController = new NewProfilesController();
  });

  it('should return the correct profile', async () => {
    const controller = new NewProfilesController();
    const expectedProfile = testProfiles[0];
    const expectedAddress = testAddresses.filter(
      (a) => a.profile_id === expectedProfile.id
    )[0];
    const actualProfile = controller.getProfile(
      expectedAddress.chain,
      expectedAddress.address
    );

    expect(actualProfile.address).to.equal(expectedAddress.address);
    expect(actualProfile.chain).to.equal(expectedAddress.chain);
  });

  it('should return an existing profile from the store', () => {
    const address = '0x123456789abcdef';
    const chain = 'testChain';
    const existingProfile = new MinimumProfile(address, chain);

    newProfilesController.store.add(existingProfile);

    const profile = newProfilesController.getProfile(chain, address);

    expect(profile).to.equal(existingProfile);
  });

  it('should queue the new profile for fetching', () => {
    const address = '0x123456789abcdef';
    const chain = 'mainnet';

    newProfilesController.getProfile(chain, address);

    expect(newProfilesController.allLoaded()).to.be.false;
  });

  it('Update profile should work correctly', async () => {
    const controller = new NewProfilesController();
    const expectedProfile = testProfiles[0];
    const expectedAddress = testAddresses.filter(
      (a) => a.profile_id === expectedProfile.id
    )[0];
    const data = { name: 'Test Name' };

    // Add profile to store
    controller.getProfile(expectedAddress.chain, expectedAddress.address);

    await controller.updateProfileForAccount(expectedAddress.address, data);

    // Calls once from getProfile invocation, then twice from updateProfileForAccount
    // (once for getProfile and once for update)
    sinon.assert.callCount(axiosStub, 3);
  });

  it('assert chunking works correctly', async () => {
    const controller = new NewProfilesController();
    const expectedProfile = testProfiles[0];
    const expectedAddress = testAddresses.filter(
      (a) => a.profile_id === expectedProfile.id
    )[0];
    const data = { name: 'Test Name' };

    axiosStub.withArgs(`${app.serverUrl()}/getAddressProfile`).resolves({
      data: {
        result: new Array(newProfilesChunkSize + 1).fill({
          name: '',
          address: testAddresses[0].address,
          avatarUrl: '',
          profileId: 1,
          lastActive: new Date(),
        }),
      },
    });

    // Add profile to store
    controller.getProfile(expectedAddress.chain, expectedAddress.address);

    await controller.updateProfileForAccount(expectedAddress.address, data);

    // Calls once from getProfile invocation, then twice from updateProfileForAccount
    // (twice for getProfile and for update)
    sinon.assert.callCount(axiosStub, 5);
  });
});
