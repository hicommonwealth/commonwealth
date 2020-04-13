/* eslint-disable no-unused-expressions */
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import jwt from 'jsonwebtoken';
import app, { resetDatabase, closeServer } from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import * as modelUtils from '../../util/modelUtils';

const ethUtil = require('ethereumjs-util');
chai.use(chaiHttp);
const { expect } = chai;

describe('Tag Tests', () => {
  before('reset database', async () => {
    await resetDatabase();
  });

  describe('Update Tags', () => {
    const markdownThread = require('../../util/fixtures/markdownThread');
    const markdownComment = require('../../util/fixtures/markdownComment');
    const richTextThread = require('../../util/fixtures/richTextThread');
    const richTextComment = require('../../util/fixtures/richTextComment');
    const community = 'staking';
    const chain = 'ethereum';
    let adminJWT;
    let adminAddress;
    let thread;
    const noTags: string[] = [];
    const oneTag: string[] = ['tag'];
    const someTags: string[] = ['tag', 'tag3'];
    const mostTags: string[] = ['tag', 'tag2', 'tag3', 'tag4'];

    before(async () => {
      const res = await modelUtils.createAndVerifyAddress({ chain });
      adminAddress = res.address;
      adminJWT = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
      const isAdmin = await modelUtils.assignAdmin(res.address_id, community);
      expect(adminAddress).to.not.be.null;
      expect(adminJWT).to.not.be.null;
      expect(isAdmin).to.not.be.null;
      const res2 = await modelUtils.createThread({
        chain,
        address: adminAddress,
        jwt: adminJWT,
        title: decodeURIComponent(markdownThread.title),
        body: decodeURIComponent(markdownThread.body),
      });
      thread = res2.result;
      expect(thread).to.not.be.null;
    });

    it('Should update thread to no tags', async () => {
      const res = await chai.request(app)
        .post('/api/updateTags')
        .set('Accept', 'application/json')
        .send({
          'jwt': adminJWT,
          'thread_id': thread.id,
          'address': adminAddress,
          'tags[]': noTags,
        });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result).to.not.be.null;
    });

    it('Should add 1 tag to thread', async () => {
      const res = await chai.request(app)
        .post('/api/updateTags')
        .set('Accept', 'application/json')
        .send({
          'jwt': adminJWT,
          'thread_id': thread.id,
          'address': adminAddress,
          'tags[]': oneTag,
        });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result).to.not.be.null;
      const tags = res.body.result;
      expect(tags.length).to.be.equal(1);
    });

    it('Should add 4 tags', async () => {
      const res = await chai.request(app)
        .post('/api/updateTags')
        .set('Accept', 'application/json')
        .send({
          'jwt': adminJWT,
          'thread_id': thread.id,
          'address': adminAddress,
          'tags[]': mostTags,
        });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result).to.not.be.null;
      const tags = res.body.result;
      expect(tags.length).to.be.equal(4);
    });

    it('Should update thread to 2 tags', async () => {
      const res = await chai.request(app)
        .post('/api/updateTags')
        .set('Accept', 'application/json')
        .send({
          'jwt': adminJWT,
          'thread_id': thread.id,
          'address': adminAddress,
          'tags[]': someTags,
        });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result).to.not.be.null;
      const tags = res.body.result;
      expect(tags.length).to.be.equal(2);
    });
  });
});
