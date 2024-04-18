import { dispose } from '@hicommonwealth/core';
import { tester, type DB } from '@hicommonwealth/model';
import { NotificationCategories } from '@hicommonwealth/shared';
import chai from 'chai';
import chaiHttp from 'chai-http';
import { Sequelize } from 'sequelize';
import sinon from 'sinon';
import { DatabaseCleaner } from '../../server/util/databaseCleaner';

chai.use(chaiHttp);
const { expect } = chai;

describe('DatabaseCleaner Tests', async () => {
  let models: DB;

  before(async () => {
    models = await tester.seedDb();
  });

  after(async () => {
    await dispose()();
  });

  describe('Tests when the cleaner runs', () => {
    let clock: sinon.SinonFakeTimers;

    beforeEach(function () {
      const now = new Date();
      now.setUTCHours(8);
      now.setUTCMinutes(0);
      now.setUTCMilliseconds(0);

      // set clock to 8 AM UTC current year, month, and day
      clock = sinon.useFakeTimers(now);
    });

    afterEach(function () {
      clock.restore();
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should not run if started before the correct hour', () => {
      const now = new Date();
      // set cleaner to run at 10 AM UTC
      console.log('input time to run', now.toString(), now.getUTCHours() + 4);
      const dbCleaner = new DatabaseCleaner();
      dbCleaner.initLoop(models, now.getUTCHours() + 4, true);

      expect(dbCleaner.timeoutID).to.not.be.undefined;
      clearTimeout(dbCleaner.timeoutID);
      expect(dbCleaner.timeToRun.getTime()).to.be.equal(
        now.getTime() + 14400000,
      );
      expect(dbCleaner.completed).to.be.false;
    });

    it('should run exactly once (immediately) if started in the correct hour', () => {
      const now = new Date();
      now.setUTCMinutes(0);
      now.setUTCMilliseconds(0);
      const dbCleaner = new DatabaseCleaner();
      dbCleaner.initLoop(models, now.getUTCHours(), true);
      expect(dbCleaner.timeoutID).to.not.be.undefined;
      clearTimeout(dbCleaner.timeoutID);
      expect(dbCleaner.timeToRun.getUTCHours()).to.be.equal(now.getUTCHours());
      expect(dbCleaner.timeToRun.getTime()).to.be.equal(now.getTime());
    });

    it('should not run if started after the correct hour', () => {
      const now = new Date();
      const dbCleaner = new DatabaseCleaner();
      dbCleaner.initLoop(models, now.getUTCHours() - 4, true);
      expect(dbCleaner.timeoutID).to.not.be.undefined;
      clearTimeout(dbCleaner.timeoutID);
      now.setUTCDate(now.getUTCDate() + 1);
      now.setUTCHours(now.getUTCHours() - 4);
      now.setUTCMinutes(0);
      now.setUTCMilliseconds(0);
      expect(dbCleaner.timeToRun.getTime()).to.be.equal(now.getTime());
      expect(dbCleaner.completed).to.be.false;
    });

    it('should not run if an hour to run is not provided', () => {
      const dbCleaner = new DatabaseCleaner();
      dbCleaner.initLoop(models, NaN, true);
      expect(dbCleaner.timeToRun).to.be.undefined;
      expect(dbCleaner.timeoutID).to.be.undefined;
    });

    it('should not run if the hour provided is invalid', () => {
      let dbCleaner = new DatabaseCleaner();
      dbCleaner.initLoop(models, 24, true);
      expect(dbCleaner.timeToRun).to.be.undefined;
      expect(dbCleaner.timeoutID).to.be.undefined;

      dbCleaner = new DatabaseCleaner();
      dbCleaner.initLoop(models, 25, true);
      expect(dbCleaner.timeToRun).to.be.undefined;
      expect(dbCleaner.timeoutID).to.be.undefined;

      dbCleaner = new DatabaseCleaner();
      dbCleaner.initLoop(models, -1, true);
      expect(dbCleaner.timeToRun).to.be.undefined;
      expect(dbCleaner.timeoutID).to.be.undefined;
    });
  });

  describe('Tests what the cleaner cleans', () => {
    let clock: sinon.SinonFakeTimers;

    before(function () {
      const now = new Date();
      now.setUTCHours(8);
      now.setUTCMinutes(0);
      now.setUTCMilliseconds(0);
      // set clock to 8 AM UTC current year, month, and day
      // clock = sinon.useFakeTimers(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 8)));
      clock = sinon.useFakeTimers({
        now,
        shouldAdvanceTime: true,
      });
    });

    after(function () {
      clock.restore();
    });

    it('Should only delete notifications older than 3 months', async () => {
      const currentNotifLength = (await models.Notification.findAll()).length;
      expect(currentNotifLength).to.equal(0);

      const now = new Date();

      const eightyEightDaysAgo = new Date(now);
      eightyEightDaysAgo.setUTCDate(now.getUTCDate() - 88);

      const hundredDaysAgo = new Date(now);
      hundredDaysAgo.setUTCDate(now.getUTCDate() - 100);

      // create old notification
      await models.Notification.create({
        notification_data: 'testing',
        created_at: hundredDaysAgo,
        community_id: 'ethereum',
        category_id: 'new-thread-creation',
      });

      // create new notification
      await models.Notification.create({
        notification_data: 'testing',
        community_id: 'ethereum',
        created_at: eightyEightDaysAgo,
        category_id: 'new-thread-creation',
      });

      const dbCleaner = new DatabaseCleaner();
      dbCleaner.init(models);
      await dbCleaner.executeQueries();

      const notifs = await models.Notification.findAll();
      expect(notifs.length).to.equal(1);
      expect(notifs[0].created_at.toString()).to.equal(
        eightyEightDaysAgo.toString(),
      );
    });

    it('Should only delete subscriptions associated with users that have not logged-in in over 1 year', async () => {
      const now = new Date();

      const oneYearAndTwoDaysAgo = new Date(now);
      oneYearAndTwoDaysAgo.setUTCFullYear(
        oneYearAndTwoDaysAgo.getUTCFullYear() - 1,
      );
      oneYearAndTwoDaysAgo.setUTCDate(oneYearAndTwoDaysAgo.getUTCDate() - 2);

      // create old user and address
      const oldUser = await models.User.createWithProfile({
        email: 'dbCleanerTest@old.com',
        emailVerified: true,
      });
      await models.Address.create({
        user_id: oldUser.id,
        address: '0x1234',
        community_id: 'ethereum',
        verification_token: 'blah',
        last_active: Sequelize.literal(`NOW() - INTERVAL '13 months'`) as any,
      });

      // create new user and address
      const newUser = await models.User.createWithProfile({
        email: 'dbCleanerTest@new.com',
        emailVerified: true,
      });
      await models.Address.create({
        user_id: newUser.id,
        address: '0x2345',
        community_id: 'ethereum',
        verification_token: 'blah',
        last_active: Sequelize.literal(`NOW()`) as any,
      });

      const newSub = await models.Subscription.create({
        subscriber_id: newUser.id,
        category_id: NotificationCategories.NewThread,
        community_id: 'ethereum',
        is_active: true,
        immediate_email: false,
      });

      const oldSub = await models.Subscription.create({
        subscriber_id: oldUser.id,
        category_id: NotificationCategories.NewThread,
        community_id: 'ethereum',
        is_active: true,
        immediate_email: false,
      });

      const dbCleaner = new DatabaseCleaner();
      dbCleaner.init(models);
      await dbCleaner.executeQueries();

      const subs = await models.Subscription.findAll();
      let newUserSub;
      for (const sub of subs) {
        if (sub.subscriber_id === newUser.id && sub.id === newSub.id)
          newUserSub = sub;
        if (sub.subscriber_id === oldUser.id && sub.id === oldSub.id)
          throw new Error('Old user subscription not deleted');
      }
      expect(newUserSub.id).to.equal(newSub.id);
    });
  });
});
