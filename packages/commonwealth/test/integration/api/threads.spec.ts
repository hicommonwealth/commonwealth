/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable global-require */
/* eslint-disable no-unused-expressions */
import { dispose } from '@hicommonwealth/core';
import { Comment, Thread } from '@hicommonwealth/model';
import chai from 'chai';
import chaiHttp from 'chai-http';
import { Express } from 'express';
import jwt from 'jsonwebtoken';
import { Errors as EditThreadErrors } from 'server/controllers/server_threads_methods/update_thread';
import { Errors as ViewCountErrors } from 'server/routes/viewCount';
import sleep from 'sleep-promise';
import { afterAll, beforeAll, beforeEach, describe, test } from 'vitest';
import { TestServer, testServer } from '../../../server-test';
import { config } from '../../../server/config';
import { markdownComment } from '../../util/fixtures/markdownComment';

chai.use(chaiHttp);
const { expect } = chai;

async function update(
  app: Express,
  address: string,
  payload: Record<string, unknown>,
) {
  return await chai
    .request(app)
    .post(`/api/v1/UpdateThread`)
    .set('Accept', 'application/json')
    .set('address', address)
    .send(payload);
}

// @TODO 1/10/24: was not running previously, so set to skip -- needs cleaning
describe.skip('Thread Tests', () => {
  const chain = 'ethereum';
  const chain2 = 'alex';
  // The createThread util uses the chainId parameter to determine
  // author_chain, which is required for authorship lookup.
  // Therefore, a valid chain MUST be included alongside
  // communityId, unlike in non-test thread creation
  const title = 'test title';
  const body = 'test body';
  const bodyWithMentions = 'test body [@Tagged Member](/edgeware/npRis4Nb)';
  let topicId;
  const kind = 'discussion';
  const stage = 'discussion';

  let adminJWT;
  let adminAddress;
  let adminSession;

  let userJWT;
  let userAddress;
  let userSession;

  let userJWT2;
  let userAddress2;
  let userSession2;

  let thread;

  let server: TestServer;

  beforeAll(async () => {
    server = await testServer();

    topicId = await server.seeder.getTopicId({ chain });
    let res = await server.seeder.createAndVerifyAddress({ chain }, 'Alice');
    adminAddress = res.address;
    adminJWT = jwt.sign(
      { id: res.user_id, email: res.email },
      config.AUTH.JWT_SECRET,
    );
    const isAdmin = await server.seeder.updateRole({
      address_id: +res.address_id,
      chainOrCommObj: { chain_id: chain },
      role: 'admin',
    });
    adminSession = { session: res.session, sign: res.sign };
    expect(adminAddress).to.not.be.null;
    expect(adminJWT).to.not.be.null;
    expect(isAdmin).to.not.be.null;

    res = await server.seeder.createAndVerifyAddress({ chain }, 'Alice');
    userAddress = res.address;
    userJWT = jwt.sign(
      { id: res.user_id, email: res.email },
      config.AUTH.JWT_SECRET,
    );
    userSession = { session: res.session, sign: res.sign };
    expect(userAddress).to.not.be.null;
    expect(userJWT).to.not.be.null;

    res = await server.seeder.createAndVerifyAddress(
      { chain: chain2 },
      'Alice',
    );
    userAddress2 = res.address;
    userJWT2 = jwt.sign(
      { id: res.user_id, email: res.email },
      config.AUTH.JWT_SECRET,
    );
    userSession2 = { session: res.session, sign: res.sign };
    expect(userAddress2).to.not.be.null;
    expect(userJWT2).to.not.be.null;
  });

  afterAll(async () => {
    await dispose()();
  });

  describe('POST /threads', () => {
    const readOnly = true;

    test('should fail to create a thread without a kind', async () => {
      const tRes = await server.seeder.createThread({
        address: userAddress,
        // @ts-expect-error StrictNullChecks
        kind: null,
        stage,
        chainId: chain,
        title,
        topicId,
        body,
        jwt: userJWT,
        session: userSession.session,
        sign: userSession.sign,
      });
      expect(tRes).to.not.be.null;
      expect(tRes.error).to.not.be.null;
      expect(tRes.error).to.be.equal(Thread.CreateThreadErrors.UnsupportedKind);
    });

    test('should fail to create a forum thread with an empty title', async () => {
      const tRes = await server.seeder.createThread({
        address: userAddress,
        kind,
        stage,
        chainId: chain,
        title: '',
        topicId,
        body,
        jwt: userJWT,
        session: userSession.session,
        sign: userSession.sign,
      });
      expect(tRes).to.not.be.null;
      expect(tRes.error).to.not.be.null;
      expect(tRes.error).to.be.equal(
        Thread.CreateThreadErrors.DiscussionMissingTitle,
      );
    });

    test('should fail to create a link thread with an empty title', async () => {
      const tRes = await server.seeder.createThread({
        address: userAddress,
        kind: 'link',
        stage,
        chainId: chain,
        title: '',
        topicId,
        body,
        url: 'http://commonwealth.im',
        jwt: userJWT,
        session: userSession.session,
        sign: userSession.sign,
      });
      expect(tRes).to.not.be.null;
      expect(tRes.error).to.not.be.null;
      expect(tRes.error).to.be.equal(
        Thread.CreateThreadErrors.LinkMissingTitleOrUrl,
      );
    });

    test('should fail to create a link thread with an empty URL', async () => {
      const tRes = await server.seeder.createThread({
        address: userAddress,
        kind: 'link',
        stage,
        chainId: chain,
        title,
        topicId,
        body,
        // @ts-expect-error StrictNullChecks
        url: null,
        jwt: userJWT,
        session: userSession.session,
        sign: userSession.sign,
      });
      expect(tRes).to.not.be.null;
      expect(tRes.error).to.not.be.null;
      expect(tRes.error).to.be.equal(
        Thread.CreateThreadErrors.LinkMissingTitleOrUrl,
      );
    });

    test('should fail to create a comment on a readOnly thread', async () => {
      const tRes = await server.seeder.createThread({
        address: userAddress,
        kind,
        stage,
        chainId: chain,
        title,
        topicId,
        body,
        readOnly,
        jwt: userJWT,
        session: userSession.session,
        sign: userSession.sign,
      });
      console.log({ tRes });
      expect(tRes).not.to.be.null;
      expect(tRes.status).to.be.equal('Success');
      // @ts-expect-error StrictNullChecks
      expect(tRes.result.read_only).to.be.equal(true);
      const cRes = await server.seeder.createComment({
        chain,
        address: userAddress,
        jwt: userJWT,
        text: markdownComment.text,
        // @ts-expect-error StrictNullChecks
        thread_id: tRes.result.id,
        session: userSession.session,
        sign: userSession.sign,
      });
      expect(cRes).not.to.be.null;
      expect(cRes.error).not.to.be.null;
    });

    test('should create a discussion thread', async () => {
      const res = await server.seeder.createThread({
        address: userAddress,
        kind,
        stage,
        chainId: chain,
        title,
        topicId,
        body,
        jwt: userJWT,
        session: userSession.session,
        sign: userSession.sign,
      });
      expect(res.status).to.equal('Success');
      expect(res.result).to.not.be.null;
      // @ts-expect-error StrictNullChecks
      expect(res.result.title).to.equal(encodeURIComponent(title));
      // @ts-expect-error StrictNullChecks
      expect(res.result.body).to.equal(encodeURIComponent(body));
      // @ts-expect-error StrictNullChecks
      expect(res.result.Address).to.not.be.null;
      // @ts-expect-error StrictNullChecks
      expect(res.result.Address.address).to.equal(userAddress);
    });

    test('should fail to create a thread without a topic name (if the community has topics)', async () => {
      const tRes = await server.seeder.createThread({
        address: userAddress,
        kind,
        stage,
        chainId: chain,
        title,
        body,
        jwt: userJWT,
        session: userSession.session,
        sign: userSession.sign,
      });
      expect(tRes).to.not.be.null;
      expect(tRes.error).to.not.be.null;
    });

    test('should create a thread with mentions to non-existent addresses', async () => {
      const res = await server.seeder.createThread({
        address: userAddress,
        kind,
        stage,
        chainId: chain,
        title,
        topicId,
        body: bodyWithMentions,
        jwt: userJWT,
        session: userSession.session,
        sign: userSession.sign,
      });
      expect(res.status).to.equal('Success');
      expect(res.result).to.not.be.null;
      // @ts-expect-error StrictNullChecks
      expect(res.result.title).to.equal(encodeURIComponent(title));
      // @ts-expect-error StrictNullChecks
      expect(res.result.body).to.equal(encodeURIComponent(bodyWithMentions));
      // @ts-expect-error StrictNullChecks
      expect(res.result.Address).to.not.be.null;
      // @ts-expect-error StrictNullChecks
      expect(res.result.Address.address).to.equal(userAddress);
    });

    test('Thread Create should fail because address does not have permission', async () => {
      const res2 = await server.seeder.createThread({
        address: userAddress2,
        kind,
        stage,
        chainId: chain2,
        title,
        topicId,
        body,
        jwt: userJWT2,
        session: userSession2.session,
        sign: userSession2.sign,
      });
      expect(res2.status).not.to.be.equal('Success');
    });
  });

  describe('/threads (bulkThreads)', () => {
    test('should return bulk threads for a public chain', async () => {
      const res = await chai.request
        .agent(server.app)
        .get('/api/threads')
        .set('Accept', 'application/json')
        .query({
          bulk: true,
          chain,
          jwt: adminJWT,
        });
      expect(res.body.result).to.not.be.null;
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
    });

    // test.skip('should pass as admin of private community', async () => {
    //   const communityArgs: CommunityArgs = {
    //     jwt: userJWT,
    //     isAuthenticatedForum: 'false',
    //     privacyEnabled: 'true',
    //     id: 'test',
    //     name: 'test community',
    //     creator_address: userAddress,
    //     creator_chain: chain,
    //     description: 'test enabled community',
    //     default_chain: chain,
    //   };

    //   await server.seeder.createCommunity(communityArgs);
    // });
  });

  describe('/thread/:id/comments', () => {
    beforeEach(async () => {
      const res2 = await server.seeder.createThread({
        address: userAddress,
        kind,
        stage,
        chainId: chain,
        title,
        topicId,
        body,
        jwt: userJWT,
        session: userSession.session,
        sign: userSession.sign,
      });
      expect(res2.status).to.be.equal('Success');
      expect(res2.result).to.not.be.null;
      thread = res2.result;
    });

    test('should create a comment for a thread', async () => {
      const cRes = await server.seeder.createComment({
        chain,
        address: userAddress,
        jwt: userJWT,
        text: markdownComment.text,
        thread_id: thread.id,
        session: userSession.session,
        sign: userSession.sign,
      });

      expect(cRes.status).to.equal('Success');
      expect(cRes.result).to.not.be.null;
      expect(cRes.result.thread_id).to.equal(thread.id);
      expect(cRes.result.text).to.equal(markdownComment.text);
      expect(cRes.result.Address).to.not.be.null;
      expect(cRes.result.Address.address).to.equal(userAddress);
    });

    test('should create a comment for a thread with an non-existent mention', async () => {
      const cRes = await server.seeder.createComment({
        chain,
        address: userAddress,
        jwt: userJWT,
        text: bodyWithMentions,
        thread_id: thread.id,
        session: userSession.session,
        sign: userSession.sign,
      });

      expect(cRes.status).to.equal('Success');
      expect(cRes.result).to.not.be.null;
      expect(cRes.result.thread_id).to.equal(thread.id);
      expect(cRes.result.text).to.equal(bodyWithMentions);
      expect(cRes.result.Address).to.not.be.null;
      expect(cRes.result.Address.address).to.equal(userAddress);
    });

    test('should create a comment reply for a comment', async () => {
      let cRes = await server.seeder.createComment({
        chain,
        address: userAddress,
        jwt: userJWT,
        text: markdownComment.text,
        thread_id: thread.id,
        session: userSession.session,
        sign: userSession.sign,
      });
      const parentId = cRes.result.id;
      cRes = await server.seeder.createComment({
        chain,
        address: userAddress,
        jwt: userJWT,
        text: markdownComment.text,
        thread_id: thread.id,
        parentCommentId: `${parentId}`,
        session: userSession.session,
        sign: userSession.sign,
      });

      expect(cRes.status).to.equal('Success');
      expect(cRes.result).to.not.be.null;
      expect(cRes.result.thread_id).to.equal(thread.id);
      expect(cRes.result.parent_id).to.equal(`${parentId}`);
      expect(cRes.result.text).to.equal(markdownComment.text);
      expect(cRes.result.Address).to.not.be.null;
      expect(cRes.result.Address.address).to.equal(userAddress);
    });

    test('should fail to create a comment without a thread_id', async () => {
      const cRes = await server.seeder.createComment({
        chain,
        address: userAddress,
        jwt: userJWT,
        text: markdownComment.text,
        thread_id: null,
        session: userSession.session,
        sign: userSession.sign,
      });

      expect(cRes.error).to.not.be.null;
    });

    test('should fail to create a comment without text', async () => {
      const cRes = await server.seeder.createComment({
        chain,
        address: userAddress,
        jwt: userJWT,
        text: null,
        thread_id: thread.id,
        session: userSession.session,
        sign: userSession.sign,
      });

      expect(cRes.error).to.not.be.null;
    });

    test('should fail to create a comment on a non-existent thread', async () => {
      const cRes = await server.seeder.createComment({
        chain,
        address: userAddress,
        jwt: userJWT,
        text: 'test',
        thread_id: -1,
        session: userSession.session,
        sign: userSession.sign,
      });

      expect(cRes.error).to.not.be.null;
    });
  });

  describe('/editThread', () => {
    beforeEach(async () => {
      const res2 = await server.seeder.createThread({
        address: adminAddress,
        kind,
        stage,
        chainId: chain,
        title,
        topicId,
        body,
        jwt: adminJWT,
        session: adminSession.session,
        sign: adminSession.sign,
      });
      expect(res2.status).to.be.equal('Success');
      expect(res2.result).to.not.be.null;
      thread = res2.result;
    });

    test("should fail to edit an admin's post as a user", async () => {
      const thread_kind = thread.kind;
      const thread_stage = thread.stage;
      const readOnly = false;
      const res = await update(server.app, userAddress, {
        chain,
        address: adminAddress,
        author_chain: chain,
        kind: thread_kind,
        stage: thread_stage,
        body: thread.body,
        read_only: readOnly,
        jwt: userJWT,
      });
      expect(res.body.error).to.not.be.null;
      expect(res.status).to.be.equal(400);
    });

    test('should fail to edit a thread without passing a thread id', async () => {
      const thread_kind = thread.kind;
      const thread_stage = thread.stage;
      const readOnly = false;
      const res = await update(server.app, userAddress, {
        chain,
        address: adminAddress,
        author_chain: chain,
        thread_id: null,
        kind: thread_kind,
        stage: thread_stage,
        body: thread.body,
        read_only: readOnly,
        jwt: adminJWT,
      });
      expect(res.body.error).to.not.be.null;
      expect(res.status).to.be.equal(400);
    });

    test('should fail to edit a thread without passing a body', async () => {
      const thread_id = thread.id;
      const thread_kind = thread.kind;
      const thread_stage = thread.stage;
      const readOnly = false;
      const res = await update(server.app, userAddress, {
        chain,
        address: adminAddress,
        author_chain: chain,
        thread_id,
        kind: thread_kind,
        stage: thread_stage,
        body: null,
        read_only: readOnly,
        jwt: adminJWT,
      });
      expect(res.body.error).to.not.be.null;
      expect(res.status).to.be.equal(400);
      expect(res.body.error).to.be.equal(EditThreadErrors.NoBody);
    });

    test(
      'should succeed in updating a thread body',
      { timeout: 400_000 },
      async () => {
        const thread_id = thread.id;
        const thread_kind = thread.kind;
        const thread_stage = thread.stage;
        const newBody = 'new Body';
        const readOnly = false;
        const res = await update(server.app, userAddress, {
          chain,
          address: adminAddress,
          author_chain: chain,
          thread_id,
          kind: thread_kind,
          stage: thread_stage,
          body: newBody,
          read_only: readOnly,
          jwt: adminJWT,
        });
        expect(res.status).to.be.equal(200);
        expect(res.body.result.body).to.be.equal(newBody);
      },
    );

    test('should succeed in updating a thread title', async () => {
      const thread_id = thread.id;
      const thread_kind = thread.kind;
      const thread_stage = thread.stage;
      const newTitle = 'new Title';
      const readOnly = false;
      const res = await update(server.app, userAddress, {
        chain,
        address: adminAddress,
        author_chain: chain,
        thread_id,
        kind: thread_kind,
        stage: thread_stage,
        body: thread.body,
        title: newTitle,
        read_only: readOnly,
        jwt: adminJWT,
      });
      expect(res.status).to.be.equal(200);
      expect(res.body.result.title).to.be.equal(newTitle);
    });
  });

  describe('/updateThreadPrivacy', () => {
    let tempThread;

    test('should turn on readonly', async () => {
      const res1 = await server.seeder.createThread({
        address: userAddress,
        kind,
        stage,
        chainId: chain,
        title,
        topicId,
        body,
        jwt: userJWT,
        session: userSession.session,
        sign: userSession.sign,
      });
      expect(res1.result).to.not.be.null;
      tempThread = res1.result;
      const res = await chai
        .request(server.app)
        .post('/api/updateThreadPrivacy')
        .set('Accept', 'application/json')
        .send({
          thread_id: tempThread.id,
          read_only: 'true',
          jwt: userJWT,
        });
      expect(res.status).to.be.equal(200);
      expect(res.body.result.read_only).to.be.true;
    });

    test('should fail to comment on a read_only thread', async () => {
      // create new user + jwt
      const res = await server.seeder.createAndVerifyAddress(
        { chain },
        'Alice',
      );
      const newUserJWT = jwt.sign(
        { id: res.user_id, email: res.email },
        config.AUTH.JWT_SECRET,
      );
      // try to comment and fail
      const cRes = await server.seeder.createComment({
        chain,
        address: res.address,
        jwt: newUserJWT,
        text: 'hello world',
        thread_id: tempThread.id,
        session: res.session,
        sign: res.sign,
      });
      expect(cRes.result).to.be.undefined;
      expect(cRes.error).to.be.equal(
        Comment.CreateCommentErrors.CantCommentOnReadOnly,
      );
    });

    test('should turn off readonly as an admin of community', async () => {
      const res = await chai
        .request(server.app)
        .post('/api/updateThreadPrivacy')
        .set('Accept', 'application/json')
        .send({
          thread_id: tempThread.id,
          read_only: 'false',
          jwt: adminJWT,
        });
      expect(res.status).to.be.equal(200);
      expect(res.body.result.read_only).to.be.false;
    });
  });

  describe('/comments/:id', () => {
    test('should edit a comment', async () => {
      const text = 'tes text';
      const tRes = await server.seeder.createThread({
        chainId: chain,
        address: userAddress,
        jwt: userJWT,
        title,
        body,
        topicId,
        kind,
        stage,
        session: userSession.session,
        sign: userSession.sign,
      });
      const cRes = await server.seeder.createComment({
        chain,
        address: userAddress,
        jwt: userJWT,
        text: markdownComment.text,
        // @ts-expect-error StrictNullChecks
        thread_id: tRes.result.id,
        session: userSession.session,
        sign: userSession.sign,
      });
      const eRes = await server.seeder.editComment({
        text,
        jwt: userJWT,
        comment_id: cRes.result.id,
        address: userAddress,
        chain,
      });
      expect(eRes).not.to.be.null;
      expect(eRes.status).to.be.equal('Success');
      expect(eRes.result).not.to.be.null;
      expect(eRes.result.chain).to.be.equal(chain);
      // @ts-expect-error StrictNullChecks
      expect(eRes.result.thread_id).to.be.equal(tRes.result.id);
    });
  });

  describe('/viewCount', () => {
    test('should track views on chain', async () => {
      const threadRes = await server.seeder.createThread({
        address: userAddress,
        kind,
        stage,
        chainId: chain,
        title,
        topicId,
        body,
        jwt: userJWT,
        session: userSession.session,
        sign: userSession.sign,
      });
      // @ts-expect-error StrictNullChecks
      const object_id = threadRes.result.id;
      expect(object_id).to.not.be.null;
      // should track first view
      let res = await chai
        .request(server.app)
        .post('/api/viewCount')
        .set('Accept', 'application/json')
        .send({ chain, object_id });
      expect(res.status).to.equal(200);
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.equal('Success');
      expect(res.body.result).to.not.be.null;
      expect(res.body.result.view_count).to.equal(1);

      // should ignore second view, same IP
      res = await chai
        .request(server.app)
        .post('/api/viewCount')
        .set('Accept', 'application/json')
        .send({ chain, object_id });
      expect(res.status).to.equal(200);
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.equal('Success');
      expect(res.body.result).to.not.be.null;
      expect(res.body.result.view_count).to.equal(1);

      // sleep a second and verify cache invalidation
      await sleep(1000);
      res = await chai
        .request(server.app)
        .post('/api/viewCount')
        .set('Accept', 'application/json')
        .send({ chain, object_id });
      expect(res.status).to.equal(200);
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.equal('Success');
      expect(res.body.result).to.not.be.null;
      expect(res.body.result.view_count).to.equal(2);
    });

    test('should track views on community', async () => {
      const threadRes = await server.seeder.createThread({
        address: userAddress,
        kind,
        stage,
        chainId: chain,
        title,
        topicId,
        body,
        jwt: userJWT,
        session: userSession.session,
        sign: userSession.sign,
      });
      // @ts-expect-error StrictNullChecks
      const object_id = threadRes.result.id;

      // should track first view
      const res = await chai
        .request(server.app)
        .post('/api/viewCount')
        .set('Accept', 'application/json')
        .send({ chain, object_id });
      expect(res.status).to.equal(200);
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.equal('Success');
      expect(res.body.result).to.not.be.null;
      expect(res.body.result.view_count).to.equal(1);
    });

    test('should not track views without object_id', async () => {
      const res = await chai
        .request(server.app)
        .post('/api/viewCount')
        .set('Accept', 'application/json')
        .send({ chain });
      expect(res.status).to.equal(400);
      expect(res.body).to.not.be.null;
      expect(res.body.error).to.equal(ViewCountErrors.NoObjectId);
    });

    test('should not track views without chain or community', async () => {
      const res = await chai
        .request(server.app)
        .post('/api/viewCount')
        .set('Accept', 'application/json')
        .send({ object_id: '9999' });
      expect(res.status).to.equal(400);
      expect(res.body).to.not.be.null;
      // expect(res.body.error).to.equal(ViewCountErrors.NoChainOrComm);
    });

    test('should not track views with invalid chain or community', async () => {
      const res = await chai
        .request(server.app)
        .post('/api/viewCount')
        .set('Accept', 'application/json')
        .send({ chain: 'adkgjkjgda', object_id: '9999' });
      expect(res.status).to.equal(400);
      expect(res.body).to.not.be.null;
      // expect(res.body.error).to.equal(ViewCountErrors.InvalidChainOrComm);
    });

    test('should not track views with invalid object_id', async () => {
      const res = await chai
        .request(server.app)
        .post('/api/viewCount')
        .set('Accept', 'application/json')
        .send({ chain, object_id: '9999' });
      expect(res.status).to.equal(400);
      expect(res.body).to.not.be.null;
      expect(res.body.error).to.equal(ViewCountErrors.InvalidThread);
    });
  });

  describe('/updateThreadPinned route tests', () => {
    let pinThread;
    beforeAll(async () => {
      const res = await server.seeder.createThread({
        address: userAddress,
        kind,
        stage,
        chainId: chain,
        title,
        topicId,
        body,
        jwt: userJWT,
        session: userSession.session,
        sign: userSession.sign,
      });
      // @ts-expect-error StrictNullChecks
      pinThread = res.result.id;
    });

    test('admin can toggle thread to pinned', async () => {
      const res2 = await chai
        .request(server.app)
        .post('/api/updateThreadPinned')
        .set('Accept', 'application/json')
        .send({ thread_id: pinThread, jwt: adminJWT });
      expect(res2.body.status).to.be.equal('Success');
      expect(res2.body.result.pinned).to.be.true;
    });

    test('admin can toggle thread to unpinned', async () => {
      const res2 = await chai
        .request(server.app)
        .post('/api/updateThreadPinned')
        .set('Accept', 'application/json')
        .send({ thread_id: pinThread, jwt: adminJWT });
      expect(res2.body.status).to.be.equal('Success');
      expect(res2.body.result.pinned).to.be.false;
    });
  });
});
