import chai from 'chai';
import chaiHttp from 'chai-http';
import { resetDatabase } from '../../server-test';
import DatabaseCleaner from '../../server/util/databaseCleaner';
import models from '../../server/database';
import sinon from 'sinon';
import { NotificationCategories } from 'common-common/src/types';
import { QueryTypes } from 'sequelize';

chai.use(chaiHttp);
const { expect } = chai;

describe('DatabaseCleaner Tests', () => {
  before('Reset database', async () => {
    await resetDatabase();
  });

  describe('Tests when the cleaner runs', () => {
    let clock: sinon.SinonFakeTimers;

    before(function () {
      const now = new Date();
      now.setUTCHours(8);
      now.setUTCMinutes(0);
      now.setUTCMilliseconds(0);

      // set clock to 8 AM UTC current year, month, and day
      clock = sinon.useFakeTimers(now);
    });

    after(function () {
      clock.restore();
    });

    it('should not run if started before the correct hour', () => {
      const now = new Date();
      // set cleaner to run at 10 AM UTC
      console.log('input time to run', now.toString(), now.getUTCHours() + 4);
      const dbCleaner = new DatabaseCleaner(models, now.getUTCHours() + 4);
      expect(dbCleaner.timeToRun.getTime()).to.be.equal(
        now.getTime() + 14400000
      );
      expect(dbCleaner.completed).to.be.false;
      expect(dbCleaner.timeoutID).to.not.be.undefined;
    });

    it('should run exactly once (immediately) if started in the correct hour', () => {
      const now = new Date();
      const dbCleaner = new DatabaseCleaner(models, now.getUTCHours());
      expect(dbCleaner.timeToRun.getUTCHours()).to.be.equal(now.getUTCHours());
      expect(dbCleaner.timeToRun.getTime()).to.be.equal(now.getTime());
      expect(dbCleaner.timeoutID).to.not.be.undefined;
    });

    it('should not run if started after the correct hour', () => {
      const now = new Date();
      const dbCleaner = new DatabaseCleaner(models, now.getUTCHours() - 4);
      now.setUTCDate(now.getUTCDate() + 1);
      now.setUTCHours(now.getUTCHours() - 4);
      expect(dbCleaner.timeToRun.getTime()).to.be.equal(now.getTime());
      expect(dbCleaner.completed).to.be.false;
      expect(dbCleaner.timeoutID).to.not.be.undefined;
    });

    it('should not run if an hour to run is not provided', () => {
      const dbCleaner = new DatabaseCleaner(models, NaN);
      expect(dbCleaner.timeToRun).to.be.undefined;
      expect(dbCleaner.timeoutID).to.be.undefined;
    });

    it('should not run if the hour provided is invalid', () => {
      let dbCleaner = new DatabaseCleaner(models, 24);
      expect(dbCleaner.timeToRun).to.be.undefined;
      expect(dbCleaner.timeoutID).to.be.undefined;

      dbCleaner = new DatabaseCleaner(models, 25);
      expect(dbCleaner.timeToRun).to.be.undefined;
      expect(dbCleaner.timeoutID).to.be.undefined;

      dbCleaner = new DatabaseCleaner(models, -1);
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

      const ninetyTwoDaysAgo = new Date(now);
      ninetyTwoDaysAgo.setUTCDate(now.getUTCDate() - 92);

      // create old notification
      await models.Notification.create({
        notification_data: 'testing',
        created_at: ninetyTwoDaysAgo,
        chain_id: 'ethereum',
        category_id: 'new-thread-creation',
      });

      // create new notification
      await models.Notification.create({
        notification_data: 'testing',
        chain_id: 'ethereum',
        created_at: eightyEightDaysAgo,
        category_id: 'new-thread-creation',
      });

      const dbCleaner = new DatabaseCleaner(models, now.getUTCHours() + 2);
      const originalTimeoutID = dbCleaner.timeoutID;
      clock.runAll();

      const waitForStart = new Promise((resolve) => {
        const intervalId = setInterval(() => {
          if (dbCleaner.timeoutID != originalTimeoutID) {
            clearInterval(intervalId);
            resolve(null);
          } else {
            console.log(
              'Waiting on cleaner to finish executing the start method...'
            );
          }
        }, 100);
      });
      await waitForStart;

      const notifs = await models.Notification.findAll();
      expect(notifs.length).to.equal(1);
      expect(notifs[0].created_at.toString()).to.equal(
        eightyEightDaysAgo.toString()
      );
    });

    it('Should only delete subscriptions associated with users that have not logged-in in over 1 year', async () => {
      const now = new Date();

      const oneYearAndTwoDaysAgo = new Date(now);
      oneYearAndTwoDaysAgo.setUTCFullYear(
        oneYearAndTwoDaysAgo.getUTCFullYear() - 1
      );
      oneYearAndTwoDaysAgo.setUTCDate(oneYearAndTwoDaysAgo.getUTCDate() - 2);

      // raw query so we can set updated_at manually
      const oldUser = <any>(
        await models.sequelize.query(
          `
        INSERT INTO "Users"(email, created_at, updated_at, "lastVisited", "emailNotificationInterval")
        VALUES ('dbCleanerOld@test.com', NOW() - INTERVAL '1 year' - INTERVAL '2 days', NOW() - INTERVAL '1 year' - INTERVAL '2 days', '{}', 'never')
        RETURNING id;
      `,
          { type: QueryTypes.INSERT, raw: true }
        )
      )[0][0];

      const newUser = <any>(
        await models.sequelize.query(
          `
        INSERT INTO "Users"(email, created_at, updated_at, "lastVisited", "emailNotificationInterval")
        VALUES ('dbCleanerNew@test.com', NOW(), NOW(), '{}', 'never')
        RETURNING id;
      `,
          { type: QueryTypes.INSERT, raw: true }
        )
      )[0][0];

      const newSub = await models.Subscription.create({
        subscriber_id: newUser.id,
        category_id: NotificationCategories.NewThread,
        object_id: 'ethereum',
        is_active: true,
        immediate_email: false,
      });

      const oldSub = await models.Subscription.create({
        subscriber_id: oldUser.id,
        category_id: NotificationCategories.NewThread,
        object_id: 'ethereum',
        is_active: true,
        immediate_email: false,
      });

      const dbCleaner = new DatabaseCleaner(models, now.getHours() + 2);
      const originalTimeoutID = dbCleaner.timeoutID;
      clock.runAll();

      const waitForStart = new Promise((resolve) => {
        const intervalId = setInterval(() => {
          if (dbCleaner.timeoutID != originalTimeoutID) {
            clearInterval(intervalId);
            resolve(null);
          } else {
            console.log(
              'Waiting on cleaner to finish executing the start method...'
            );
          }
        }, 100);
      });
      await waitForStart;

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
