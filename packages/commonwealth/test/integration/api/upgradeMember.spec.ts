import { dispose } from '@hicommonwealth/core';
import chai from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'vitest';
import { TestServer, testServer } from '../../../server-test';
import { config } from '../../../server/config';

chai.use(chaiHttp);

describe('upgradeMember Integration Tests', () => {
  let jwtToken;
  let server: TestServer;
  let community_id: string;
  let address: string;

  beforeAll(async () => {
    server = await testServer();
    community_id = server.e2eTestEntities.testAddresses[0].community_id;
    address = server.e2eTestEntities.testAddresses[0].address;
  });

  afterAll(async () => {
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

  test('should return an error response if there is an invalid role specified', async () => {
    const response = await chai
      .request(server.app)
      .post('/api/v1/UpdateRole')
      .set('Accept', 'application/json')
      .set('address', address)
      .send({
        jwt: jwtToken,
        community_id,
        address,
        role: 'invalid role',
      });
    expect(response.body.message).toBe('Input validation failed');
  });

  test('should return an error response if an invalid address is specified', async () => {
    const response = await chai
      .request(server.app)
      .post('/api/v1/UpdateRole')
      .set('Accept', 'application/json')
      .set('address', address)
      .send({
        jwt: jwtToken,
        community_id: server.e2eTestEntities.testAddresses[0].community_id,
        address: true,
        role: 'member',
      });
    expect(response.body.message).toBe('Input validation failed');
  });

  test('should upgrade member and return a success response', async () => {
    await server.models.Address.update(
      { role: 'admin' },
      { where: { id: server.e2eTestEntities.testAddresses[0].id } },
    );
    const response = await chai
      .request(server.app)
      .post('/api/v1/UpdateRole')
      .set('Accept', 'application/json')
      .set('address', address)
      .send({
        jwt: jwtToken,
        community_id: server.e2eTestEntities.testAddresses[0].community_id,
        address: server.e2eTestEntities.testAddresses[1].address,
        role: 'admin',
      });
    expect(response.status).toBe(200);

    const addr = await server.models.Address.findOne({
      where: { id: server.e2eTestEntities.testAddresses[1].id },
    });
    expect(addr!.role).toBe('admin');
  });
});
