/* eslint-disable @typescript-eslint/no-unused-vars */
import { NotificationCategories } from '@hicommonwealth/core';
import { models, tester } from '@hicommonwealth/model';
import chai from 'chai';
import chaiHttp from 'chai-http';
import jwt from 'jsonwebtoken';
import app from '../../../server-test';
import { JWT_SECRET } from '../../../server/config';
import { Errors as MarkNotifErrors } from '../../../server/routes/markNotificationsRead';
import * as modelUtils from '../../util/modelUtils';

chai.use(chaiHttp);
const { expect } = chai;

describe('Notification Routes Tests', () => {
  let jwtToken,
    userId,
    notification,
    notificationTwo,
    notificationThree,
    newThreadSub,
    chainEventSub;
  const chain = 'ethereum';

  before(async () => {
    await tester.seedDb();
    // get logged in address/user with JWT
    const result = await modelUtils.createAndVerifyAddress({ chain });
    userId = result.user_id;
    jwtToken = jwt.sign(
      { id: result.user_id, email: result.email },
      JWT_SECRET,
    );

    newThreadSub = await modelUtils.createSubscription({
      jwt: jwtToken,
      is_active: true,
      category: NotificationCategories.NewThread,
      chain_id: chain,
    });

    chainEventSub = await modelUtils.createSubscription({
      jwt: jwtToken,
      is_active: true,
      category: NotificationCategories.NewThread,
      chain_id: chain,
    });

    notification = await models.Notification.create({
      category_id: NotificationCategories.NewThread,
      community_id: chain,
      notification_data: '',
    });

    notificationTwo = await models.Notification.create({
      category_id: NotificationCategories.NewThread,
      community_id: chain,
      notification_data: '',
    });

    notificationThree = await models.Notification.create({
      category_id: NotificationCategories.ChainEvent,
      community_id: chain,
      notification_data: '',
    });

    await models.NotificationsRead.create({
      user_id: userId,
      notification_id: notification.id,
      subscription_id: newThreadSub.id,
      is_read: false,
    });

    await models.NotificationsRead.create({
      user_id: userId,
      notification_id: notificationTwo.id,
      subscription_id: newThreadSub.id,
      is_read: true,
    });

    await models.NotificationsRead.create({
      user_id: userId,
      notification_id: notificationThree.id,
      subscription_id: chainEventSub.id,
      is_read: false,
    });
  });

  describe('/viewNotifications: return notifications to user', () => {
    it('should return a users discussion notifications', async () => {
      const res = await chai
        .request(app)
        .post('/api/viewDiscussionNotifications')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken });

      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.numUnread).to.equal(2);
      expect(res.body.result.subscriptions.length).to.be.equal(1);
      expect(
        res.body.result.subscriptions[0].NotificationsReads.length,
      ).to.equal(2);
      expect(
        res.body.result.subscriptions[0].NotificationsReads.find(
          (s) =>
            s.Notification.category_id === NotificationCategories.NewThread &&
            s.notification_id === notification.id &&
            s.is_read === false &&
            s.subscription_id === newThreadSub.id,
        ),
      ).to.not.be.null;
      expect(
        res.body.result.subscriptions[0].NotificationsReads.find(
          (s) =>
            s.Notification.category_id === NotificationCategories.NewThread &&
            s.notification_id === notificationTwo.id &&
            s.is_read === true &&
            s.subscription_id === newThreadSub.id,
        ),
      ).to.not.be.null;
    });

    it('should return only unread notifications', async () => {
      const res = await chai
        .request(app)
        .post('/api/viewDiscussionNotifications')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, unread_only: true });

      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.numUnread).to.equal(2);
      expect(res.body.result.subscriptions.length).to.be.equal(1);
      expect(
        res.body.result.subscriptions[0].NotificationsReads.length,
      ).to.equal(1);
      const NR = res.body.result.subscriptions[0].NotificationsReads[0];
      expect(NR.notification_id).to.equal(notification.id);
      expect(NR.subscription_id).to.equal(newThreadSub.id);
      expect(NR.is_read).to.be.false;
    });

    it('should return only notifications with active_only turned on', async () => {
      const newSub = await modelUtils.createSubscription({
        jwt: jwtToken,
        is_active: false,
        category: NotificationCategories.NewThread,
        chain_id: chain,
      });

      const res = await chai
        .request(app)
        .post('/api/viewDiscussionNotifications')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken, active_only: true });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result.subscriptions.length).to.equal(1);
    });
  });

  describe('/markNotificationsRead', async () => {
    it('should mark multiple notifications as read', async () => {
      const res = await chai
        .request(app)
        .post('/api/markNotificationsRead')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          'notification_ids[]': [notification.id, notificationThree.id],
        });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
      const nrOne = await models.NotificationsRead.findOne({
        where: { notification_id: notification.id, user_id: userId },
      });
      expect(nrOne.is_read).to.be.true;
      const nrTwo = await models.NotificationsRead.findOne({
        where: { notification_id: notificationThree.id, user_id: userId },
      });
      expect(nrTwo.is_read).to.be.true;
    });

    it('should pass when notification id is a string instead of an array', async () => {
      const notif = await models.Notification.create({
        category_id: NotificationCategories.NewThread,
        community_id: chain,
        notification_data: '',
      });

      await models.NotificationsRead.create({
        user_id: userId,
        notification_id: notif.id,
        subscription_id: newThreadSub.id,
        is_read: false,
      });

      const res = await chai
        .request(app)
        .post('/api/markNotificationsRead')
        .set('Accept', 'application/json')
        .send({
          jwt: jwtToken,
          'notification_ids[]': notif.id,
        });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
      const nr = await models.NotificationsRead.findOne({
        where: { notification_id: notif.id, user_id: userId },
      });
      expect(nr.is_read).to.be.true;
    });

    it('should fail when no notifications are passed', async () => {
      const res = await chai
        .request(app)
        .post('/api/markNotificationsRead')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken });
      expect(res.body).to.not.be.null;
      expect(res.body.error).to.not.be.null;
      expect(res.body.error).to.be.equal(MarkNotifErrors.NoNotificationIds);
    });
  });

  describe('/clearReadNotifications', async () => {
    it('should pass when query formatted correctly', async () => {
      const res = await chai
        .request(app)
        .post('/api/clearReadNotifications')
        .set('Accept', 'application/json')
        .send({ jwt: jwtToken });
      expect(res.body).to.not.be.null;
      expect(res.body.status).to.be.equal('Success');
      expect(res.body.result).to.equal('Cleared read notifications');
      const NR = await models.NotificationsRead.findAll({
        where: { user_id: userId },
      });
      expect(NR.length).to.equal(0);
    });
  });
});
