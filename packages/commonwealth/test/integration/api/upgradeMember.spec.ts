import { dispose } from '@hicommonwealth/core';
import chai from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';
import { TestServer, testServer } from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import { Errors } from '../../../server/routes/upgradeMember';
import { post } from './external/appHook.spec';

chai.use(chaiHttp);

describe('upgradeMember Integration Tests', () => {
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
      JWT_SECRET,
    );
  });

  it('should return an error response if there is an invalid role specified', async () => {
    const invalidRequest = {
      jwt: jwtToken,
      author_chain: server.e2eTestEntities.testAddresses[0].community_id,
      chain: server.e2eTestEntities.testAddresses[0].community_id,
      new_role: 'invalid role',
      address: server.e2eTestEntities.testAddresses[0].address,
    };

    const response = await post(
      '/api/upgradeMember',
      invalidRequest,
      true,
      server.app,
    );

    response.should.have.status(400);
    chai.assert.equal(response.error, Errors.InvalidRole);
  });

  it('should return an error response if an invalid address is specified', async () => {
    const invalidRequest = {
      jwt: jwtToken,
      author_chain: server.e2eTestEntities.testAddresses[0].community_id,
      chain: server.e2eTestEntities.testAddresses[0].community_id,
      new_role: 'member',
      address: true,
    };

    const response = await post(
      '/api/upgradeMember',
      invalidRequest,
      true,
      server.app,
    );

    response.should.have.status(400);
    chai.assert.equal(response.error, Errors.InvalidAddress);
  });

  it('should upgrade member and return a success response', async () => {
    await server.models.Address.update(
      {
        role: 'admin',
      },
      {
        where: {
          id: server.e2eTestEntities.testAddresses[0].id,
        },
      },
    );
    const validRequest = {
      jwt: jwtToken,
      author_chain: server.e2eTestEntities.testAddresses[0].community_id,
      chain: server.e2eTestEntities.testAddresses[0].community_id,
      new_role: 'admin',
      address: server.e2eTestEntities.testAddresses[1].address,
    };

    const response = await post(
      '/api/upgradeMember',
      validRequest,
      false,
      server.app,
    );

    chai.assert.equal(response.status, 'Success');
    const address = await server.models.Address.findOne({
      where: { id: server.e2eTestEntities.testAddresses[1].id },
    });

    chai.assert.equal(address.role, 'admin');
  });
});
