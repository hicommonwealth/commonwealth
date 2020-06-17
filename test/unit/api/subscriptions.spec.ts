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
import Errors from '../../../server/routes/subscription/errors';
import { Errors as MarkNotifErrors } from '../../../server/routes/markNotificationsRead';

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
        chainId: chain,
        communityId: community,
        address: loggedInAddr,
        jwt: jwtToken,
        title: 't',
        body: 't',
        kind: 'forum',
        tagName: 't',
        tagId: undefined
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

    it('should pause and unpause a subscription with just the id as string (not array)', async () => {
      expect(subscription).to.not.be.null;
      let res = await chai.request(app)
        .post('/api/disableSubscriptions')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, 'subscription_ids[]': subscription.id.toString() });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
      res = await chai.request(app)
        .post('/api/enableSubscriptions')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, 'subscription_ids[]': subscription.id.toString() });
      expect(res.body.status).to.be.equal('Success');
    });

    it('should pause and unpause an array of subscription', async () => {
      const subscriptions = [];
      for (let i = 0; i < 3; i++) {
        subscriptions.push(modelUtils.createSubscription({
          object_id: community,
          jwt: jwtToken,
          is_active: true,
          category: NotificationCategories.NewThread,
        }));
      }
      const subscriptionIds = (await Promise.all(subscriptions)).map((s) => s.id);
      let res = await chai.request(app)
        .post('/api/disableSubscriptions')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, 'subscription_ids[]': subscriptionIds });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');

      res = await chai.request(app)
        .post('/api/enableSubscriptions')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, 'subscription_ids[]': subscriptionIds });
      expect(res.body.status).to.be.equal('Success');
    });

    it('should fail to enable and disable subscriptions not owned by the requester', async () => {
      expect(subscription).to.not.be.null;
      const result = await modelUtils.createAndVerifyAddress({ chain });
      const newJWT = jwt.sign({ id: result.user_id, email: result.email }, JWT_SECRET);
      let res = await chai.request(app)
        .post('/api/enableSubscriptions')
        .set('Accept', 'application/json')
        .send({ jwt: newJWT, 'subscription_ids[]': [subscription.id] });
      expect(res.body).to.not.be.null;
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(Errors.NotUsersSubscription);
      res = await chai.request(app)
        .post('/api/disableSubscriptions')
        .set('Accept', 'application/json')
        .send({ jwt: newJWT, 'subscription_ids[]': [subscription.id] });
      expect(res.body).to.not.be.null;
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(Errors.NotUsersSubscription);
    });

    it('should fail to enable and disable subscription when no subscriptions are passed to route', async () => {
      let res = await chai.request(app)
        .post('/api/enableSubscriptions')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken });
      expect(res.body).to.not.be.null;
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(Errors.NoSubscriptionId);
      res = await chai.request(app)
        .post('/api/disableSubscriptions')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken });
      expect(res.body).to.not.be.null;
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(Errors.NoSubscriptionId);
    });
  });

  describe('/enableImmediateEmails and /disableImmediateEmails', () => {
    let subscription: NotificationSubscription;
    beforeEach('creating a subscription', async () => {
      subscription = await modelUtils.createSubscription({
        object_id: community,
        jwt: jwtToken,
        is_active: true,
        category: NotificationCategories.NewThread,
      });
    });

    it('should turn on immediate emails, /enableImmediateEmails', async () => {
      expect(subscription).to.not.be.null;
      const res = await chai.request(app)
        .post('/api/enableImmediateEmails')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, 'subscription_ids[]': [subscription.id] });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
    });

    it('should turn off immediate emails, /disableImmediateEmails', async () => {
      expect(subscription).to.not.be.null;
      const res = await chai.request(app)
        .post('/api/disableImmediateEmails')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, 'subscription_ids[]': [subscription.id] });
      expect(res.body.status).to.be.equal('Success');
    });

    it('should fail to enable and disable immediate emails when not passed ids', async () => {
      expect(subscription).to.not.be.null;
      let res = await chai.request(app)
        .post('/api/enableImmediateEmails')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, });
      expect(res.body).to.not.be.null;
      expect(res.body.error).to.be.equal(Errors.NoSubscriptionId);
      res = await chai.request(app)
        .post('/api/disableImmediateEmails')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, });
      expect(res.body).to.not.be.null;
      expect(res.body.error).to.be.equal(Errors.NoSubscriptionId);
    });

    it('should successfully enable and disable with just a string id', async () => {
      expect(subscription).to.not.be.null;
      let res = await chai.request(app)
        .post('/api/enableImmediateEmails')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, 'subscription_ids[]': subscription.id.toString() });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
      res = await chai.request(app)
        .post('/api/disableImmediateEmails')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, 'subscription_ids[]': subscription.id.toString() });
      expect(res.body.status).to.be.equal('Success');
    });

    it('should fail to enable and disable immediate emails when requester does not own the subscription', async () => {
      const result = await modelUtils.createAndVerifyAddress({ chain });
      const newJwt = jwt.sign({ id: result.user_id, email: result.email }, JWT_SECRET);
      expect(subscription).to.not.be.null;
      let res = await chai.request(app)
        .post('/api/enableImmediateEmails')
        .set('Accept', 'application/json')
        .send({ jwt: newJwt, 'subscription_ids[]': [subscription.id] });
      expect(res.body).to.not.be.null;
      expect(res.body.error).to.be.equal(Errors.NotUsersSubscription);
      res = await chai.request(app)
        .post('/api/disableImmediateEmails')
        .set('Accept', 'application/json')
        .send({ jwt: newJwt, 'subscription_ids[]': [subscription.id] });
      expect(res.body.error).to.be.equal(Errors.NotUsersSubscription);
    });
  });

  describe('/deleteSubscription', () => {
    let subscription;

    beforeEach('make subscription', async () => {
      subscription = await modelUtils.createSubscription({
        object_id: community,
        jwt: jwtToken,
        is_active: true,
        category: NotificationCategories.NewThread,
      });
    });

    it('should delete an active subscription', async () => {
      expect(subscription).to.not.be.null;
      const res = await chai.request(app)
        .post('/api/deleteSubscription')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, 'subscription_id': subscription.id });
      expect(res.body.status).to.be.equal('Success');
    });

    it('should fail to delete when no subscription id is passed', async () => {
      expect(subscription).to.not.be.null;
      const res = await chai.request(app)
        .post('/api/deleteSubscription')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken });
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(Errors.NoSubscriptionId);
    });

    it('should fail to find a bad subscription id', async () => {
      expect(subscription).to.not.be.null;
      const res = await chai.request(app)
        .post('/api/deleteSubscription')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, 'subscription_id': 'hello' });
      expect(res.body.error).to.not.be.null;
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
        chainId: chain,
        communityId: community,
        jwt: newJWT,
        address: newAddress,
        title: 'hi',
        body: 'hi you!',
        kind: 'forum',
        tagName: 't',
        tagId: undefined
      });
      expect(subscription).to.not.be.null;
      expect(thread).to.not.be.null;
    });

    describe('/viewNotifications: return notifications to user', () => {
      it('should return all notifications with just a user\'s jwt', async () => {
        const res = await chai.request(app)
          .post('/api/viewNotifications')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken });
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');
        expect(res.body.result.length).to.be.greaterThan(0);
        notifications = res.body.result;
      });

      it('should return only unread notifications', async () => {
        const res = await chai.request(app)
          .post('/api/viewNotifications')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, unread_only: true, });
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');
        expect(res.body.result.length).to.be.greaterThan(0);
        notifications = res.body.result;
      });

      it('should return only notifications with active_only turned on', async () => {
        const res = await chai.request(app)
          .post('/api/viewNotifications')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, active_only: true, });
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');
        expect(res.body.result.length).to.be.greaterThan(0);
        notifications = res.body.result;
      });
    });

    describe('/markNotificationsRead', async () => {
      it('should pass when query formatted correctly', async () => {
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
      it('should pass when notification id is string', async () => {
        // Mark Notifications Read for Default User
        expect(notifications).to.not.be.null;
        const notification_ids = notifications.map((n) => { return n.id; });
        const res = await chai.request(app)
          .post('/api/markNotificationsRead')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken, 'notification_ids[]': notification_ids[0].toString() });
        expect(res.body).to.not.be.null;
        expect(res.body.status).to.be.equal('Success');
      });
      it('should fail when no notifications are passed', async () => {
        const res = await chai.request(app)
          .post('/api/markNotificationsRead')
          .set('Accept', 'application/json')
          .send({ jwt: jwtToken });
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.not.be.null;
        expect(res.body.error).to.be.equal(MarkNotifErrors.NoNotificationIds);
      });
      it('should fail when not the owner of the notification', async () => {
        expect(notifications).to.not.be.null;
        const notification_ids = notifications.map((n) => { return n.id; });
        const result = await modelUtils.createAndVerifyAddress({ chain });
        const newJwt = jwt.sign({ id: result.user_id, email: result.email }, JWT_SECRET);
        const res = await chai.request(app)
          .post('/api/markNotificationsRead')
          .set('Accept', 'application/json')
          .send({ jwt: newJwt, 'notification_ids[]': notification_ids });
        expect(res.body).to.not.be.null;
        expect(res.body.error).to.not.be.null;
        expect(res.body.error).to.be.equal(MarkNotifErrors.WrongOwner);
      });
    });

    describe('/clearReadNotifications', async () => {
      it('should pass when query formatted correctly', async () => {
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
});
