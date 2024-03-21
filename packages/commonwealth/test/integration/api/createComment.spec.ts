import { dispose } from '@hicommonwealth/core';
import chai from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';
import { TestServer, testServer } from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import { Errors } from '../../../server/routes/threads/create_thread_comment_handler';
import { del, post } from './external/appHook.spec';
import {
  testAddresses,
  testThreads,
  testUsers,
} from './external/dbEntityHooks.spec';
import Chance = require('chance');

chai.use(chaiHttp);
chai.should();
const chance = new Chance();

describe('createComment Integration Tests', () => {
  let jwtTokenUser1;
  let server: TestServer;

  const getThreadCommentCount = async (threadId) => {
    const thread = await server.models.Thread.findOne({
      where: { id: threadId },
    });
    return thread.comment_count;
  };

  const createValidComment = async (threadId, text, jwtToken) => {
    const validRequest = {
      jwt: jwtToken,
      author_chain: testAddresses[0].community_id,
      chain: testAddresses[0].community_id,
      thread_id: threadId,
      address: testAddresses[0].address,
      text,
    };

    const response = await post(
      `/api/threads/${threadId}/comments`,
      validRequest,
      true,
      server.app,
    );

    return response;
  };

  const getUniqueCommentText = async () => {
    const time = new Date().getMilliseconds();
    const text = `${chance.name()} at ${time}`;
    const comment = await server.models.Comment.findOne({
      where: { text },
    });
    chai.assert.isNull(comment);
    return text;
  };

  const deleteComment = async (commentId, jwtToken) => {
    const validRequest = {
      jwt: jwtToken,
      author_chain: testAddresses[0].community_id,
      chain: testAddresses[0].community_id,
      address: testAddresses[0].address,
    };

    const response = await del(
      `/api/comments/${commentId}`,
      validRequest,
      false,
      server.app,
    );

    return response;
  };

  before(async () => {
    // TODO: Notification categories and subscriptions are completely out of sync with schemas!!!
    // FIXME: This test was relying on data created by other tests
    server = await testServer();
  });

  after(async () => {
    await dispose()();
  });

  beforeEach(() => {
    jwtTokenUser1 = jwt.sign(
      { id: testUsers[0].id, email: testUsers[0].email },
      JWT_SECRET,
    );
  });

  // TODO: investigate why test server not handling error in pipeline
  it.skip('should return an error response if no text is specified', async () => {
    const invalidRequest = {
      jwt: jwtTokenUser1,
      author_chain: testAddresses[0].community_id,
      chain: testAddresses[0].community_id,
      address: testAddresses[0].address,
      thread_id: testThreads[0].id,
    };

    const response = await post(
      `/api/threads/${testThreads[0].id}/comments`,
      invalidRequest,
      true,
      server.app,
    );

    response.should.have.status(400);
    chai.assert.equal(response.error, Errors.MissingText);
  });

  // TODO: investigate why test server not handling error in pipeline
  it.skip('should return an error response if an invalid parent id is specified', async () => {
    const invalidRequest = {
      jwt: jwtTokenUser1,
      author_chain: testAddresses[0].community_id,
      chain: testAddresses[0].community_id,
      address: testAddresses[0].address,
      thread_id: testThreads[0].id,
      parent_id: -10,
      text: 'test',
    };

    const response = await post(
      `/api/threads/${testThreads[0].id}/comments`,
      invalidRequest,
      true,
      server.app,
    );

    chai.assert.equal(response.error, Errors.InvalidParent);
  });

  it('should create comment and return a success response', async () => {
    const text = await getUniqueCommentText();
    const response = await createValidComment(
      testThreads[0].id,
      text,
      jwtTokenUser1,
    );
    const comment = await server.models.Comment.findOne({
      where: { text },
    });
    chai.assert.isNotNull(comment);
    chai.assert.equal(response.status, 'Success');
  });

  it('should create and delete comment and verify thread comment counts', async () => {
    const text = await getUniqueCommentText();
    const beforeCommentCount = await getThreadCommentCount(testThreads[0].id);

    const response = await createValidComment(
      testThreads[0].id,
      text,
      jwtTokenUser1,
    );

    let comment = await server.models.Comment.findOne({
      where: { text },
    });
    let afterCommentCount = await getThreadCommentCount(testThreads[0].id);

    chai.assert.equal(afterCommentCount, beforeCommentCount + 1);
    chai.assert.isNotNull(comment);
    chai.assert.equal(response.status, 'Success');

    const deleteResponse = await deleteComment(comment.id, jwtTokenUser1);
    comment = await server.models.Comment.findOne({
      where: { text },
    });
    afterCommentCount = await getThreadCommentCount(testThreads[0].id);

    chai.assert.isNull(comment);
    chai.assert.equal(afterCommentCount, beforeCommentCount);
    chai.assert.equal(deleteResponse.status, 'Success');
  });
});
