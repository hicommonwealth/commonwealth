import { dispose } from '@hicommonwealth/core';
import {
  getCommentSearchVector,
  getThreadSearchVector,
  tester,
  type DB,
} from '@hicommonwealth/model';
import chai from 'chai';
import chaiHttp from 'chai-http';
import { Sequelize } from 'sequelize';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';
import { DatabaseCleaner } from '../../server/util/databaseCleaner';

chai.use(chaiHttp);

describe('DatabaseCleaner Tests', async () => {
  let models: DB;

  beforeAll(async () => {
    models = await tester.seedDb();
  });

  afterAll(async () => {
    await dispose()();
  });

  describe('Tests when the cleaner runs', () => {
    beforeEach(function () {
      const now = new Date();
      now.setUTCHours(8);
      now.setUTCMinutes(0);
      now.setUTCMilliseconds(0);

      // set clock to 8 AM UTC current year, month, and day
      vi.useFakeTimers({
        now,
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
      vi.useRealTimers();
    });

    test('should not run if started before the correct hour', () => {
      const now = new Date();
      // set cleaner to run at 10 AM UTC
      console.log('input time to run', now.toString(), now.getUTCHours() + 4);
      const dbCleaner = new DatabaseCleaner();
      dbCleaner.initLoop(models, now.getUTCHours() + 4);

      expect(dbCleaner.timeoutID).to.not.be.undefined;
      clearTimeout(dbCleaner.timeoutID);
      expect(dbCleaner.timeToRun.getTime()).to.be.equal(
        now.getTime() + 14400000,
      );
      expect(dbCleaner.completed).to.be.false;
    });

    test('should run exactly once (immediately) if started in the correct hour', () => {
      const now = new Date();
      now.setUTCMinutes(0);
      now.setUTCMilliseconds(0);
      const dbCleaner = new DatabaseCleaner();
      dbCleaner.initLoop(models, now.getUTCHours());
      expect(dbCleaner.timeoutID).to.not.be.undefined;
      clearTimeout(dbCleaner.timeoutID);
      expect(dbCleaner.timeToRun.getUTCHours()).to.be.equal(now.getUTCHours());
      expect(dbCleaner.timeToRun.getTime()).to.be.equal(now.getTime());
    });

    test('should not run if started after the correct hour', () => {
      const now = new Date();
      const dbCleaner = new DatabaseCleaner();
      dbCleaner.initLoop(models, now.getUTCHours() - 4);
      expect(dbCleaner.timeoutID).to.not.be.undefined;
      clearTimeout(dbCleaner.timeoutID);
      now.setUTCDate(now.getUTCDate() + 1);
      now.setUTCHours(now.getUTCHours() - 4);
      now.setUTCMinutes(0);
      now.setUTCMilliseconds(0);
      expect(dbCleaner.timeToRun.getTime()).to.be.equal(now.getTime());
      expect(dbCleaner.completed).to.be.false;
    });

    test('should not run if an hour to run is not provided', () => {
      const dbCleaner = new DatabaseCleaner();
      dbCleaner.initLoop(models, NaN);
      expect(dbCleaner.timeToRun).to.be.undefined;
      expect(dbCleaner.timeoutID).to.be.undefined;
    });

    test('should not run if the hour provided is invalid', () => {
      let dbCleaner = new DatabaseCleaner();
      dbCleaner.initLoop(models, 24);
      expect(dbCleaner.timeToRun).to.be.undefined;
      expect(dbCleaner.timeoutID).to.be.undefined;

      dbCleaner = new DatabaseCleaner();
      dbCleaner.initLoop(models, 25);
      expect(dbCleaner.timeToRun).to.be.undefined;
      expect(dbCleaner.timeoutID).to.be.undefined;

      dbCleaner = new DatabaseCleaner();
      dbCleaner.initLoop(models, -1);
      expect(dbCleaner.timeToRun).to.be.undefined;
      expect(dbCleaner.timeoutID).to.be.undefined;
    });
  });

  describe('Tests what the cleaner cleans', () => {
    beforeAll(function () {
      const now = new Date();
      now.setUTCHours(8);
      now.setUTCMinutes(0);
      now.setUTCMilliseconds(0);
      // set clock to 8 AM UTC current year, month, and day
      vi.useFakeTimers({
        now,
        shouldAdvanceTime: true,
      });
    });

    afterAll(function () {
      vi.restoreAllMocks();
      vi.useRealTimers();
    });

    test('Should only delete subscriptions associated with users that have not logged-in in over 1 year', async () => {
      const now = new Date();

      const oneYearAndTwoDaysAgo = new Date(now);
      oneYearAndTwoDaysAgo.setUTCFullYear(
        oneYearAndTwoDaysAgo.getUTCFullYear() - 1,
      );
      oneYearAndTwoDaysAgo.setUTCDate(oneYearAndTwoDaysAgo.getUTCDate() - 2);

      // create old user and address
      const oldUser = await models.User.create({
        email: 'dbCleanerTest@old.com',
        emailVerified: true,
        profile: {},
      });
      // @ts-expect-error StrictNullChecks
      await models.Address.create({
        user_id: oldUser.id,
        address: '0x1234',
        community_id: 'ethereum',
        verification_token: 'blah',
        last_active: Sequelize.literal(`NOW() - INTERVAL '13 months'`) as any,
      });

      // create new user and address
      const newUser = await models.User.create({
        email: 'dbCleanerTest@new.com',
        emailVerified: true,
        profile: {},
      });
      // @ts-expect-error StrictNullChecks
      const address = await models.Address.create({
        user_id: newUser.id,
        address: '0x2345',
        community_id: 'ethereum',
        verification_token: 'blah',
        last_active: Sequelize.literal(`NOW()`) as any,
      });

      const topic = await models.Topic.create({
        name: 'test-123',
        community_id: 'ethereum',
        description: 'test-123',
        featured_in_sidebar: false,
        featured_in_new_post: false,
        group_ids: [],
      });

      const thread = await models.Thread.create({
        address_id: address.id!,
        title: 'Testing',
        body: 'test',
        community_id: 'ethereum',
        reaction_count: 0,
        reaction_weights_sum: '0',
        kind: 'discussion',
        stage: 'discussion',
        view_count: 0,
        comment_count: 0,
        search: getThreadSearchVector('Testing', ''),
        topic_id: topic!.id!,
      });

      const comment = await models.Comment.create({
        thread_id: thread.id!,
        address_id: address.id!,
        body: 'Testing',
        reaction_count: 0,
        reaction_weights_sum: '0',
        comment_level: 0,
        reply_count: 0,
        search: getCommentSearchVector('Testing'),
      });

      await models.ThreadSubscription.create({
        user_id: newUser.id!,
        thread_id: thread.id!,
      });
      await models.ThreadSubscription.create({
        user_id: oldUser.id!,
        thread_id: thread.id!,
      });

      await models.CommentSubscription.create({
        user_id: newUser.id!,
        comment_id: comment.id!,
      });
      await models.CommentSubscription.create({
        user_id: oldUser.id!,
        comment_id: comment.id!,
      });

      await models.CommunityAlert.create({
        user_id: newUser.id!,
        community_id: 'ethereum',
      });
      await models.CommunityAlert.create({
        user_id: oldUser.id!,
        community_id: 'ethereum',
      });

      const dbCleaner = new DatabaseCleaner();
      dbCleaner.init(models);
      await dbCleaner.executeQueries();

      const newThreadSubRes = await models.ThreadSubscription.findOne({
        where: {
          user_id: newUser.id!,
          thread_id: thread.id!,
        },
      });
      expect(newThreadSubRes).to.not.equal(null);
      const oldThreadSubRes = await models.ThreadSubscription.findOne({
        where: {
          user_id: oldUser.id!,
          thread_id: thread.id!,
        },
      });
      expect(oldThreadSubRes).to.equal(null);

      const newCommentSubRes = await models.CommentSubscription.findOne({
        where: {
          user_id: newUser.id!,
          comment_id: comment.id!,
        },
      });
      expect(newCommentSubRes).to.not.equal(null);
      const oldCommentSubRes = await models.CommentSubscription.findOne({
        where: {
          user_id: oldUser.id!,
          comment_id: comment.id!,
        },
      });
      expect(oldCommentSubRes).to.equal(null);

      const newAlertSubRes = await models.CommunityAlert.findOne({
        where: {
          user_id: newUser.id!,
          community_id: 'ethereum',
        },
      });
      expect(newAlertSubRes).to.not.equal(null);
      const oldAlertSubRes = await models.CommunityAlert.findOne({
        where: {
          user_id: oldUser.id!,
          community_id: 'ethereum',
        },
      });
      expect(oldAlertSubRes).to.equal(null);
    });
  });
});
