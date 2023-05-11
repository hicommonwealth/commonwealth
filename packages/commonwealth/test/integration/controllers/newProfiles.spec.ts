import axios from 'axios';
import { expect } from 'chai';
import 'chai/register-should';
import sinon from 'sinon';
import { testAddresses, testProfiles } from 'test/integration/api/external/dbEntityHooks.spec';
import NewProfilesController from '../../../client/scripts/controllers/server/newProfiles';
import MinimumProfile from '../../../client/scripts/models/MinimumProfile';

axios.defaults.baseURL = 'http://localhost:8080';


describe('NewProfilesController tests', async () => {
  let newProfilesController;

  beforeEach(() => {
    newProfilesController = new NewProfilesController();
  });

  it('should return the correct profile', async () => {
    const controller = new NewProfilesController();
    const expectedProfile = testProfiles[0];
    const expectedAddress = testAddresses.filter(a => a.profile_id === expectedProfile.id)[0];
    const actualProfile = controller.getProfile(expectedAddress.chain, expectedAddress.address);

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
    expect(newProfilesController.isFetched.listenerCount('redraw')).to.equal(1);
    expect(newProfilesController['_unfetched'].get(address)).to.exist;
  });

  it('should update the profile on the server and refresh the profile data', async () => {
    const controller = new NewProfilesController();
    const expectedProfile = testProfiles[0];
    const expectedAddress = testAddresses.filter(a => a.profile_id === expectedProfile.id)[0];
    const data = { name: 'John Doe' };
    const response = { data: { result: { status: 'Success' } } };

    // Create a stub for axios.post method to return the response object
    const axiosStub = sinon.stub(axios, 'post').resolves(response);

    // Add profile to store
    controller.getProfile(expectedAddress.chain, expectedAddress.address);

    // Call the updateProfileForAccount method
    await controller.updateProfileForAccount(expectedAddress.address, data);

    // Check that the axios.post method was called with the correct arguments
    sinon.assert.calledOnce(axiosStub);


    // Check that the profile was updated
    const profile = controller.store.getByAddress(expectedAddress.address);
    expect(profile.name).to.equal(data.name);

    // Restore the original axios.post method
    axiosStub.restore();
  });
});