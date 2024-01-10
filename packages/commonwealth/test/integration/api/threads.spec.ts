/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable no-unused-expressions */
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from 'server/config';
import { Errors as CreateThreadErrors } from 'server/controllers/server_threads_methods/create_thread';
import { Errors as EditThreadErrors } from 'server/controllers/server_threads_methods/update_thread';
import { Errors as CreateCommentErrors } from 'server/routes/threads/create_thread_comment_handler';
import { Errors as EditThreadHandlerErrors } from 'server/routes/threads/update_thread_handler';
import { Errors as ViewCountErrors } from 'server/routes/viewCount';
import sleep from 'sleep-promise';
import * as modelUtils from 'test/util/modelUtils';
import app, { resetDatabase } from '../../../server-test';
import { markdownComment } from '../../util/fixtures/markdownComment';

chai.use(chaiHttp);
const { expect } = chai;

describe('Thread Tests', () => {
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

  before(async () => {
    await resetDatabase();
    topicId = await modelUtils.getTopicId({ chain });
    let res = await modelUtils.createAndVerifyAddress({ chain });
    adminAddress = res.address;
    adminJWT = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
    const isAdmin = await modelUtils.updateRole({
      address_id: res.address_id,
      chainOrCommObj: { chain_id: chain },
      role: 'admin',
    });
    adminSession = { session: res.session, sign: res.sign };
    expect(adminAddress).to.not.be.null;
    expect(adminJWT).to.not.be.null;
    expect(isAdmin).to.not.be.null;

    res = await modelUtils.createAndVerifyAddress({ chain });
    userAddress = res.address;
    userJWT = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
    userSession = { session: res.session, sign: res.sign };
    expect(userAddress).to.not.be.null;
    expect(userJWT).to.not.be.null;

    res = await modelUtils.createAndVerifyAddress({ chain: chain2 });
    userAddress2 = res.address;
    userJWT2 = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
    userSession2 = { session: res.session, sign: res.sign };
    expect(userAddress2).to.not.be.null;
    expect(userJWT2).to.not.be.null;

    describe('POST /threads', () => {
      const readOnly = true;

      it('should fail to create a thread without a kind', async () => {
        const tRes = await modelUtils.createThread({
          address: userAddress,
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
        expect(tRes.error).to.be.equal(CreateThreadErrors.UnsupportedKind);
      });

      it('should fail to create a forum thread with an empty title', async () => {
        const tRes = await modelUtils.createThread({
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
          CreateThreadErrors.DiscussionMissingTitle,
        );
      });

      it('should fail to create a link thread with an empty title', async () => {
        const tRes = await modelUtils.createThread({
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
          CreateThreadErrors.LinkMissingTitleOrUrl,
        );
      });

      it('should fail to create a link thread with an empty URL', async () => {
        const tRes = await modelUtils.createThread({
          address: userAddress,
          kind: 'link',
          stage,
          chainId: chain,
          title,
          topicId,
          body,
          url: null,
          jwt: userJWT,
          session: userSession.session,
          sign: userSession.sign,
        });
        expect(tRes).to.not.be.null;
        expect(tRes.error).to.not.be.null;
        expect(tRes.error).to.be.equal(
          CreateThreadErrors.LinkMissingTitleOrUrl,
        );
      });

      it('should fail to create a comment on a readOnly thread', async () => {
        const tRes = await modelUtils.createThread({
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
        expect(tRes.result.read_only).to.be.equal(true);
        const cRes = await modelUtils.createComment({
          chain,
          address: userAddress,
          jwt: userJWT,
          text: markdownComment.text,
          thread_id: tRes.result.id,
          session: userSession.session,
          sign: userSession.sign,
        });
        expect(cRes).not.to.be.null;
        expect(cRes.error).not.to.be.null;
      });

      it('should create a discussion thread', async () => {
        const res = await modelUtils.createThread({
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
        expect(res.result.title).to.equal(encodeURIComponent(title));
        expect(res.result.body).to.equal(encodeURIComponent(body));
        expect(res.result.Address).to.not.be.null;
        expect(res.result.Address.address).to.equal(userAddress);
      });

      it('should fail to create a thread without a topic name (if the community has topics)', async () => {
        const tRes = await modelUtils.createThread({
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

      it('should create a thread with mentions to non-existent addresses', async () => {
        const res = await modelUtils.createThread({
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
        expect(res.result.title).to.equal(encodeURIComponent(title));
        expect(res.result.body).to.equal(encodeURIComponent(bodyWithMentions));
        expect(res.result.Address).to.not.be.null;
        expect(res.result.Address.address).to.equal(userAddress);
      });

      it('Thread Create should fail because address does not have permission', async () => {
        const res2 = await modelUtils.createThread({
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
      it('should return bulk threads for a public chain', async () => {
        const res = await chai.request
          .agent(app)
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
      it('should return bulk threads for a public community', async () => {
        const res = await chai.request
          .agent(app)
          .get('/api/bulkThreads')
          .set('Accept', 'application/json')
          .query({
            chain,
            jwt: adminJWT,
          });
        expect(res.body.result).to.not.be.null;
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');
      });
      it.skip('should pass as admin of private community', async () => {
        const communityArgs: modelUtils.CommunityArgs = {
          jwt: userJWT,
          isAuthenticatedForum: 'false',
          privacyEnabled: 'true',
          id: 'test',
          name: 'test community',
          creator_address: userAddress,
          creator_chain: chain,
          description: 'test enabled community',
          default_chain: chain,
        };

        await modelUtils.createCommunity(communityArgs);
      });
    });

    describe('/thread/:id/comments', () => {
      beforeEach(async () => {
        const res2 = await modelUtils.createThread({
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

      it('should create a comment for a thread', async () => {
        const cRes = await modelUtils.createComment({
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

      it('should create a comment for a thread with an non-existent mention', async () => {
        const cRes = await modelUtils.createComment({
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

      it('should create a comment reply for a comment', async () => {
        let cRes = await modelUtils.createComment({
          chain,
          address: userAddress,
          jwt: userJWT,
          text: markdownComment.text,
          thread_id: thread.id,
          session: userSession.session,
          sign: userSession.sign,
        });
        const parentId = cRes.result.id;
        cRes = await modelUtils.createComment({
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

      it('should fail to create a comment without a thread_id', async () => {
        const cRes = await modelUtils.createComment({
          chain,
          address: userAddress,
          jwt: userJWT,
          text: markdownComment.text,
          thread_id: null,
          session: userSession.session,
          sign: userSession.sign,
        });

        expect(cRes.error).to.not.be.null;
        expect(cRes.error).to.be.equal(CreateCommentErrors.MissingRootId);
      });

      it('should fail to create a comment without text', async () => {
        const cRes = await modelUtils.createComment({
          chain,
          address: userAddress,
          jwt: userJWT,
          text: null,
          thread_id: thread.id,
          session: userSession.session,
          sign: userSession.sign,
        });

        expect(cRes.error).to.not.be.null;
        expect(cRes.error).to.be.equal(CreateCommentErrors.MissingText);
      });

      it('should fail to create a comment on a non-existent thread', async () => {
        const cRes = await modelUtils.createComment({
          chain,
          address: userAddress,
          jwt: userJWT,
          text: 'test',
          thread_id: -1,
          session: userSession.session,
          sign: userSession.sign,
        });

        expect(cRes.error).to.not.be.null;
        expect(cRes.error).to.be.equal(CreateCommentErrors.MissingRootId);
      });
    });

    describe('/editThread', () => {
      beforeEach(async () => {
        const res2 = await modelUtils.createThread({
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

      it("should fail to edit an admin's post as a user", async () => {
        const thread_kind = thread.kind;
        const thread_stage = thread.stage;
        const readOnly = false;
        const res = await chai
          .request(app)
          .put('/api/editThread')
          .set('Accept', 'application/json')
          .send({
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

      it('should fail to edit a thread without passing a thread id', async () => {
        const thread_kind = thread.kind;
        const thread_stage = thread.stage;
        const readOnly = false;
        const res = await chai
          .request(app)
          .put('/api/editThread')
          .set('Accept', 'application/json')
          .send({
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
        expect(res.body.error).to.be.equal(
          EditThreadHandlerErrors.InvalidThreadID,
        );
      });

      it('should fail to edit a thread without passing a body', async () => {
        const thread_id = thread.id;
        const thread_kind = thread.kind;
        const thread_stage = thread.stage;
        const readOnly = false;
        const res = await chai
          .request(app)
          .put('/api/editThread')
          .set('Accept', 'application/json')
          .send({
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

      it('should succeed in updating a thread body', async () => {
        const thread_id = thread.id;
        const thread_kind = thread.kind;
        const thread_stage = thread.stage;
        const newBody = 'new Body';
        const readOnly = false;
        const res = await chai.request
          .agent(app)
          .put('/api/editThread')
          .set('Accept', 'application/json')
          .send({
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
      }).timeout(400000);

      it('should succeed in updating a thread title', async () => {
        const thread_id = thread.id;
        const thread_kind = thread.kind;
        const thread_stage = thread.stage;
        const newTitle = 'new Title';
        const readOnly = false;
        const res = await chai
          .request(app)
          .put('/api/editThread')
          .set('Accept', 'application/json')
          .send({
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

      it('should turn on readonly', async () => {
        const res1 = await modelUtils.createThread({
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
          .request(app)
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

      it('should fail to comment on a read_only thread', async () => {
        // create new user + jwt
        const res = await modelUtils.createAndVerifyAddress({ chain });
        const newUserJWT = jwt.sign(
          { id: res.user_id, email: res.email },
          JWT_SECRET,
        );
        // try to comment and fail
        const cRes = await modelUtils.createComment({
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
          CreateCommentErrors.CantCommentOnReadOnly,
        );
      });

      it('should turn off readonly as an admin of community', async () => {
        const res = await chai
          .request(app)
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
      it('should edit a comment', async () => {
        const text = 'tes text';
        const tRes = await modelUtils.createThread({
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
        const cRes = await modelUtils.createComment({
          chain,
          address: userAddress,
          jwt: userJWT,
          text: markdownComment.text,
          thread_id: tRes.result.id,
          session: userSession.session,
          sign: userSession.sign,
        });
        const eRes = await modelUtils.editComment({
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
        expect(eRes.result.thread_id).to.be.equal(tRes.result.id);
      });
    });

    describe('/viewCount', () => {
      it('should track views on chain', async () => {
        const threadRes = await modelUtils.createThread({
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
        const object_id = threadRes.result.id;
        expect(object_id).to.not.be.null;
        // should track first view
        let res = await chai
          .request(app)
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
          .request(app)
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
          .request(app)
          .post('/api/viewCount')
          .set('Accept', 'application/json')
          .send({ chain, object_id });
        expect(res.status).to.equal(200);
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.equal('Success');
        expect(res.body.result).to.not.be.null;
        expect(res.body.result.view_count).to.equal(2);
      });

      it('should track views on community', async () => {
        const threadRes = await modelUtils.createThread({
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
        const object_id = threadRes.result.id;

        // should track first view
        const res = await chai
          .request(app)
          .post('/api/viewCount')
          .set('Accept', 'application/json')
          .send({ chain, object_id });
        expect(res.status).to.equal(200);
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.equal('Success');
        expect(res.body.result).to.not.be.null;
        expect(res.body.result.view_count).to.equal(1);
      });

      it('should not track views without object_id', async () => {
        const res = await chai
          .request(app)
          .post('/api/viewCount')
          .set('Accept', 'application/json')
          .send({ chain });
        expect(res.status).to.equal(400);
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.equal(ViewCountErrors.NoObjectId);
      });

      it('should not track views without chain or community', async () => {
        const res = await chai
          .request(app)
          .post('/api/viewCount')
          .set('Accept', 'application/json')
          .send({ object_id: '9999' });
        expect(res.status).to.equal(400);
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.equal(ViewCountErrors.NoChainOrComm);
      });

      it('should not track views with invalid chain or community', async () => {
        const res = await chai
          .request(app)
          .post('/api/viewCount')
          .set('Accept', 'application/json')
          .send({ chain: 'adkgjkjgda', object_id: '9999' });
        expect(res.status).to.equal(400);
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.equal(ViewCountErrors.InvalidChainOrComm);
      });

      it('should not track views with invalid object_id', async () => {
        const res = await chai
          .request(app)
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
      before(async () => {
        const res = await modelUtils.createThread({
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
        pinThread = res.result.id;
      });

      it('admin can toggle thread to pinned', async () => {
        const res2 = await chai
          .request(app)
          .post('/api/updateThreadPinned')
          .set('Accept', 'application/json')
          .send({ thread_id: pinThread, jwt: adminJWT });
        expect(res2.body.status).to.be.equal('Success');
        expect(res2.body.result.pinned).to.be.true;
      });

      it('admin can toggle thread to unpinned', async () => {
        const res2 = await chai
          .request(app)
          .post('/api/updateThreadPinned')
          .set('Accept', 'application/json')
          .send({ thread_id: pinThread, jwt: adminJWT });
        expect(res2.body.status).to.be.equal('Success');
        expect(res2.body.result.pinned).to.be.false;
      });
    });
  });
});
