import chai from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';
import app from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import models from '../../../server/database';
import { post, del } from './external/appHook.spec';
import {
  testAddresses,
  testThreads,
  testUsers,
} from './external/dbEntityHooks.spec';

chai.use(chaiHttp);

const createValidComment = async (threadId, text, jwtToken) => {
  const validRequest = {
    jwt: jwtToken,
    author_chain: testAddresses[0].chain,
    chain: testAddresses[0].chain,
    thread_id: threadId,
    address: testAddresses[0].address,
    text,
  };

  const response = await post(
    `/api/threads/${threadId}/comments`,
    validRequest,
    true,
    app
  );

  return response;
};

const createThreadReaction = async (threadId, jwtToken) => {
  const validRequest = {
    jwt: jwtToken,
    author_chain: testAddresses[0].chain,
    chain: testAddresses[0].chain,
    address: testAddresses[0].address,
    thread_id: threadId,
    reaction: 'like',
    canvas_action: '{}',
    canvas_hash:
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    canvas_session: '{}',
  };

  const response = await post(
    `/api/threads/${threadId}/reactions`,
    validRequest,
    true,
    app
  );

  return response;
};

const createCommentReaction = async (commentId, jwtToken) => {
  const validRequest = {
    jwt: jwtToken,
    author_chain: testAddresses[0].chain,
    chain: testAddresses[0].chain,
    address: testAddresses[0].address,
    comment_id: commentId,
    reaction: 'like',
    canvas_action: '{}',
    canvas_hash:
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    canvas_session: '{}',
  };

  const response = await post(
    `/api/comments/${commentId}/reactions`,
    validRequest,
    true,
    app
  );

  return response;
};

const deleteReaction = async (reactionId, jwtToken) => {
  const validRequest = {
    jwt: jwtToken,
  };

  const response = await del(
    `/api/reactions/${reactionId}`,
    validRequest,
    false,
    app
  );

  return response;
};

const getUniqueCommentText = async () => {
  const time = new Date().getMilliseconds();
  const text = `testCommentCreated at ${time}`;
  let comment = await models.Comment.findOne({
    where: { text },
  });
  chai.assert.isNull(comment);
  return text;
};

describe('createReaction Integration Tests', () => {
  let jwtTokenUser1;

  beforeEach(() => {
    jwtTokenUser1 = jwt.sign(
      { id: testUsers[0].id, email: testUsers[0].email },
      JWT_SECRET
    );
  });

  it('should create comment reactions and verify comment reaction count', async () => {
    const text = await getUniqueCommentText();
    const response = await createValidComment(
      testThreads[0].id,
      text,
      jwtTokenUser1
    );
    let comment = await models.Comment.findOne({
      where: { text },
    });
    let beforeReactionCount = comment.reaction_count;
    chai.assert.isNotNull(comment);
    chai.assert.equal(response.status, 'Success');

    const reactionResponse = await createCommentReaction(
      comment.id,
      jwtTokenUser1
    );
    chai.assert.equal(reactionResponse.status, 'Success');

    comment = await models.Comment.findOne({
      where: { text },
    });
    chai.assert.equal(comment.reaction_count, beforeReactionCount + 1);

    const reactionId = reactionResponse.result.id;
    const deleteReactionResponse = await deleteReaction(
      reactionId,
      jwtTokenUser1
    );
    chai.assert.equal(deleteReactionResponse.status, 'Success');

    comment = await models.Comment.findOne({
      where: { text },
    });
    chai.assert.equal(comment.reaction_count, beforeReactionCount);
  });

  it('should create thread reactions and verify thread reaction count', async () => {
    let thread = await models.Thread.findOne({
      where: { id: testThreads[0].id },
    });
    chai.assert.isNotNull(thread);
    let beforeReactionCount = thread.reaction_count;

    const reactionResponse = await createThreadReaction(
      thread.id,
      jwtTokenUser1
    );
    chai.assert.equal(reactionResponse.status, 'Success');

    thread = await models.Thread.findOne({
      where: { id: testThreads[0].id },
    });
    chai.assert.equal(thread.reaction_count, beforeReactionCount + 1);

    const reactionId = reactionResponse.result.id;
    const deleteReactionResponse = await deleteReaction(
      reactionId,
      jwtTokenUser1
    );

    chai.assert.equal(deleteReactionResponse.status, 'Success');

    thread = await models.Thread.findOne({
      where: { id: testThreads[0].id },
    });

    chai.assert.equal(thread.reaction_count, beforeReactionCount);
  });
});
