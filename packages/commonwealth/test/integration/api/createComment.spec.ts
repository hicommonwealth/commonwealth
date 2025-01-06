import { dispose } from '@hicommonwealth/core';
import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import Chance from 'chance';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, beforeEach, describe, test } from 'vitest';
import { TestServer, testServer } from '../../../server-test';
import { config } from '../../../server/config';

chai.use(chaiHttp);
const chance = new Chance();

describe('createComment Integration Tests', () => {
  let jwtTokenUser1;
  let server: TestServer;

  const getThreadCommentCount = async (threadId) => {
    const thread = await server.models.Thread.findOne({
      where: { id: threadId },
    });
    // @ts-expect-error StrictNullChecks
    return thread.comment_count;
  };

  const createValidComment = async (threadId, text, jwtToken) => {
    const validRequest = {
      jwt: jwtToken,
      author_chain: server.e2eTestEntities.testAddresses[0].community_id,
      chain: server.e2eTestEntities.testAddresses[0].community_id,
      thread_id: threadId,
      address: server.e2eTestEntities.testAddresses[0].address,
      text,
    };
    return await chai
      .request(server.app)
      .post(`/api/v1/CreateComment`)
      .set('address', validRequest.address)
      .send(validRequest);
  };

  const getUniqueCommentText = async () => {
    const time = new Date().getMilliseconds();
    const body = `${chance.name()} at ${time}`;
    const comment = await server.models.Comment.findOne({
      where: { body },
    });
    chai.assert.isNull(comment);
    return body;
  };

  const deleteComment = async (commentId, jwtToken) => {
    const validRequest = {
      jwt: jwtToken,
      author_chain: server.e2eTestEntities.testAddresses[0].community_id,
      chain: server.e2eTestEntities.testAddresses[0].community_id,
      address: server.e2eTestEntities.testAddresses[0].address,
    };
    return await chai
      .request(server.app)
      .post(`/api/v1/DeleteComment`)
      .set('address', validRequest.address)
      .send(validRequest);
  };

  beforeAll(async () => {
    server = await testServer();
  });

  afterAll(async () => {
    await dispose()();
  });

  beforeEach(() => {
    jwtTokenUser1 = jwt.sign(
      {
        id: server.e2eTestEntities.testUsers[0].id,
        email: server.e2eTestEntities.testUsers[0].email,
      },
      config.AUTH.JWT_SECRET,
    );
  });

  test('should return an error response if no text is specified', async () => {
    const invalidRequest = {
      jwt: jwtTokenUser1,
      author_chain: server.e2eTestEntities.testAddresses[0].community_id,
      chain: server.e2eTestEntities.testAddresses[0].community_id,
      address: server.e2eTestEntities.testAddresses[0].address,
      thread_id: server.e2eTestEntities.testThreads[0].id,
    };
    const response = await chai
      .request(server.app)
      .post(`/api/v1/CreateComment`)
      .set('address', invalidRequest.address)
      .send(invalidRequest);
    expect(response.status).to.eq(400);
  });

  test('should return an error response if an invalid parent id is specified', async () => {
    const invalidRequest = {
      jwt: jwtTokenUser1,
      author_chain: server.e2eTestEntities.testAddresses[0].community_id,
      chain: server.e2eTestEntities.testAddresses[0].community_id,
      address: server.e2eTestEntities.testAddresses[0].address,
      thread_id: server.e2eTestEntities.testThreads[0].id,
      parent_id: -10,
      text: 'test',
    };
    const response = await chai
      .request(server.app)
      .post(`/api/v1/CreateComment`)
      .set('address', invalidRequest.address)
      .send(invalidRequest);
    expect(response.status).to.eq(400);
  });

  // TODO: negative thread ids are not valid in new API
  test.skip('should create comment and return a success response', async () => {
    const body = await getUniqueCommentText();
    const response = await createValidComment(
      server.e2eTestEntities.testThreads[0].id,
      body,
      jwtTokenUser1,
    );
    chai.assert.equal(response.status, 200);
    const comment = await server.models.Comment.findOne({
      where: { body },
    });
    chai.assert.isNotNull(comment);
  });

  // TODO: negative thread ids are not valid in new API
  test.skip('should create and delete comment and verify thread comment counts', async () => {
    const body = await getUniqueCommentText();
    const beforeCommentCount = await getThreadCommentCount(
      server.e2eTestEntities.testThreads[0].id,
    );

    const response = await createValidComment(
      server.e2eTestEntities.testThreads[0].id,
      body,
      jwtTokenUser1,
    );

    let comment = await server.models.Comment.findOne({
      where: { body },
    });
    let afterCommentCount = await getThreadCommentCount(
      server.e2eTestEntities.testThreads[0].id,
    );

    chai.assert.equal(afterCommentCount, beforeCommentCount! + 1);
    chai.assert.isNotNull(comment);
    chai.assert.equal(response.status, 200);

    const deleteResponse = await deleteComment(comment!.id, jwtTokenUser1);
    comment = await server.models.Comment.findOne({
      where: { body },
    });
    afterCommentCount = await getThreadCommentCount(
      server.e2eTestEntities.testThreads[0].id,
    );

    chai.assert.isNull(comment);
    chai.assert.equal(afterCommentCount, beforeCommentCount!);
    chai.assert.equal(deleteResponse.status, 200);
  });
});
