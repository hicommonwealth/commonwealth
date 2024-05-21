import { dispose } from '@hicommonwealth/core';
import chai from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';
import { testServer, TestServer } from '../../../server-test';
import { config } from '../../../server/config';
import { Errors } from '../../../server/controller/index';
import { get } from './external/appHook.spec';

chai.use(chaiHttp);

describe('get roles Integration Tests', () => {
  let jwtToken;
  let server: TestServer;

  before(async () => {
    server = await testServer();
  });

  after(async () => {
    await dispose()();
  });

  beforeEach(() => {
    jwtToken = jwt.sign(
      {
        id: server.e2eTestEntities.testUsers[0].id,
        email: server.e2eTestEntities.testUsers[0].email,
      },
      config.AUTH.JWT_SECRET,
    );
  });

  it('should return an error response if there is an invalid chain specified', async () => {
    const invalidRequest = {
      jwt: jwtToken,
      author_chain: server.e2eTestEntities.testAddresses[0].community_id,
    };

    const response = await get('/api/roles', invalidRequest, true, server.app);

    response.should.have.status(400);
    chai.assert.equal(response.error, 'Community does not exist');
  });

  it('should return an error response if an invalid permission is specified', async () => {
    const invalidRequest = {
      jwt: jwtToken,
      author_chain: server.e2eTestEntities.testAddresses[0].community_id,
      chain: server.e2eTestEntities.testAddresses[0].community_id,
      permissions: null,
    };

    const response = await get('/api/roles', invalidRequest, true, server.app);

    response.should.have.status(400);
    chai.assert.equal(response.error, Errors.InvalidPermissions);
  });

  it('should get roles and return a success response', async () => {
    const validRequest = {
      jwt: jwtToken,
      author_chain: server.e2eTestEntities.testAddresses[0].community_id,
      chain: server.e2eTestEntities.testAddresses[0].community_id,
      permission: ['member', 'moderator', 'admin'],
    };

    const response = await get('/api/roles', validRequest, true, server.app);

    chai.assert.equal(response.status, 'Success');
  });
});
