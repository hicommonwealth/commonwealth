import { dispose } from '@hicommonwealth/core';
import { commonProtocol } from '@hicommonwealth/model';
import chai, { assert } from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';
import Sinon from 'sinon';
import { afterAll, beforeAll, describe, test } from 'vitest';
import { TestServer, testServer } from '../../../server-test';
import { config } from '../../../server/config';

chai.use(chaiHttp);

describe('createReaction Integration Tests', () => {
  const communityId = 'ethereum';
  let userAddress;
  let userJWT;
  let userSession;
  let threadId: number;
  let server: TestServer;

  const deleteReaction = async (reactionId, jwtToken, address) => {
    const validRequest = {
      jwt: jwtToken,
      address: address.split(':')[2],
      author_chain: 'ethereum',
      chain: 'ethereum',
    };

    const res = await chai
      .request(server.app)
      .delete(`/api/reactions/${reactionId}`)
      .set('Accept', 'application/json')
      .send(validRequest);
    assert.equal((res as any).statusCode, 200);

    return JSON.parse(res.text);
  };

  const getUniqueCommentText = async () => {
    const time = new Date().getMilliseconds();
    const text = `testCommentCreated at ${time}`;
    const comment = await server.models.Comment.findOne({
      where: { text },
    });
    chai.assert.isNull(comment);
    return text;
  };

  beforeAll(async () => {
    server = await testServer();

    const res = await server.seeder.createAndVerifyAddress(
      { chain: communityId },
      'Alice',
    );
    userAddress = res.address;
    Sinon.stub(commonProtocol.contractHelpers, 'getNamespaceBalance').value(
      () => ({ [userAddress.split(':')[2]]: 300 }),
    );
    userJWT = jwt.sign(
      { id: res.user_id, email: res.email },
      config.AUTH.JWT_SECRET,
    );
    userSession = { session: res.session, sign: res.sign };

    const topic = await server.models.Topic.findOne({
      where: {
        community_id: communityId,
        group_ids: [],
      },
    });

    const { result: thread } = await server.seeder.createThread({
      chainId: communityId,
      address: userAddress,
      jwt: userJWT,
      title: 'test1',
      body: 'body1',
      kind: 'discussion',
      stage: 'discussion',
      // @ts-expect-error StrictNullChecks
      topicId: topic.id,
      session: userSession.session,
      sign: userSession.sign,
    });
    // @ts-expect-error StrictNullChecks
    threadId = thread.id;
  });

  afterAll(async () => {
    Sinon.restore();
    await dispose()();
  });

  test('should create comment reactions and verify comment reaction count', async () => {
    const text = await getUniqueCommentText();
    const createCommentResponse = await server.seeder.createComment({
      chain: 'ethereum',
      address: userAddress,
      jwt: userJWT,
      text,
      thread_id: threadId,
      session: userSession.session,
      sign: userSession.sign,
    });

    const comment = await server.models.Comment.findOne({
      where: { text },
    });

    // @ts-expect-error StrictNullChecks
    const beforeReactionCount = comment.reaction_count;

    chai.assert.isNotNull(comment);

    const createReactionResponse = await server.seeder.createReaction({
      chain: communityId,
      address: userAddress,
      jwt: userJWT,
      reaction: 'like',
      comment_id: createCommentResponse.id,
      author_chain: communityId,
      session: userSession.session,
      sign: userSession.sign,
    });

    chai.assert.equal(createReactionResponse.status, 'Success');

    await comment!.reload();
    chai.assert.equal(comment!.reaction_count, beforeReactionCount + 1);

    const reactionId = createReactionResponse.result.id;
    const deleteReactionResponse = await deleteReaction(
      reactionId,
      userJWT,
      userAddress,
    );
    chai.assert.equal(deleteReactionResponse.status, 'Success');

    await comment!.reload();
    chai.assert.equal(comment!.reaction_count, beforeReactionCount);
  });

  test('should create thread reactions and verify thread reaction count', async () => {
    const thread = await server.models.Thread.findOne({
      where: { id: threadId },
    });
    chai.assert.isNotNull(thread);
    const beforeReactionCount = thread!.reaction_count;

    const createReactionResponse = await server.seeder.createThreadReaction({
      chain: 'ethereum',
      address: userAddress,
      jwt: userJWT,
      reaction: 'like',
      thread_id: thread!.id,
      author_chain: 'ethereum',
      session: userSession.session,
      sign: userSession.sign,
    });

    chai.assert.equal(createReactionResponse.status, 'Success');

    await thread!.reload();
    chai.assert.equal(thread!.reaction_count, beforeReactionCount + 1);

    const reactionId = createReactionResponse.result.id;
    const deleteReactionResponse = await deleteReaction(
      reactionId,
      userJWT,
      userAddress,
    );

    chai.assert.equal(deleteReactionResponse.status, 'Success');

    await thread!.reload();
    chai.assert.equal(thread!.reaction_count, beforeReactionCount);
  });
});
