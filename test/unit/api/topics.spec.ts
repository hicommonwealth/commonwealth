/* eslint-disable global-require */
/* eslint-disable no-unused-expressions */
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import jwt from 'jsonwebtoken';
import sleep from 'sleep-promise';
import moment from 'moment';
import { Errors as TopicErrors } from 'server/routes/editTopic';
import app, { resetDatabase } from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import * as modelUtils from '../../util/modelUtils';

const ethUtil = require('ethereumjs-util');
chai.use(chaiHttp);
const { expect } = chai;
const markdownThread = require('../../util/fixtures/markdownThread');

let adminJWT;
let adminAddress;
let userJWT;
let userAddress;
let topic;

describe('Topic Tests', () => {
  const community = 'staking';
  const chain = 'ethereum';
  const title = 'test title';
  const body = 'test body';
  const topicName = 'test topic';
  const topicId = undefined;
  const kind = 'forum';

  before('reset database', async () => {
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

  describe('Bulk Topics', () => {
    before(async () => {
      const res = await modelUtils.createAndVerifyAddress({ chain });
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
      const res2 = await modelUtils.createThread({
        chainId: chain,
        communityId: undefined,
        address: adminAddress,
        jwt: adminJWT,
        title,
        body,
        topicName,
        topicId,
        kind,
      });
      expect(res2.status).to.be.equal('Success');
      expect(res2.result).to.not.be.null;
      expect(res2.result.Address).to.not.be.null;
      expect(res2.result.Address.address).to.equal(adminAddress);
      topic = res2.result.topic;
    });

    it('Should pass /bulkTopics', async () => {
      const res = await chai.request.agent(app)
        .get('/api/bulkTopics')
        .set('Accept', 'application/json')
        .query({
          chain,
          jwt: adminJWT,
        });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result).to.not.be.null;
      expect(res.body.result.length).to.be.equal(1);
    });
  });

  describe('Update Topics', () => {
    let thread;

    before(async () => {
      const res = await modelUtils.createAndVerifyAddress({ chain });
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

      const res2 = await modelUtils.createAndVerifyAddress({ chain });
      userAddress = res2.address;
      userJWT = jwt.sign({ id: res2.user_id, email: res2.email }, JWT_SECRET);
      expect(userAddress).to.not.be.null;
      expect(userJWT).to.not.be.null;

      const res3 = await modelUtils.createThread({
        chainId: chain,
        communityId: community,
        address: adminAddress,
        jwt: adminJWT,
        title,
        body,
        topicName,
        topicId,
        kind,
      });
      thread = res3.result;
    });

    it('Should fail to update thread without a topic name', async () => {
      const res = await chai.request(app)
        .post('/api/updateTopics')
        .set('Accept', 'application/json')
        .send({
          'jwt': adminJWT,
          'thread_id': thread.id,
          'address': adminAddress,
          'topic_name': undefined,
        });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.not.be.equal('Success');
      expect(res.body.result).to.not.be.null;
    });

    it('Should successfully add topic to thread with admin account', async () => {
      const res = await chai.request(app)
        .post('/api/updateTopics')
        .set('Accept', 'application/json')
        .send({
          'jwt': adminJWT,
          'thread_id': thread.id,
          'address': adminAddress,
          'topic_name': topicName,
        });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result).to.not.be.null;
      expect(res.body.result.name).to.be.equal(topicName);
    });

    it('Should fail to add topic to thread with non-admin account', async () => {
      const res = await chai.request(app)
        .post('/api/updateTopics')
        .set('Accept', 'application/json')
        .send({
          'jwt': userJWT,
          'thread_id': thread.id,
          'address': userAddress,
          'topic_name': topicName,
        });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.not.be.equal('Success');
      expect(res.body.result).to.not.be.null;
    });
  });
});
