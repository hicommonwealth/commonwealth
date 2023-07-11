import chai from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';
import app from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import { Errors } from '../../../server/routes/addEditors';
import { post } from './external/appHook.spec';
import {
  testAddresses,
  testThreads,
  testUsers,
} from './external/dbEntityHooks.spec';

chai.use(chaiHttp);
const { expect } = chai;

describe('addEditors Integration Tests', () => {
  let jwtToken;

  beforeEach(() => {
    jwtToken = jwt.sign(
      { id: testUsers[0].id, email: testUsers[0].email },
      JWT_SECRET
    );
  });

  it('should return an error response if there are validation errors', async () => {
    const invalidRequest = {
      jwt: jwtToken,
      author_chain: testAddresses[0].chain,
      address: testAddresses[0].address,
      chain: testAddresses[0].chain,
      thread_id: -1,
      editors: [{ chain: 'invalid', address: testAddresses[0].address }],
    };

    const response = await post('/api/addEditors', invalidRequest, true, app);

    response.should.have.status(400);
    chai.assert.equal(response.error, Errors.InvalidEditor);
  });

  it('should return an error response if the thread does not exist', async () => {
    const nonExistentThreadId = '-12345678';

    const response = await post(
      '/api/addEditors',
      {
        jwt: jwtToken,
        author_chain: testAddresses[0].chain,
        address: testAddresses[0].address,
        chain: testAddresses[0].chain,
        thread_id: nonExistentThreadId,
        editors: [
          { chain: testAddresses[0].chain, address: testAddresses[0].address },
        ],
      },
      true,
      app
    );

    response.should.have.status(400);
    chai.assert.equal(response.error, Errors.InvalidThread);
  });

  it('should add editors and return a success response', async () => {
    const testAddress = testAddresses.filter(
      (a) => a.id === testThreads[0].address_id
    )[0];
    const validRequest = {
      address: testAddresses[0].address,
      author_chain: testAddresses[0].chain,
      chain: testAddresses[0].chain,
      editors: [{ address: testAddress.address, chain: testAddress.chain }],
      jwt: jwtToken,
      thread_id: testThreads[0].id,
    };
    const response = await post('/api/addEditors', validRequest, true, app);

    expect(response.status).to.equal('Success');
    expect(response.result.collaborators).to.haveOwnProperty('length');
    expect(response.result.collaborators.length).equal(2);
    expect(response.result.collaborators[0].id).to.equal(-1);
    expect(response.result.collaborators[1].id).to.equal(-2);
  });
});
