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
  let userDid;
  let userJWT;
  let userSession;
  let threadId: number;
  let threadMsgId: string;
  let server: TestServer;

  const deleteReaction = async (reactionId, jwtToken, address) => {
    const validRequest = {
      jwt: jwtToken,
      address,
      author_chain: 'ethereum',
      chain: 'ethereum',
      community_id: 'ethereum',
      reaction_id: reactionId,
    };

    const res = await chai
      .request(server.app)
      .post(`/api/v1/DeleteReaction`)
      .set('Accept', 'application/json')
      .set('address', address)
      .send(validRequest);
    assert.equal((res as any).statusCode, 200);
    return res?.statusCode === 200;
  };

  const getUniqueCommentText = async () => {
    const time = new Date().getMilliseconds();
    const body = `testCommentCreated at ${time}`;
    const comment = await server.models.Comment.findOne({
      where: { body },
    });
    chai.assert.isNull(comment);
    return body;
  };

  beforeAll(async () => {
    server = await testServer();

    const res = await server.seeder.createAndVerifyAddress(
      { chain: communityId },
      'Alice',
    );
    userAddress = res.address;
    userDid = res.did;
    Sinon.stub(commonProtocol.contractHelpers, 'getNamespaceBalance').value(
      () => ({ [userAddress]: 300 }),
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
      did: userDid,
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
    if (!thread) throw new Error('Thread not created');
    threadMsgId = thread.canvas_msg_id!;
    threadId = thread.id!;
  });

  afterAll(async () => {
    Sinon.restore();
    await dispose()();
  });

  test('should create comment reactions and verify comment reaction count', async () => {
    const body = await getUniqueCommentText();
    const createCommentResponse = await server.seeder.createComment({
      chain: 'ethereum',
      address: userAddress,
      did: userDid,
      jwt: userJWT,
      body,
      threadId: threadId,
      threadMsgId,
      session: userSession.session,
      sign: userSession.sign,
    });

    const comment = await server.models.Comment.findOne({
      where: { body },
    });

    chai.assert.isNotNull(comment);

    const beforeReactionCount = comment!.reaction_count;

    const createReactionResponse = await server.seeder.createReaction({
      chain: communityId,
      address: userAddress,
      did: userDid,
      jwt: userJWT,
      reaction: 'like',
      comment_id: createCommentResponse.id,
      comment_msg_id: createCommentResponse.canvas_msg_id,
      author_chain: communityId,
      session: userSession.session,
      sign: userSession.sign,
    });

    chai.assert.isNotNull(createReactionResponse);

    await comment!.reload();
    chai.assert.equal(comment!.reaction_count, beforeReactionCount + 1);

    const reactionId = createReactionResponse.id;
    const deleteReactionResponse = await deleteReaction(
      reactionId,
      userJWT,
      userAddress,
    );
    chai.assert.equal(deleteReactionResponse, true);

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
      did: userDid,
      jwt: userJWT,
      reaction: 'like',
      thread_id: thread!.id,
      thread_msg_id: thread!.canvas_msg_id!,
      author_chain: 'ethereum',
      session: userSession.session,
      sign: userSession.sign,
    });

    chai.assert.isNotNull(createReactionResponse);

    await thread!.reload();
    chai.assert.equal(thread!.reaction_count, beforeReactionCount! + 1);

    const reactionId = createReactionResponse.id;
    const deleteReactionResponse = await deleteReaction(
      reactionId,
      userJWT,
      userAddress,
    );

    chai.assert.equal(deleteReactionResponse, true);

    await thread!.reload();
    chai.assert.equal(thread!.reaction_count, beforeReactionCount!);
  });
});
