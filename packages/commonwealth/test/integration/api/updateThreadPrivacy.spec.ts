import chai from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';
import app from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import models from '../../../server/database';
import { Errors } from '../../../server/routes/updateThreadPrivacy';
import { post } from './external/appHook.spec';
import {
  testAddresses,
  testThreads,
  testUsers,
} from './external/dbEntityHooks.spec';

chai.use(chaiHttp);

describe('updateThreadPrivacy Integration Tests', () => {
  let jwtTokenUser1;

  beforeEach(() => {
    jwtTokenUser1 = jwt.sign(
      { id: testUsers[0].id, email: testUsers[0].email },
      JWT_SECRET
    );
  });

  it('should return an error response if there is an invalid threadId specified', async () => {
    const invalidRequest = {
      jwt: jwtTokenUser1,
      author_chain: testAddresses[0].chain,
      chain: testAddresses[0].chain,
      thread_id: false,
      read_only: false,
    };

    const response = await post(
      '/api/updateThreadPrivacy',
      invalidRequest,
      true,
      app
    );

    response.should.have.status(400);
    chai.assert.equal(response.error, Errors.NoThreadId);
  });

  it('should return an error response if an invalid read only is specified', async () => {
    const invalidRequest = {
      jwt: jwtTokenUser1,
      author_chain: testAddresses[0].chain,
      chain: testAddresses[0].chain,
      thread_id: testThreads[0].id,
    };

    const response = await post(
      '/api/updateThreadPrivacy',
      invalidRequest,
      true,
      app
    );

    response.should.have.status(400);
    chai.assert.equal(response.error, Errors.NoReadOnly);
  });

  it('should return an error response if the user does not own the thread or is not an admin', async () => {
    const invalidRequest = {
      jwt: jwtTokenUser1,
      author_chain: testAddresses[0].chain,
      chain: testAddresses[0].chain,
      thread_id: testThreads[3].id,
      read_only: false,
    };

    const response = await post(
      '/api/updateThreadPrivacy',
      invalidRequest,
      true,
      app
    );

    response.should.have.status(400);
    chai.assert.equal(response.error, Errors.NotAdmin);
  });

  it('should lock a thread', async () => {
    const validRequest = {
      jwt: jwtTokenUser1,
      author_chain: testAddresses[0].chain,
      chain: testAddresses[0].chain,
      thread_id: testThreads[0].id,
      read_only: true,
    };

    chai.assert.notEqual(testThreads[0].read_only, false);

    const response = await post(
      '/api/updateThreadPrivacy',
      validRequest,
      false,
      app
    );

    chai.assert.equal(response.status, 'Success');
    const thread = await models.Thread.findOne({
      where: { id: testThreads[0].id },
    });

    chai.assert.notEqual(thread.read_only, true);
  });

  it('should unlock a thread', async () => {
    const validRequest = {
      jwt: jwtTokenUser1,
      author_chain: testAddresses[0].chain,
      chain: testAddresses[0].chain,
      thread_id: testThreads[0].id,
      read_only: false,
    };

    const response = await post(
      '/api/updateThreadPrivacy',
      validRequest,
      false,
      app
    );

    chai.assert.equal(response.status, 'Success');
    const thread = await models.Thread.findOne({
      where: {
        id: testThreads[0].id,
      },
    });

    chai.assert.notEqual(thread.read_only, false);
  });
});
