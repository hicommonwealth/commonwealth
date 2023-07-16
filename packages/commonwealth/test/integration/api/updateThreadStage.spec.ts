import chai from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';
import app, { resetDatabase } from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import models from '../../../server/database';
import { Errors } from '../../../server/routes/updateThreadStage';
import { post } from './external/appHook.spec';
import {
  testAddresses,
  testThreads,
  testUsers,
} from './external/dbEntityHooks.spec';

chai.use(chaiHttp);

describe('updateThreadStage Integration Tests', () => {
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
      stage: testThreads[0].stage,
    };

    const response = await post(
      '/api/updateThreadStage',
      invalidRequest,
      true,
      app
    );

    response.should.have.status(400);
    chai.assert.equal(response.error, Errors.NoThreadId);
  });

  it('should return an error response if an invalid stage is specified', async () => {
    const invalidRequest = {
      jwt: jwtTokenUser1,
      author_chain: testAddresses[0].chain,
      chain: testAddresses[0].chain,
      thread_id: testThreads[0].id,
      stage: false,
    };

    const response = await post(
      '/api/updateThreadStage',
      invalidRequest,
      true,
      app
    );

    response.should.have.status(400);
    chai.assert.equal(response.error, Errors.NoStage);
  });

  it('should return an error response if it cannot find thead specified', async () => {
    const invalidRequest = {
      jwt: jwtTokenUser1,
      author_chain: testAddresses[0].chain,
      chain: testAddresses[0].chain,
      thread_id: -123456,
      stage: 'discussion',
    };

    const response = await post(
      '/api/updateThreadStage',
      invalidRequest,
      true,
      app
    );

    response.should.have.status(400);
    chai.assert.equal(response.error, Errors.NoThread);
  });

  it('should return an error response if not enough permission to update stage (not admin or owner)', async () => {
    await models.Address.update(
      {
        role: 'member',
      },
      {
        where: {
          id: testAddresses[0].id,
        },
      }
    );
    await models.User.update(
      {
        isAdmin: false,
      },
      {
        where: {
          id: testUsers[0].id,
        },
      }
    );

    const invalidRequest = {
      jwt: jwtTokenUser1,
      author_chain: testAddresses[0].chain,
      chain: testAddresses[0].chain,
      thread_id: testThreads[3].id,
      stage: 'discussion',
    };

    const response = await post(
      '/api/updateThreadStage',
      invalidRequest,
      true,
      app
    );

    response.should.have.status(400);
    chai.assert.equal(response.error, Errors.NotAdminOrOwner);
  });

  it('should update thread stage and return a success response', async () => {
    const validRequest = {
      jwt: jwtTokenUser1,
      author_chain: testAddresses[0].chain,
      chain: testAddresses[0].chain,
      thread_id: testThreads[0].id,
      stage: 'proposal_in_review',
    };

    chai.assert.notEqual(testThreads[0].stage, 'proposal_in_review');

    const response = await post(
      '/api/updateThreadStage',
      validRequest,
      true,
      app
    );

    chai.assert.equal(response.status, 'Success');
    const thread = await models.Thread.findOne({
      where: { id: testThreads[0].id },
    });

    chai.assert.equal(thread.stage, 'proposal_in_review');
  });
});
