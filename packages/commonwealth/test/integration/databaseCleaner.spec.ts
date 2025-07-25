import { dispose } from '@hicommonwealth/core';
import {
  getCommentSearchVector,
  getThreadSearchVector,
  type DB,
} from '@hicommonwealth/model/models';
import * as tester from '@hicommonwealth/model/tester';
import { UserTierMap } from '@hicommonwealth/shared';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { cleanSubscriptions } from '../../server/workers/graphileWorker/tasks/cleanSubscriptions';

describe('DatabaseCleaner Tests', async () => {
  let models: DB;

  beforeAll(async () => {
    models = await tester.seedDb();
  });

  afterAll(async () => {
    await dispose()();
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
        tier: UserTierMap.ManuallyVerified,
      });
      await models.Address.create({
        user_id: oldUser.id,
        address: '0x1234',
        community_id: 'ethereum',
        verification_token: 'blah',
        last_active: new Date(Date.now() - 13 * 30 * 24 * 60 * 60 * 1000), // 13 months ago,
        ghost_address: false,
        role: 'member',
        is_banned: false,
      });

      // create new user and address
      const newUser = await models.User.create({
        email: 'dbCleanerTest@new.com',
        emailVerified: true,
        profile: {},
        tier: UserTierMap.ManuallyVerified,
      });
      const address = await models.Address.create({
        user_id: newUser.id,
        address: '0x2345',
        community_id: 'ethereum',
        verification_token: 'blah',
        last_active: new Date(),
        ghost_address: false,
        role: 'member',
        is_banned: false,
      });

      const topic = await models.Topic.create({
        name: 'test-123',
        community_id: 'ethereum',
        description: 'test-123',
        featured_in_sidebar: false,
        featured_in_new_post: false,
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
        is_linking_token: false,
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

      await cleanSubscriptions();

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
