import chai from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';
import app from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import { Errors } from '../../../server/controller/index';
import { get } from './external/appHook.spec';
import { testAddresses, testUsers } from './external/dbEntityHooks.spec';

chai.use(chaiHttp);

describe('get roles Integration Tests', () => {
  let jwtToken;

  beforeEach(() => {
    jwtToken = jwt.sign(
      { id: testUsers[0].id, email: testUsers[0].email },
      JWT_SECRET,
    );
  });

  it('should return an error response if there is an invalid chain specified', async () => {
    const invalidRequest = {
      jwt: jwtToken,
      author_chain: testAddresses[0].community_id,
    };

    const response = await get('/api/roles', invalidRequest, true, app);

    response.should.have.status(400);
    chai.assert.equal(response.error, 'Community does not exist');
  });

  it('should return an error response if an invalid permission is specified', async () => {
    const invalidRequest = {
      jwt: jwtToken,
      author_chain: testAddresses[0].community_id,
      chain: testAddresses[0].community_id,
      permissions: null,
    };

    const response = await get('/api/roles', invalidRequest, true, app);

    response.should.have.status(400);
    chai.assert.equal(response.error, Errors.InvalidPermissions);
  });

  it('should get roles and return a success response', async () => {
    const validRequest = {
      jwt: jwtToken,
      author_chain: testAddresses[0].community_id,
      chain: testAddresses[0].community_id,
      permission: ['member', 'moderator', 'admin'],
    };

    const response = await get('/api/roles', validRequest, true, app);

    chai.assert.equal(response.status, 'Success');
  });
});
