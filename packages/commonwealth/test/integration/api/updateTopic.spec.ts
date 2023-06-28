import chai from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';
import app from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import models from '../../../server/database';
import { UpdateTopicErrors } from '../../../server/routes/updateThreadTopic';
import { post } from './external/appHook.spec';
import {
  testAddresses,
  testThreads,
  testTopics,
  testUsers,
} from './external/dbEntityHooks.spec';

chai.use(chaiHttp);

describe('updateTopic Integration Tests', () => {
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
      topic_name: testTopics[0].name,
      address: testAddresses[0].address,
    };

    const response = await post('/api/updateTopic', invalidRequest, true, app);

    response.should.have.status(400);
    chai.assert.equal(response.error, UpdateTopicErrors.NoThread);
  });

  it('should return an error response if an invalid address is specified', async () => {
    const invalidRequest = {
      jwt: jwtTokenUser1,
      author_chain: testAddresses[0].chain,
      chain: testAddresses[0].chain,
      thread_id: testThreads[0].id,
      topic_name: testTopics[0].name,
      address: false,
    };

    const response = await post('/api/updateTopic', invalidRequest, true, app);

    response.should.have.status(400);
    chai.assert.equal(response.error, UpdateTopicErrors.NoAddr);
  });

  it('should return an error response if an invalid topic is specified', async () => {
    const invalidRequest = {
      jwt: jwtTokenUser1,
      author_chain: testAddresses[0].chain,
      chain: testAddresses[0].chain,
      thread_id: testThreads[0].id,
      topic_name: false,
      address: testAddresses[0].address,
    };

    const response = await post('/api/updateTopic', invalidRequest, true, app);

    response.should.have.status(400);
    chai.assert.equal(response.error, UpdateTopicErrors.NoTopic);
  });

  it('should return an error response if not enough permission to update topic', async () => {
    const invalidRequest = {
      jwt: jwtTokenUser1,
      author_chain: testAddresses[0].chain,
      chain: testAddresses[0].chain,
      thread_id: testThreads[3].id,
      topic_name: 'test topic',
      address: testAddresses[3].address,
    };

    const response = await post('/api/updateTopic', invalidRequest, true, app);

    response.should.have.status(400);
    chai.assert.equal(response.error, UpdateTopicErrors.NoPermission);
  });

  it('should update topic and return a success response', async () => {
    const validRequest = {
      jwt: jwtTokenUser1,
      author_chain: testAddresses[0].chain,
      chain: testAddresses[0].chain,
      thread_id: testThreads[0].id,
      topic_name: testTopics[1].name,
      address: testAddresses[0].address,
    };

    chai.assert.notEqual(testTopics[0].id, testTopics[1].id);
    chai.assert.equal(testThreads[0].topic_id, testTopics[0].id);

    const response = await post('/api/updateTopic', validRequest, true, app);

    chai.assert.equal(response.status, 'Success');
    const thread = await models.Thread.findOne({
      where: { id: testThreads[0].id },
    });

    chai.assert.equal(thread.topic_id, testTopics[1].id);
  });
});
