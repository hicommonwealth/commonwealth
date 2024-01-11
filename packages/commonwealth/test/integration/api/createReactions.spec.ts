import chai from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';
import app from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import models from '../../../server/database';
import * as modelUtils from '../../util/modelUtils';
import { del } from './external/appHook.spec';
import { testThreads } from './external/dbEntityHooks.spec';

chai.use(chaiHttp);

const deleteReaction = async (reactionId, jwtToken, userAddress) => {
  const validRequest = {
    jwt: jwtToken,
    address: userAddress,
    author_chain: 'ethereum',
    chain: 'ethereum',
  };

  const response = await del(
    `/api/reactions/${reactionId}`,
    validRequest,
    false,
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

// this test mixes dbEntityHooks which use "cmntest" with resetDatabase which uses
// "ethereum" as the test community -- basically unusable, needs a rewrite.
describe.skip('createReaction Integration Tests', () => {
  let userAddress;
  let userJWT;
  let userSession;

  before(async () => {
    const res = await modelUtils.createAndVerifyAddress({ chain: 'ethereum' });
    userAddress = res.address;
    userJWT = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
    userSession = { session: res.session, sign: res.sign };
  });

  it('should create comment reactions and verify comment reaction count', async () => {
    const text = await getUniqueCommentText();
    const createCommentResponse = await modelUtils.createComment({
      chain: 'ethereum',
      address: userAddress,
      jwt: userJWT,
      text,
      thread_id: testThreads[0].id,
      session: userSession.session,
      sign: userSession.sign,
    });

    let comment = await models.Comment.findOne({
      where: { text },
    });

    const beforeReactionCount = comment.reaction_count;

    chai.assert.isNotNull(comment);
    chai.assert.equal(createCommentResponse.status, 'Success');

    const createReactionResponse = await modelUtils.createReaction({
      chain: 'ethereum',
      address: userAddress,
      jwt: userJWT,
      reaction: 'like',
      comment_id: createCommentResponse.result.id,
      author_chain: 'ethereum',
      session: userSession.session,
      sign: userSession.sign,
    });

    chai.assert.equal(createReactionResponse.status, 'Success');

    comment = await models.Comment.findOne({
      where: { text },
    });
    chai.assert.equal(comment.reaction_count, beforeReactionCount + 1);

    const reactionId = createReactionResponse.result.id;
    const deleteReactionResponse = await deleteReaction(
      reactionId,
      userJWT,
      userAddress,
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
    const beforeReactionCount = thread.reaction_count;

    const createReactionResponse = await modelUtils.createThreadReaction({
      chain: 'ethereum',
      address: userAddress,
      jwt: userJWT,
      reaction: 'like',
      thread_id: thread.id,
      author_chain: 'ethereum',
      session: userSession.session,
      sign: userSession.sign,
    });

    chai.assert.equal(createReactionResponse.status, 'Success');

    thread = await models.Thread.findOne({
      where: { id: testThreads[0].id },
    });
    chai.assert.equal(thread.reaction_count, beforeReactionCount + 1);

    const reactionId = createReactionResponse.result.id;
    const deleteReactionResponse = await deleteReaction(
      reactionId,
      userJWT,
      userAddress,
    );

    chai.assert.equal(deleteReactionResponse.status, 'Success');

    thread = await models.Thread.findOne({
      where: { id: testThreads[0].id },
    });

    chai.assert.equal(thread.reaction_count, beforeReactionCount);
  });
});
