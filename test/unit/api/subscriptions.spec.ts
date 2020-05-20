/* eslint-disable no-unused-expressions */

import chai from 'chai';
import chaiHttp from 'chai-http';
import 'chai/register-should';
import jwt from 'jsonwebtoken';
import { NotificationCategories } from 'types';
import { NotificationSubscription } from 'models';
import app, { resetDatabase } from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import * as modelUtils from '../../util/modelUtils';
import { sortNotifications } from 'client/scripts/helpers/notifications';

chai.use(chaiHttp);
const { expect } = chai;

describe('Subscriptions Tests', () => {
  let jwtToken;
  let loggedInAddr;
  const chain = 'ethereum';
  const community = 'staking';

  before('reset database', async () => {
    await resetDatabase();
    // get logged in address/user with JWT
    const result = await modelUtils.createAndVerifyAddress({ chain });
    loggedInAddr = result.address;
    jwtToken = jwt.sign({ id: result.user_id, email: result.email }, JWT_SECRET);
  });

  describe('/createSubscription test', () => {
    it('should create new-thread subscription on community', async () => {
      const object_id = community;
      const is_active = true;
      const category = NotificationCategories.NewThread;
      const res = await chai.request(app)
        .post('/api/createSubscription')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, category, is_active, object_id, });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.category_id).to.be.equal(category);
      expect(res.body.result.object_id).to.equal(object_id);
      expect(res.body.result.is_active).to.be.equal(true);
    });
    it('should make new-comment subscription on thread', async () => {
      let res = await modelUtils.createThread({
        chain,
        address: loggedInAddr,
        jwt: jwtToken,
        title: 't',
        body: 't',
      });

      const object_id = res.result.id;
      const is_active = true;
      const category = NotificationCategories.NewComment;
      res = await chai.request(app)
        .post('/api/createSubscription')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, category, is_active, object_id, });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.category_id).to.be.equal(category);
      expect(res.body.result.object_id).to.equal(`${object_id}`);
      expect(res.body.result.is_active).to.be.equal(true);
    });

    it('should check /viewSubscriptions for all', async () => {
      let res = await modelUtils.createSubscription({
        object_id: community,
        jwt: jwtToken,
        is_active: true,
        category: NotificationCategories.NewThread,
      });
      res = await chai.request(app)
        .get('/api/viewSubscriptions')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
    });
  });

  describe('/disableSubscriptions + /enableSubscriptions', () => {
    let subscription: NotificationSubscription;
    beforeEach('creating a subscription', async () => {
      subscription = await modelUtils.createSubscription({
        object_id: community,
        jwt: jwtToken,
        is_active: true,
        category: NotificationCategories.NewThread,
      });
    });
    it('should pause a subscription', async () => {
      expect(subscription).to.not.be.null;
      const res = await chai.request(app)
        .post('/api/disableSubscriptions')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, 'subscription_ids[]': [subscription.id] });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
    });

    it('should unpause a subscription', async () => {
      expect(subscription).to.not.be.null;
      const res = await chai.request(app)
        .post('/api/enableSubscriptions')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, 'subscription_ids[]': [subscription.id] });
      expect(res.body.status).to.be.equal('Success');
    });

    it('should pause and unpause an array of subscription', async () => {
      const subscriptions = [];
      const subscription1: NotificationSubscription = await modelUtils.createSubscription({
        object_id: community,
        jwt: jwtToken,
        is_active: true,
        category: NotificationCategories.NewThread,
      });
      const subscription2: NotificationSubscription = await modelUtils.createSubscription({
        object_id: community,
        jwt: jwtToken,
        is_active: true,
        category: NotificationCategories.NewThread,
      });
      const subscription3: NotificationSubscription = await modelUtils.createSubscription({
        object_id: community,
        jwt: jwtToken,
        is_active: true,
        category: NotificationCategories.NewThread,
      });
      subscriptions.push(subscription1.id, subscription2.id, subscription3.id);
      let res = await chai.request(app)
        .post('/api/disableSubscriptions')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, 'subscription_ids[]': subscriptions });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');

      res = await chai.request(app)
        .post('/api/enableSubscriptions')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, 'subscription_ids[]': subscriptions });
      expect(res.body.status).to.be.equal('Success');
    });
  });

  describe('/deleteSubscription', () => {
    it('should delete an active subscription', async () => {
      const subscription: NotificationSubscription = await modelUtils.createSubscription({
        object_id: community,
        jwt: jwtToken,
        is_active: true,
        category: NotificationCategories.NewThread,
      });
      expect(subscription).to.not.be.null;
      const res = await chai.request(app)
        .post('/api/deleteSubscription')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, 'subscription_id': subscription.id });
      expect(res.body.status).to.be.equal('Success');
    });
  });

  describe('Notification Routes', () => {
    let subscription;
    let thread;
    let notifications;

    it('emitting a notification', async () => {
      // Subscription for Default User in 'Staking'
      subscription = await modelUtils.createSubscription({
        object_id: community,
        jwt: jwtToken,
        is_active: true,
        category: NotificationCategories.NewThread,
      });
      // New User makes a thread in 'Staking', should emit notification to Default User
      const result = await modelUtils.createAndVerifyAddress({ chain });
      const newAddress = result.address;
      const newJWT = jwt.sign({ id: result.user_id, email: result.email }, JWT_SECRET);
      thread = await modelUtils.createThread({
        chain,
        community,
        jwt: newJWT,
        address: newAddress,
        title: 'hi',
        body: 'hi you!',
      });
      expect(subscription).to.not.be.null;
      expect(thread).to.not.be.null;
    });

    it('/viewNotifications', async () => {
      // Get Notifications for Default User
      expect(subscription).to.not.be.null;
      expect(thread).to.not.be.null;
      const res = await chai.request(app)
        .post('/api/viewNotifications')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.length).to.be.greaterThan(0);
      notifications = res.body.result;
    });

    it('/markNotificationsRead', async () => {
      // Mark Notifications Read for Default User
      expect(notifications).to.not.be.null;
      const notification_ids = notifications.map((n) => { return n.id; });
      const res = await chai.request(app)
        .post('/api/markNotificationsRead')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, 'notification_ids[]': notification_ids });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
    });

    it('/clearReadNotifications', async () => {
      // Clear Read for Default User
      expect(notifications).to.not.be.null;
      const res = await chai.request(app)
        .post('/api/clearReadNotifications')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
    });
  });
});
