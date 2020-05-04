/* eslint-disable global-require */
/* eslint-disable no-unused-expressions */
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import jwt from 'jsonwebtoken';
import moment from 'moment';
import app, { resetDatabase, closeServer } from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import * as modelUtils from '../../util/modelUtils';

const ethUtil = require('ethereumjs-util');
chai.use(chaiHttp);
const { expect } = chai;

describe('Thread Tests', () => {
  const markdownThread = require('../../util/fixtures/markdownThread');
  const community = 'staking';
  const chain = 'ethereum';
  let adminJWT;
  let adminAddress;
  let userJWT;
  let userAddress;
  let thread;

  beforeEach('reset database', async () => {
    await resetDatabase();
    let res = await modelUtils.createAndVerifyAddress({ chain });
    adminAddress = res.address;
    adminJWT = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
    const isAdmin = await modelUtils.assignAdmin(res.address_id, chain);
    expect(adminAddress).to.not.be.null;
    expect(adminJWT).to.not.be.null;
    expect(isAdmin).to.not.be.null;

    res = await modelUtils.createAndVerifyAddress({ chain });
    userAddress = res.address;
    userJWT = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
    expect(userAddress).to.not.be.null;
    expect(userJWT).to.not.be.null;
  });

  describe('/editComment', () => {
    it('should edit a comment', async () => {
      const markdownComment = require('../../util/fixtures/markdownComment');
      const title = 'test title';
      const body = 'test body';
      const text = 'tes text';
      const tRes = await modelUtils.createThread({
        chain,
        address: userAddress,
        jwt: userJWT,
        title,
        body,
      });
      const cRes = await modelUtils.createComment({
        chain,
        address: userAddress,
        jwt: userJWT,
        text: decodeURIComponent(markdownComment.text),
        proposalIdentifier: `discussion_${tRes.result.id}`,
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

  describe('Testing ReadOnly with /createComment', () => {
    it('should fail to create a comment on a readOnly thread', async () => {
      const markdownComment = require('../../util/fixtures/markdownComment');
      const title = 'test title';
      const body = 'test body';
      const readOnly = true;
      const tRes = await modelUtils.createThread({
        chain,
        address: adminAddress,
        jwt: adminJWT,
        title,
        body,
        readOnly,
      });
      expect(tRes).not.to.be.null;
      expect(tRes.status).to.be.equal('Success');
      expect(tRes.result.read_only).to.be.equal(true);
      const cRes = await modelUtils.createComment({
        chain,
        address: userAddress,
        jwt: userJWT,
        text: decodeURIComponent(markdownComment.text),
        proposalIdentifier: `discussion_${tRes.result.id}`,
      });
      expect(cRes).not.to.be.null;
      expect(cRes.error).not.to.be.null;
    });
  });

  describe('/editThread', () => {
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
      expect(res.body.result.private).to.be.equal(false);
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

    it('User should fail to edit admin\'s post', async () => {
      const thread_id = thread.id;
      const kind = thread.kind;
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
          'kind': kind,
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
  });
});
