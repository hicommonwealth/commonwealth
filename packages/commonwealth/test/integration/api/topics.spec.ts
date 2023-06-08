/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable no-unused-expressions */
import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import jwt from 'jsonwebtoken';
import app, { resetDatabase } from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import * as modelUtils from '../../util/modelUtils';
import { ApiEndpoints } from 'state/api/config';

chai.use(chaiHttp);
const { expect } = chai;

let adminJWT;
let adminAddress;
let userJWT;
let userAddress;
let topic;

describe('Topic Tests', () => {
  const chain = 'ethereum';
  const title = 'test title';
  const body = 'test body';
  const topicName = 'test topic';
  const topicId = undefined;
  const kind = 'discussion';
  const stage = 'discussion';

  before('reset database', async () => {
    await resetDatabase();
    let res = await modelUtils.createAndVerifyAddress({ chain });
    adminAddress = res.address;
    adminJWT = jwt.sign({ id: res.user_id, email: res.email }, JWT_SECRET);
    const isAdmin = await modelUtils.updateRole({
      address_id: res.address_id,
      chainOrCommObj: { chain_id: chain },
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
      const isAdmin = await modelUtils.updateRole({
        address_id: res.address_id,
        chainOrCommObj: { chain_id: chain },
        role: 'admin',
      });
      expect(adminAddress).to.not.be.null;
      expect(adminJWT).to.not.be.null;
      expect(isAdmin).to.not.be.null;
      const res2 = await modelUtils.createThread({
        chainId: chain,
        address: adminAddress,
        jwt: adminJWT,
        title,
        body,
        topicName,
        topicId,
        kind,
        stage,
        session: res.session,
        sign: res.sign,
      });
      expect(res2.status).to.be.equal('Success');
      expect(res2.result).to.not.be.null;
      expect(res2.result.Address).to.not.be.null;
      expect(res2.result.Address.address).to.equal(adminAddress);
      topic = res2.result.topic;
    });

    it('Should pass /bulkTopics', async () => {
      const res = await chai.request
        .agent(app)
        .get(`/api${ApiEndpoints.BULK_TOPICS}`)
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
      const isAdmin = await modelUtils.updateRole({
        address_id: res.address_id,
        chainOrCommObj: { chain_id: chain },
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
        address: adminAddress,
        jwt: adminJWT,
        title,
        body,
        topicName,
        topicId,
        kind,
        stage,
        session: res.session,
        sign: res.sign,
      });
      thread = res3.result;
    });

    it('Should fail to update thread without a topic name', async () => {
      const res = await chai
        .request(app)
        .post('/api/updateTopic')
        .set('Accept', 'application/json')
        .send({
          jwt: adminJWT,
          thread_id: thread.id,
          address: adminAddress,
          topic_name: undefined,
        });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.not.be.equal('Success');
      expect(res.body.result).to.not.be.null;
    });

    it('Should successfully add topic to thread with admin account', async () => {
      const res = await chai
        .request(app)
        .post('/api/updateTopic')
        .set('Accept', 'application/json')
        .send({
          jwt: adminJWT,
          thread_id: thread.id,
          address: adminAddress,
          topic_name: topicName,
        });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result).to.not.be.null;
      expect(res.body.result.name).to.be.equal(topicName);
    });

    it('Should fail to add topic to thread with non-admin account', async () => {
      const res = await chai
        .request(app)
        .post('/api/updateTopic')
        .set('Accept', 'application/json')
        .send({
          jwt: userJWT,
          thread_id: thread.id,
          address: userAddress,
          topic_name: topicName,
        });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.not.be.equal('Success');
      expect(res.body.result).to.not.be.null;
    });
  });
});
