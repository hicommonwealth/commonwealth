/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable dot-notation */
/* eslint-disable no-unused-expressions */
require('dotenv').config();
import chai from 'chai';
import chaiHttp from 'chai-http';

import faker from 'faker';
import jwt from 'jsonwebtoken';
import app, { resetDatabase } from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import models from '../../../server/database';
import Errors from '../../../server/routes/webhooks/errors';
import * as modelUtils from '../../util/modelUtils';

chai.use(chaiHttp);
const { expect } = chai;
const markdownThread = require('../../util/fixtures/markdownThread');
const markdownComment = require('../../util/fixtures/markdownComment');
const richTextThread = require('../../util/fixtures/richTextThread');
const richTextComment = require('../../util/fixtures/richTextComment');

const expectErrorOnResponse = (statusCode, errorMsg, response) => {
  expect(response.statusCode).to.be.equal(statusCode);
  expect(response.body).to.not.be.null;
  expect(response.body.error).to.not.be.null;
  expect(response.body.error).to.be.equal(errorMsg);
};

describe('Webhook Tests', () => {
  let jwtToken;
  let loggedInAddr;
  let notLoggedInAddr;
  let loggedInNotAdminAddr;
  let loggedInSession;
  let notAdminJWT;
  const chain = 'ethereum';
  const topicName = 'test';
  const topicId = 0;

  before('reset database', async () => {
    await resetDatabase();
  });

  beforeEach(async () => {
    // get logged in address/user with JWT
    let result = await modelUtils.createAndVerifyAddress({ chain });
    loggedInAddr = result.address;
    loggedInSession = { session: result.session, sign: result.sign };
    jwtToken = jwt.sign(
      { id: result.user_id, email: result.email },
      JWT_SECRET,
    );
    await modelUtils.updateRole({
      address_id: result.address_id,
      chainOrCommObj: { chain_id: chain },
      role: 'admin',
    });
    // get not logged in address
    result = await modelUtils.createAndVerifyAddress({ chain });
    notLoggedInAddr = result.address;
    // get logged in not admin address
    result = await modelUtils.createAndVerifyAddress({ chain });
    loggedInNotAdminAddr = result.address;
    notAdminJWT = jwt.sign(
      { id: result.user_id, email: result.email },
      JWT_SECRET,
    );
  });

  describe('/createWebhook', () => {
    it('should create a webhook for a chain', async () => {
      const webhookUrl = faker.internet.url();
      const res = await chai.request
        .agent(app)
        .post('/api/createWebhook')
        .set('Accept', 'application/json')
        .send({ chain, webhookUrl, auth: true, jwt: jwtToken });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.equal('Success');
      expect(res.body.result).to.be.not.null;
      expect(res.body.result.community_id).to.be.equal(chain);
      expect(res.body.result.url).to.be.equal(webhookUrl);
    });

    it('should fail to create a duplicate webhook', async () => {
      const webhookUrl = faker.internet.url();
      await chai.request
        .agent(app)
        .post('/api/createWebhook')
        .set('Accept', 'application/json')
        .send({ chain, webhookUrl, auth: true, jwt: jwtToken });
      let webhookUrls = await models.Webhook.findAll({
        where: { url: webhookUrl },
      });
      expect(webhookUrls).to.have.length(1);
      const errorRes = await chai.request
        .agent(app)
        .post('/api/createWebhook')
        .set('Accept', 'application/json')
        .send({ chain, webhookUrl, auth: true, jwt: jwtToken });
      expectErrorOnResponse(400, Errors.NoDuplicates, errorRes);
      webhookUrls = await models.Webhook.findAll({
        where: { url: webhookUrl },
      });
      expect(webhookUrls).to.have.length(1);
    });

    // TODO: I believe our passport strategy is catching JWTs that don't correspond to users,
    // TODO: therefore our error is 401 rather than a 500 with the "Not logged in" message.
    it('should fail to create a webhook if not a user', async () => {
      const webhookUrl = faker.internet.url();
      const errorRes = await chai.request
        .agent(app)
        .post('/api/createWebhook')
        .set('Accept', 'application/json')
        .send({
          address: notLoggedInAddr,
          chain,
          webhookUrl,
          jwt: jwt.sign({ id: -999999, email: null }, JWT_SECRET),
        });
      expectErrorOnResponse(401, undefined, errorRes);
      const webhookUrls = await models.Webhook.findAll({
        where: { url: webhookUrl },
      });
      expect(webhookUrls).to.have.length(0);
    });
  });

  describe('/deleteWebhook', () => {
    it('should fail to create a webhook if not an admin', async () => {
      const webhookUrl = faker.internet.url();
      const errorRes = await chai.request
        .agent(app)
        .post('/api/createWebhook')
        .set('Accept', 'application/json')
        .send({
          address: loggedInNotAdminAddr,
          chain,
          webhookUrl,
          auth: true,
          jwt: notAdminJWT,
        });
      expectErrorOnResponse(400, Errors.NotAdmin, errorRes);
      const webhookUrls = await models.Webhook.findAll({
        where: { url: webhookUrl },
      });
      expect(webhookUrls).to.have.length(0);
    });

    it('should delete a webhook', async () => {
      const webhookUrl = faker.internet.url();
      await chai.request
        .agent(app)
        .post('/api/createWebhook')
        .set('Accept', 'application/json')
        .send({ chain, webhookUrl, auth: true, jwt: jwtToken });
      let webhookUrls = await models.Webhook.findAll({
        where: { url: webhookUrl },
      });
      expect(webhookUrls).to.have.length(1);
      await chai.request
        .agent(app)
        .post('/api/deleteWebhook')
        .set('Accept', 'application/json')
        .send({ chain, webhookUrl, auth: true, jwt: jwtToken });
      webhookUrls = await models.Webhook.findAll({
        where: { url: webhookUrl },
      });
      expect(webhookUrls).to.have.length(0);
    });

    it('should fail to delete a non-existent webhook', async () => {
      const webhookUrl = faker.internet.url();
      const errorRes = await chai.request
        .agent(app)
        .post('/api/deleteWebhook')
        .set('Accept', 'application/json')
        .send({ chain, webhookUrl, auth: true, jwt: jwtToken });
      expectErrorOnResponse(400, Errors.NoWebhookFound, errorRes);
    });

    it('should fail to delete a webhook from non-admin', async () => {
      const webhookUrl = faker.internet.url();
      await chai.request
        .agent(app)
        .post('/api/createWebhook')
        .set('Accept', 'application/json')
        .send({ chain, webhookUrl, auth: true, jwt: jwtToken });
      const errorRes = await chai.request
        .agent(app)
        .post('/api/deleteWebhook')
        .set('Accept', 'application/json')
        .send({ chain, webhookUrl, auth: true, jwt: notAdminJWT });
      expectErrorOnResponse(400, Errors.NotAdmin, errorRes);
    });
  });

  describe('/getWebhooks', () => {
    it('should get all webhooks', async () => {
      const urls = await Promise.all(
        [1, 2, 3, 4, 5].map(async () => {
          const webhookUrl = faker.internet.url();
          await chai.request
            .agent(app)
            .post('/api/createWebhook')
            .set('Accept', 'application/json')
            .send({ chain, webhookUrl, auth: true, jwt: jwtToken });
          return webhookUrl;
        }),
      );
      expect(urls).to.have.length(5);
      const res = await chai.request
        .agent(app)
        .get('/api/getWebhooks')
        .set('Accept', 'application/json')
        .query({ chain, auth: true, jwt: jwtToken });
      expect(res.body.result).to.not.be.null;
    });

    it('should fail to get webhooks from non-admin', async () => {
      const urls = await Promise.all(
        [1, 2, 3, 4, 5].map(async () => {
          const webhookUrl = faker.internet.url();
          await chai.request
            .agent(app)
            .post('/api/createWebhook')
            .set('Accept', 'application/json')
            .send({ chain, webhookUrl, auth: true, jwt: jwtToken });
          return webhookUrl;
        }),
      );
      expect(urls).to.have.length(5);
      const errorRes = await chai.request
        .agent(app)
        .get('/api/getWebhooks')
        .set('Accept', 'application/json')
        .query({ chain, auth: true, jwt: notAdminJWT });
      expectErrorOnResponse(400, Errors.NotAdmin, errorRes);
    });
  });

  describe('Integration Tests', () => {
    before('reset database', async () => {
      await resetDatabase();
    });
    // we want to test that no errors occur up to the point the webhook is hit
    it('should send a webhook for markdown and rich text content', async () => {
      const webhookUrl = process.env.SLACK_FEEDBACK_WEBHOOK;
      await modelUtils.createWebhook({
        chain,
        webhookUrl,
        jwt: jwtToken,
      });
      await modelUtils.createThread({
        chainId: chain,
        topicName,
        topicId,
        address: loggedInAddr,
        jwt: jwtToken,
        title: decodeURIComponent(markdownThread.title),
        body: decodeURIComponent(markdownThread.body),
        kind: 'discussion',
        stage: 'discussion',
        session: loggedInSession.session,
        sign: loggedInSession.sign,
      });
      // expect(res.statusCode).to.be.equal(200);
      await modelUtils.createComment({
        chain,
        address: loggedInAddr,
        jwt: jwtToken,
        text: decodeURIComponent(markdownComment.text),
        thread_id: `$`,
        session: loggedInSession.session,
        sign: loggedInSession.sign,
      });
      // expect(res.statusCode).to.be.equal(200);
      await modelUtils.createThread({
        chainId: chain,
        topicName,
        topicId,
        address: loggedInAddr,
        jwt: jwtToken,
        title: decodeURIComponent(richTextThread.title),
        body: decodeURIComponent(richTextThread.body),
        kind: 'discussion',
        stage: 'discussion',
        session: loggedInSession.session,
        sign: loggedInSession.sign,
      });
      // expect(res.statusCode).to.be.equal(200);
      await modelUtils.createComment({
        chain,
        address: loggedInAddr,
        jwt: jwtToken,
        text: decodeURIComponent(richTextComment.text),
        thread_id: `discussion_`,
        session: loggedInSession.session,
        sign: loggedInSession.sign,
      });
      // expect(res.statusCode).to.be.equal(200);
    });
  });
});
