/* eslint-disable global-require */
/* eslint-disable no-unused-expressions */
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import jwt from 'jsonwebtoken';
import sleep from 'sleep-promise';
import moment from 'moment';
import { Errors as ThreadErrors } from 'server/routes/createThread';
import { Errors as EditThreadErrors } from 'server/routes/editThread';
import { Errors as CreateCommentErrors } from 'server/routes/createComment';
import app, { resetDatabase } from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import * as modelUtils from '../../util/modelUtils';

chai.use(chaiHttp);
const { expect } = chai;
const markdownComment = require('../../util/fixtures/markdownComment');

describe('Thread Tests', () => {
  const community = 'staking';
  const chain = 'ethereum';

  const markdownThread = require('../../util/fixtures/markdownThread');
  let adminJWT;
  let adminAddress;
  let userJWT;
  let userAddress;
  let thread;

  before(async () => {
    await resetDatabase();
    let res = await modelUtils.createAndVerifyAddress({ chain });
    adminAddress = res.address;
    adminJWT = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
    const isAdmin = await modelUtils.assignRole({
      address_id: res.address_id,
      chainOrCommObj: { offchain_community_id: community },
      role: 'admin',
    });
    expect(adminAddress).to.not.be.null;
    expect(adminJWT).to.not.be.null;
    expect(isAdmin).to.not.be.null;

    res = await modelUtils.createAndVerifyAddress({ chain });
    userAddress = res.address;
    userJWT = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
    expect(userAddress).to.not.be.null;
    expect(userJWT).to.not.be.null;
  });

  describe('/createThread', () => {
    const title = 'test title';
    const body = 'test body';
    const kind = 'forum';
    const readOnly = true;

    it('should create a discussion thread', async () => {
      const res = await modelUtils.createThread({
        chain,
        address: userAddress,
        jwt: userJWT,
        title,
        body,
        kind,
      });
      expect(res.status).to.equal('Success');
      expect(res.result).to.not.be.null;
      expect(res.result.title).to.equal(encodeURIComponent(title));
      expect(res.result.body).to.equal(encodeURIComponent(body));
      expect(res.result.Address).to.not.be.null;
      expect(res.result.Address.address).to.equal(userAddress);
    });

    it('should fail to create a thread without a kind', async () => {
      const tRes = await modelUtils.createThread({
        chain,
        address: adminAddress,
        jwt: adminJWT,
        title,
        body,
        readOnly,
        kind: null,
      });
      expect(tRes).to.not.be.null;
      expect(tRes.error).to.not.be.null;
      expect(tRes.error).to.be.equal(ThreadErrors.UnsupportedKind);
    });

    it('should fail to create a forum thread with an empty title', async () => {
      const tRes = await modelUtils.createThread({
        chain,
        address: adminAddress,
        jwt: adminJWT,
        title: '',
        body,
        readOnly,
        kind,
      });
      expect(tRes).to.not.be.null;
      expect(tRes.error).to.not.be.null;
      expect(tRes.error).to.be.equal(ThreadErrors.ForumMissingTitle);
    });

    it('should fail to create a question thread with an empty title', async () => {
      const tRes = await modelUtils.createThread({
        chain,
        address: adminAddress,
        jwt: adminJWT,
        title: '',
        body,
        readOnly,
        kind: 'question',
      });
      expect(tRes).to.not.be.null;
      expect(tRes.error).to.not.be.null;
      expect(tRes.error).to.be.equal(ThreadErrors.QuestionMissingTitle);
    });

    it('should fail to create a request thread with an empty title', async () => {
      const tRes = await modelUtils.createThread({
        chain,
        address: adminAddress,
        jwt: adminJWT,
        title: '',
        body,
        readOnly,
        kind: 'request',
      });
      expect(tRes).to.not.be.null;
      expect(tRes.error).to.not.be.null;
      expect(tRes.error).to.be.equal(ThreadErrors.RequestMissingTitle);
    });

    it('should fail to create a link thread with an empty title', async () => {
      const tRes = await modelUtils.createThread({
        chain,
        address: adminAddress,
        jwt: adminJWT,
        title: '',
        body,
        readOnly,
        kind: 'link',
      });
      expect(tRes).to.not.be.null;
      expect(tRes.error).to.not.be.null;
      expect(tRes.error).to.be.equal(ThreadErrors.LinkMissingTitleOrUrl);
    });

    it('should fail to create a link thread with an empty URL', async () => {
      const tRes = await modelUtils.createThread({
        chain,
        address: adminAddress,
        jwt: adminJWT,
        title,
        body,
        readOnly,
        kind: 'link',
        url: null,
      });
      expect(tRes).to.not.be.null;
      expect(tRes.error).to.not.be.null;
      expect(tRes.error).to.be.equal(ThreadErrors.LinkMissingTitleOrUrl);
    });

    it('should fail to create a thread with too many tags', async () => {
      const tRes = await modelUtils.createThread({
        chain,
        address: adminAddress,
        jwt: adminJWT,
        title,
        body,
        readOnly,
        kind,
        tags: ['1', '2', '3', '4']
      });
      expect(tRes).to.not.be.null;
      expect(tRes.error).to.not.be.null;
      expect(tRes.error).to.be.equal(ThreadErrors.TooManyTags);
    });

    it('should fail to create a comment on a readOnly thread', async () => {
      const tRes = await modelUtils.createThread({
        chain,
        address: adminAddress,
        jwt: adminJWT,
        title,
        body,
        readOnly,
        kind,
      });
      expect(tRes).not.to.be.null;
      expect(tRes.status).to.be.equal('Success');
      expect(tRes.result.read_only).to.be.equal(true);
      const cRes = await modelUtils.createComment({
        chain,
        address: userAddress,
        jwt: userJWT,
        text: markdownComment.text,
        root_id: `discussion_${tRes.result.id}`,
      });
      expect(cRes).not.to.be.null;
      expect(cRes.error).not.to.be.null;
    });

    it('should create a thread with mentions to non-existent addresses', async () => {
      const res = await modelUtils.createThread({
        chain,
        address: userAddress,
        jwt: userJWT,
        title,
        body,
        kind,
        mentions: '0x1234',
      });
      expect(res.status).to.equal('Success');
      expect(res.result).to.not.be.null;
      expect(res.result.title).to.equal(encodeURIComponent(title));
      expect(res.result.body).to.equal(encodeURIComponent(body));
      expect(res.result.Address).to.not.be.null;
      expect(res.result.Address.address).to.equal(userAddress);
    });
  });

  describe('/createComment', () => {
    const kind = 'forum';

    beforeEach(async () => {
      const res2 = await modelUtils.createThread({
        chain,
        address: adminAddress,
        jwt: adminJWT,
        title: decodeURIComponent(markdownThread.title),
        body: decodeURIComponent(markdownThread.body),
        privacy: false,
        readOnly: false,
        tags: ['tag', 'tag2', 'tag3'],
        kind,
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
        root_id: `discussion_${thread.id}`,
      });

      expect(cRes.status).to.equal('Success');
      expect(cRes.result).to.not.be.null;
      expect(cRes.result.root_id).to.equal(`discussion_${thread.id}`);
      expect(cRes.result.text).to.equal(markdownComment.text);
      expect(cRes.result.Address).to.not.be.null;
      expect(cRes.result.Address.address).to.equal(userAddress);
    });

    it('should create a comment for a thread with an non-existent mention', async () => {
      const cRes = await modelUtils.createComment({
        chain,
        address: userAddress,
        jwt: userJWT,
        text: markdownComment.text,
        root_id: `discussion_${thread.id}`,
        mentions: '0x1234',
      });

      expect(cRes.status).to.equal('Success');
      expect(cRes.result).to.not.be.null;
      expect(cRes.result.root_id).to.equal(`discussion_${thread.id}`);
      expect(cRes.result.text).to.equal(markdownComment.text);
      expect(cRes.result.Address).to.not.be.null;
      expect(cRes.result.Address.address).to.equal(userAddress);
    });

    it('should create a comment reply for a comment', async () => {
      let cRes = await modelUtils.createComment({
        chain,
        address: userAddress,
        jwt: userJWT,
        text: markdownComment.text,
        root_id: `discussion_${thread.id}`,
      });
      const parentId = cRes.result.id;
      cRes = await modelUtils.createComment({
        chain,
        address: userAddress,
        jwt: userJWT,
        text: markdownComment.text,
        root_id: `discussion_${thread.id}`,
        parentCommentId: `${parentId}`,
      });

      expect(cRes.status).to.equal('Success');
      expect(cRes.result).to.not.be.null;
      expect(cRes.result.root_id).to.equal(`discussion_${thread.id}`);
      expect(cRes.result.parent_id).to.equal(`${parentId}`);
      expect(cRes.result.text).to.equal(markdownComment.text);
      expect(cRes.result.Address).to.not.be.null;
      expect(cRes.result.Address.address).to.equal(userAddress);
    });

    it('should fail to create a comment without a root_id', async () => {
      const cRes = await modelUtils.createComment({
        chain,
        address: userAddress,
        jwt: userJWT,
        text: markdownComment.text,
        root_id: null,
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
        root_id: `discussion_${thread.id}`,
      });

      expect(cRes.error).to.not.be.null;
      expect(cRes.error).to.be.equal(CreateCommentErrors.MissingTextOrAttachment);
    });

    it('should fail to create a comment on a non-existent thread', async () => {
      const cRes = await modelUtils.createComment({
        chain,
        address: userAddress,
        jwt: userJWT,
        text: 'test',
        root_id: 'fake-thread-id',
      });

      expect(cRes.error).to.not.be.null;
      expect(cRes.error).to.be.equal(CreateCommentErrors.ThreadNotFound);
    });
  });

  describe('/editThread', () => {
    const kind = 'forum';

    beforeEach(async () => {
      const res2 = await modelUtils.createThread({
        chain,
        address: adminAddress,
        jwt: adminJWT,
        title: decodeURIComponent(markdownThread.title),
        body: decodeURIComponent(markdownThread.body),
        privacy: true,
        readOnly: true,
        tags: ['tag', 'tag2', 'tag3'],
        kind,
      });
      expect(res2.status).to.be.equal('Success');
      expect(res2.result).to.not.be.null;
      thread = res2.result;
    });

    it('Should turn off privacy', async () => {
      const body = thread.body;
      const recentEdit : any = { timestamp: moment(), body };
      const versionHistory = JSON.stringify(recentEdit);
      const readOnly = true;
      const privacy = false;
      const res = await chai.request(app)
        .post('/api/editThread')
        .set('Accept', 'application/json')
        .send({
          'thread_id': thread.id,
          'kind': thread.kind,
          'body': encodeURIComponent(body),
          'version_history': versionHistory,
          'attachments[]': null,
          'privacy': privacy,
          'read_only': readOnly,
          'jwt': adminJWT,
        });
      expect(res.body.result).to.not.be.null;
      expect(res.body.result.read_only).to.be.equal(readOnly);
      expect(res.body.result.private).to.be.equal(privacy);
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
    });

    it('Should turn off read_only', async () => {
      const body = thread.body;
      const recentEdit : any = { timestamp: moment(), body };
      const versionHistory = JSON.stringify(recentEdit);
      const readOnly = false;
      const privacy = true;
      const res = await chai.request(app)
        .post('/api/editThread')
        .set('Accept', 'application/json')
        .send({
          'thread_id': thread.id,
          'kind': thread.kind,
          'body': encodeURIComponent(body),
          'version_history': versionHistory,
          'attachments[]': null,
          'privacy': privacy,
          'read_only': readOnly,
          'jwt': adminJWT,
        });
      expect(res.body.result).to.not.be.null;
      expect(res.body.result.read_only).to.be.equal(readOnly);
      expect(res.body.result.private).to.be.equal(privacy);
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
    });

    it('Should turn off both read_only and privacy', async () => {
      const body = thread.body;
      const recentEdit : any = { timestamp: moment(), body };
      const versionHistory = JSON.stringify(recentEdit);
      const readOnly = false;
      const privacy = false;
      const res = await chai.request(app)
        .post('/api/editThread')
        .set('Accept', 'application/json')
        .send({
          'thread_id': thread.id,
          'kind': thread.kind,
          'body': encodeURIComponent(body),
          'version_history': versionHistory,
          'attachments[]': null,
          'privacy': privacy,
          'read_only': readOnly,
          'jwt': adminJWT,
        });
      expect(res.body.result).to.not.be.null;
      expect(res.body.result.read_only).to.be.equal(readOnly);
      expect(res.body.result.private).to.be.equal(privacy);
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
    });

    it('Should turn off, and then on, both read_only and privacy', async () => {
      // turning off privacy properties
      const body = thread.body;
      const recentEdit : any = { timestamp: moment(), body };
      const versionHistory = JSON.stringify(recentEdit);
      let readOnly = false;
      const privacy = false;
      let res = await chai.request(app)
        .post('/api/editThread')
        .set('Accept', 'application/json')
        .send({
          'thread_id': thread.id,
          'kind': thread.kind,
          'body': encodeURIComponent(body),
          'version_history': versionHistory,
          'attachments[]': null,
          'privacy': privacy,
          'read_only': readOnly,
          'jwt': adminJWT,
        });
      expect(res.body.result).to.not.be.null;
      expect(res.body.result.read_only).to.be.equal(readOnly);
      expect(res.body.result.private).to.be.equal(privacy);
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');

      // turning on read_only
      readOnly = true;
      res = await chai.request(app)
        .post('/api/editThread')
        .set('Accept', 'application/json')
        .send({
          'thread_id': thread.id,
          'kind': thread.kind,
          'body': encodeURIComponent(body),
          'version_history': versionHistory,
          'attachments[]': null,
          'privacy': privacy,
          'read_only': readOnly,
          'jwt': adminJWT,
        });
      expect(res.body.result).to.not.be.null;
      expect(res.body.result.read_only).to.be.equal(readOnly);
      expect(res.body.result.private).to.be.equal(privacy);
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
    });

    it('Should fail to turn a public thread private', async () => {
      // turning off privacy
      const body = thread.body;
      const recentEdit : any = { timestamp: moment(), body };
      const versionHistory = JSON.stringify(recentEdit);
      const readOnly = false;
      let privacy = false;
      let res = await chai.request(app)
        .post('/api/editThread')
        .set('Accept', 'application/json')
        .send({
          'thread_id': thread.id,
          'kind': thread.kind,
          'body': encodeURIComponent(body),
          'version_history': versionHistory,
          'attachments[]': null,
          'privacy': privacy,
          'read_only': readOnly,
          'jwt': adminJWT,
        });
      expect(res.body.result).to.not.be.null;
      expect(res.body.result.read_only).to.be.equal(readOnly);
      expect(res.body.result.private).to.be.equal(privacy);
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');

      // failing to turn on privacy, thread.private stays false.
      privacy = true;
      res = await chai.request(app)
        .post('/api/editThread')
        .set('Accept', 'application/json')
        .send({
          'thread_id': thread.id,
          'kind': thread.kind,
          'body': encodeURIComponent(body),
          'version_history': versionHistory,
          'attachments[]': null,
          'privacy': privacy,
          'read_only': readOnly,
          'jwt': adminJWT,
        });
      expect(res.body.result).to.not.be.null;
      expect(res.body.result.read_only).to.be.equal(readOnly);
      expect(res.body.result.private).to.be.equal(false);
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
    });

    it('should fail to edit an admin\'s post as a user', async () => {
      const thread_id = thread.id;
      const thread_kind = thread.kind;
      const body = thread.body;
      const recentEdit : any = { timestamp: moment(), body };
      const versionHistory = JSON.stringify(recentEdit);
      const readOnly = false;
      const privacy = true;
      const res = await chai.request(app)
        .post('/api/editThread')
        .set('Accept', 'application/json')
        .send({
          'thread_id': thread_id,
          'kind': thread_kind,
          'body': encodeURIComponent(body),
          'version_history': versionHistory,
          'attachments[]': null,
          'privacy': privacy,
          'read_only': readOnly,
          'jwt': userJWT,
        });
      expect(res.body.error).to.not.be.null;
      expect(res.status).to.be.equal(500);
    });

    it('should fail to edit a thread without passing a thread id', async () => {
      const thread_kind = thread.kind;
      const body = thread.body;
      const recentEdit : any = { timestamp: moment(), body };
      const versionHistory = JSON.stringify(recentEdit);
      const readOnly = false;
      const privacy = true;
      const res = await chai.request(app)
        .post('/api/editThread')
        .set('Accept', 'application/json')
        .send({
          'thread_id': null,
          'kind': thread_kind,
          'body': encodeURIComponent(body),
          'version_history': versionHistory,
          'attachments[]': null,
          'privacy': privacy,
          'read_only': readOnly,
          'jwt': userJWT,
        });
      expect(res.body.error).to.not.be.null;
      expect(res.status).to.be.equal(500);
      expect(res.body.error).to.be.equal(EditThreadErrors.NoThreadId);
    });

    it('should fail to edit a thread without passing a body', async () => {
      const thread_id = thread.id;
      const thread_kind = thread.kind;
      const body = thread.body;
      const recentEdit : any = { timestamp: moment(), body };
      const versionHistory = JSON.stringify(recentEdit);
      const readOnly = false;
      const privacy = true;
      const res = await chai.request(app)
        .post('/api/editThread')
        .set('Accept', 'application/json')
        .send({
          'thread_id': thread_id,
          'kind': thread_kind,
          'body': null,
          'version_history': versionHistory,
          'attachments[]': null,
          'privacy': privacy,
          'read_only': readOnly,
          'jwt': userJWT,
        });
      expect(res.body.error).to.not.be.null;
      expect(res.status).to.be.equal(500);
      expect(res.body.error).to.be.equal(EditThreadErrors.NoBodyOrAttachment);
    });

    it.skip('should fail to show private threads to a user without access', async () => {
      // TODO: Use /bulkThreads to fetch threads for a user without access
      // TODO: and ensure that a created private thread is not shown to the user
    });
  });

  describe('/editComment', () => {
    const title = 'test title';
    const body = 'test body';
    const kind = 'forum';

    it('should edit a comment', async () => {
      const text = 'tes text';
      const tRes = await modelUtils.createThread({
        chain,
        address: userAddress,
        jwt: userJWT,
        title,
        body,
        kind,
      });
      const cRes = await modelUtils.createComment({
        chain,
        address: userAddress,
        jwt: userJWT,
        text: markdownComment.text,
        root_id: `discussion_${tRes.result.id}`,
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
      expect(eRes.result.root_id).to.be.equal(`discussion_${tRes.result.id}`);
      expect(eRes.result.community).to.be.null;
    });
  });

  describe('/viewCount', () => {
    const kind = 'forum';

    it('should track views on chain', async () => {
      let res = await modelUtils.createThread({
        chain,
        address: userAddress,
        jwt: userJWT,
        title: 't',
        body: 't',
        kind,
      });
      const object_id = res.result.id;

      // should track first view
      res = await chai.request(app)
        .post('/api/viewCount')
        .set('Accept', 'application/json')
        .send({ chain, object_id });
      expect(res.status).to.equal(200);
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.equal('Success');
      expect(res.body.result).to.not.be.null;
      expect(res.body.result.view_count).to.equal(1);

      // should ignore second view, same IP
      res = await chai.request(app)
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
      res = await chai.request(app)
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
      let res = await modelUtils.createThread({
        chain,
        community,
        address: userAddress,
        jwt: userJWT,
        title: 't',
        body: 't',
        kind,
      });
      const object_id = res.result.id;

      // should track first view
      res = await chai.request(app)
        .post('/api/viewCount')
        .set('Accept', 'application/json')
        .send({ community, object_id });
      expect(res.status).to.equal(200);
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.equal('Success');
      expect(res.body.result).to.not.be.null;
      expect(res.body.result.view_count).to.equal(1);
    });

    it('should not track views without object_id', async () => {
      const res = await chai.request(app)
        .post('/api/viewCount')
        .set('Accept', 'application/json')
        .send({ chain });
      expect(res.status).to.equal(500);
      expect(res.body).to.not.be.null;
      expect(res.body.error).to.equal('Must provide object_id');
    });

    it('should not track views without chain or community', async () => {
      const res = await chai.request(app)
        .post('/api/viewCount')
        .set('Accept', 'application/json')
        .send({ object_id: '9999' });
      expect(res.status).to.equal(500);
      expect(res.body).to.not.be.null;
      expect(res.body.error).to.equal('Must provide chain or community');
    });

    it('should not track views with invalid chain or community', async () => {
      const res = await chai.request(app)
        .post('/api/viewCount')
        .set('Accept', 'application/json')
        .send({ chain: 'adkgjkjgda', object_id: '9999' });
      expect(res.status).to.equal(500);
      expect(res.body).to.not.be.null;
      expect(res.body.error).to.equal('Invalid community or chain');
    });

    it('should not track views with invalid object_id', async () => {
      const res = await chai.request(app)
        .post('/api/viewCount')
        .set('Accept', 'application/json')
        .send({ chain, object_id: '9999' });
      expect(res.status).to.equal(500);
      expect(res.body).to.not.be.null;
      expect(res.body.error).to.equal('Invalid offchain thread');
    });
  });
});
