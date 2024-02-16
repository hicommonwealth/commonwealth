import {
  IBaseForumNotificationData,
  NotificationCategories,
  NotificationDataAndCategory,
  SnapshotEventType,
  SupportedNetwork,
} from '@hicommonwealth/core';
import chai from 'chai';
import chaiHttp from 'chai-http';
import { mapNotificationsDataToSubscriptions } from '../../../server/util/subscriptionMapping';

chai.use(chaiHttp);
const { expect } = chai;

describe('Subscription Mapping Tests', () => {
  describe('Tests mapNotificationsDataToSubscriptions', () => {
    const chain = 'ethereum';
    const threadId = 1;
    const baseForumNotificationData: IBaseForumNotificationData = {
      created_at: new Date(),
      thread_id: threadId,
      root_title: 'title',
      root_type: 'type',
      community_id: chain,
      author_address: '0x123',
      author_chain: chain,
    };

    it('should map a new thread notification to subscriptions', () => {
      const notification: NotificationDataAndCategory = {
        categoryId: NotificationCategories.NewThread,
        data: {
          ...baseForumNotificationData,
          comment_text: 'text',
        },
      };
      const uniqueSubData = mapNotificationsDataToSubscriptions(notification);
      expect(uniqueSubData).to.deep.equal({
        category_id: NotificationCategories.NewThread,
        community_id: chain,
      });
    });

    it('should map a new comment notification to subscriptions', () => {
      const rootCommentNotif: NotificationDataAndCategory = {
        categoryId: NotificationCategories.NewComment,
        data: {
          ...baseForumNotificationData,
          comment_id: 1,
          comment_text: 'text',
        },
      };
      const uniqueSubData =
        mapNotificationsDataToSubscriptions(rootCommentNotif);
      expect(uniqueSubData).to.deep.equal({
        category_id: NotificationCategories.NewComment,
        thread_id: threadId,
      });

      const parentCommentId = 1;
      const childCommentNotif: NotificationDataAndCategory = {
        categoryId: NotificationCategories.NewComment,
        data: {
          ...baseForumNotificationData,
          comment_id: 2,
          comment_text: 'text',
          parent_comment_id: parentCommentId,
          parent_comment_text: 'text',
        },
      };

      const uniqueSubData2 =
        mapNotificationsDataToSubscriptions(childCommentNotif);
      expect(uniqueSubData2).to.deep.equal({
        category_id: NotificationCategories.NewComment,
        comment_id: parentCommentId,
      });
    });

    it('should map a new reaction notification to subscriptions', () => {
      const threadReactionNotif: NotificationDataAndCategory = {
        categoryId: NotificationCategories.NewReaction,
        data: {
          ...baseForumNotificationData,
        },
      };
      const uniqueSubData =
        mapNotificationsDataToSubscriptions(threadReactionNotif);
      expect(uniqueSubData).to.deep.equal({
        category_id: NotificationCategories.NewReaction,
        thread_id: threadId,
      });

      const comment_id = 1;
      const commentReactionNotif: NotificationDataAndCategory = {
        categoryId: NotificationCategories.NewReaction,
        data: {
          ...baseForumNotificationData,
          comment_id,
        },
      };
      const uniqueSubData2 =
        mapNotificationsDataToSubscriptions(commentReactionNotif);
      expect(uniqueSubData2).to.deep.equal({
        category_id: NotificationCategories.NewReaction,
        comment_id,
      });
    });

    it('should map a new mention notification to subscriptions', () => {
      const userId = 1;
      const threadMentionNotif: NotificationDataAndCategory = {
        categoryId: NotificationCategories.NewMention,
        data: {
          ...baseForumNotificationData,
          mentioned_user_id: userId,
          comment_text: 'text',
        },
      };
      const uniqueSubData =
        mapNotificationsDataToSubscriptions(threadMentionNotif);
      expect(uniqueSubData).to.deep.equal({
        category_id: NotificationCategories.NewMention,
        subscriber_id: userId,
      });

      const commentMentionNotif: NotificationDataAndCategory = {
        categoryId: NotificationCategories.NewMention,
        data: {
          ...baseForumNotificationData,
          mentioned_user_id: userId,
          comment_id: 1,
          comment_text: 'text',
        },
      };
      const uniqueSubData2 =
        mapNotificationsDataToSubscriptions(commentMentionNotif);
      expect(uniqueSubData2).to.deep.equal({
        category_id: NotificationCategories.NewMention,
        subscriber_id: userId,
      });
    });

    it('should map a new collaboration notification to subscriptions', () => {
      const userId = 1;
      const threadCollabNotif: NotificationDataAndCategory = {
        categoryId: NotificationCategories.NewCollaboration,
        data: {
          ...baseForumNotificationData,
          collaborator_user_id: userId,
          comment_text: 'text',
        },
      };
      const uniqueSubData =
        mapNotificationsDataToSubscriptions(threadCollabNotif);
      expect(uniqueSubData).to.deep.equal({
        category_id: NotificationCategories.NewCollaboration,
        subscriber_id: userId,
      });
    });

    it('should map a chain event notification to subscriptions', () => {
      const notification: NotificationDataAndCategory = {
        categoryId: NotificationCategories.ChainEvent,
        data: {
          id: 1,
          block_number: 1,
          event_data: {},
          network: SupportedNetwork.Aave,
          community_id: chain,
        },
      };
      const uniqueSubData = mapNotificationsDataToSubscriptions(notification);
      expect(uniqueSubData).to.deep.equal({
        category_id: NotificationCategories.ChainEvent,
        community_id: chain,
      });
    });

    it('should map a snapshot proposal notification to subscriptions', () => {
      const snapshotSpace = 'test';
      const notification: NotificationDataAndCategory = {
        categoryId: NotificationCategories.SnapshotProposal,
        data: {
          space: snapshotSpace,
          eventType: SnapshotEventType.Created,
        },
      };

      const uniqueSubData = mapNotificationsDataToSubscriptions(notification);
      expect(uniqueSubData).to.deep.equal({
        category_id: NotificationCategories.SnapshotProposal,
        snapshot_id: snapshotSpace,
      });
    });
  });
});
