import chai from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';
import app from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import models from '../../../server/database';
import { Errors } from '../../../server/routes/threads/create_thread_comment_handler';
import { del, post } from './external/appHook.spec';
import {
  testAddresses,
  testThreads,
  testUsers,
} from './external/dbEntityHooks.spec';

chai.use(chaiHttp);
chai.should();

const getThreadCommentCount = async (threadId) => {
  const thread = await models.Thread.findOne({
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
    app,
  );

  return response;
};

const getUniqueCommentText = async () => {
  const time = new Date().getMilliseconds();
  const text = `testCommentCreated at ${time}`;
  const comment = await models.Comment.findOne({
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
    app,
  );

  return response;
};

describe('createComment Integration Tests', () => {
  let jwtTokenUser1;

  beforeEach(() => {
    jwtTokenUser1 = jwt.sign(
      { id: testUsers[0].id, email: testUsers[0].email },
      JWT_SECRET,
    );
  });

  it('should return an error response if no text is specified', async () => {
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
      app,
    );

    response.should.have.status(400);
    chai.assert.equal(response.error, Errors.MissingText);
  });

  it('should return an error response if an invalid parent id is specified', async () => {
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
      app,
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
    const comment = await models.Comment.findOne({
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

    let comment = await models.Comment.findOne({
      where: { text },
    });
    let afterCommentCount = await getThreadCommentCount(testThreads[0].id);

    chai.assert.equal(afterCommentCount, beforeCommentCount + 1);
    chai.assert.isNotNull(comment);
    chai.assert.equal(response.status, 'Success');

    const deleteResponse = await deleteComment(comment.id, jwtTokenUser1);
    comment = await models.Comment.findOne({
      where: { text },
    });
    afterCommentCount = await getThreadCommentCount(testThreads[0].id);

    chai.assert.isNull(comment);
    chai.assert.equal(afterCommentCount, beforeCommentCount);
    chai.assert.equal(deleteResponse.status, 'Success');
  });
});
