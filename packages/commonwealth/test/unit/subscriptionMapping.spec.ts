import { NotificationCategories } from 'common-common/src/types';
import {
  checkSubscriptionValues,
  mapNotificationsDataToSubscriptions,
} from '../../server/util/subscriptionMapping';
import chai from 'chai';
import chaiHttp from 'chai-http';
import {
  IBaseForumNotificationData,
  NotificationDataAndCategory,
  SnapshotEventType,
} from 'types';
import { SupportedNetwork } from 'chain-events/src';

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
      chain_id: chain,
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
        chain_id: chain,
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
          queued: 1,
          entity_id: 1,
          network: SupportedNetwork.Aave,
          chain,
        },
      };
      const uniqueSubData = mapNotificationsDataToSubscriptions(notification);
      expect(uniqueSubData).to.deep.equal({
        category_id: NotificationCategories.ChainEvent,
        chain_id: chain,
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

  describe('Tests checkSubscriptionValues', () => {
    it('should throw if chain event subscription values are incorrect', () => {
      let subData: Record<string, unknown> = {
        category_id: NotificationCategories.ChainEvent,
      };
      expect(() => checkSubscriptionValues(subData)).to.throw(
        `chain_id cannot be undefined for a ${NotificationCategories.ChainEvent} subscription`
      );

      subData = {
        category_id: NotificationCategories.ChainEvent,
        chain_id: 'ethereum',
      };
      expect(() => checkSubscriptionValues(subData)).to.not.throw();
    });

    it('should throw if snapshot proposal subscription values are incorrect', () => {
      const subData = {
        category_id: NotificationCategories.SnapshotProposal,
      };
      expect(() => checkSubscriptionValues(subData)).to.throw(
        `snapshot_id cannot be undefined for a ${NotificationCategories.SnapshotProposal} subscription`
      );

      const subData2 = {
        category_id: NotificationCategories.SnapshotProposal,
        snapshot_id: 'test',
      };
      expect(() => checkSubscriptionValues(subData2)).to.not.throw();
    });

    it('should throw if new thread subscription values are incorrect', () => {
      const subData = {
        category_id: NotificationCategories.NewThread,
      };
      expect(() => checkSubscriptionValues(subData)).to.throw(
        `chain_id cannot be undefined for a ${NotificationCategories.NewThread} subscription`
      );

      const subData2 = {
        category_id: NotificationCategories.NewThread,
        chain_id: 'ethereum',
      };
      expect(() => checkSubscriptionValues(subData2)).to.not.throw();
    });

    it('should throw if new comment subscription values are incorrect', () => {
      let subData: any = {
        category_id: NotificationCategories.NewComment,
      };
      expect(() => checkSubscriptionValues(subData)).to.throw(
        `chain_id cannot be undefined for a ${NotificationCategories.NewComment} subscription`
      );

      subData = {
        category_id: NotificationCategories.NewComment,
        chain_id: 'ethereum',
      };
      expect(() => checkSubscriptionValues(subData)).to.throw(
        `A thread-level (root) ${NotificationCategories.NewComment} subscription must define a thread_id` +
          ` and a sub-level subscription must define a comment_id`
      );

      subData = {
        category_id: NotificationCategories.NewComment,
        chain_id: 'ethereum',
        thread_id: 1,
        comment_id: 2,
      };
      expect(() => checkSubscriptionValues(subData)).to.throw(
        `A ${NotificationCategories.NewComment} subscription cannot define` +
          `both a thread_id and a comment_id`
      );

      subData = {
        category_id: NotificationCategories.NewComment,
        chain_id: 'ethereum',
        thread_id: 1,
      };
      expect(() => checkSubscriptionValues(subData)).to.not.throw();

      subData = {
        category_id: NotificationCategories.NewComment,
        chain_id: 'ethereum',
        comment_id: 1,
      };
      expect(() => checkSubscriptionValues(subData)).to.not.throw();
    });

    it('should throw if new reaction subscription values are incorrect', () => {
      let subData: any = {
        category_id: NotificationCategories.NewReaction,
      };
      expect(() => checkSubscriptionValues(subData)).to.throw(
        `chain_id cannot be undefined for a ${NotificationCategories.NewReaction} subscription`
      );

      subData = {
        category_id: NotificationCategories.NewReaction,
        chain_id: 'ethereum',
      };
      expect(() => checkSubscriptionValues(subData)).to.throw(
        `A thread-level (root) ${NotificationCategories.NewReaction} subscription must define a thread_id` +
          ` and a sub-level subscription must define a comment_id`
      );

      subData = {
        category_id: NotificationCategories.NewReaction,
        chain_id: 'ethereum',
        thread_id: 1,
        comment_id: 2,
      };
      expect(() => checkSubscriptionValues(subData)).to.throw(
        `A ${NotificationCategories.NewReaction} subscription cannot define` +
          `both a thread_id and a comment_id`
      );

      subData = {
        category_id: NotificationCategories.NewReaction,
        chain_id: 'ethereum',
        thread_id: 1,
      };
      expect(() => checkSubscriptionValues(subData)).to.not.throw();

      subData = {
        category_id: NotificationCategories.NewReaction,
        chain_id: 'ethereum',
        comment_id: 1,
      };
      expect(() => checkSubscriptionValues(subData)).to.not.throw();
    });

    it('should not throw for new collaboration subscription values', () => {
      const subData = {
        category_id: NotificationCategories.NewCollaboration,
      };
      expect(() => checkSubscriptionValues(subData)).to.not.throw();
    });

    it('should not throw for new mention subscription values', () => {
      const subData = {
        category_id: NotificationCategories.NewMention,
      };
      expect(() => checkSubscriptionValues(subData)).to.not.throw();
    });

    it('should throw for thread edit subscription values', () => {
      const subData = {
        category_id: NotificationCategories.ThreadEdit,
      };
      expect(() => checkSubscriptionValues(subData)).to.throw(
        `${NotificationCategories.ThreadEdit} subscriptions are not supported`
      );
    });

    it('should throw for comment edit subscription values', () => {
      const subData = {
        category_id: NotificationCategories.CommentEdit,
      };
      expect(() => checkSubscriptionValues(subData)).to.throw(
        `${NotificationCategories.CommentEdit} subscriptions are not supported`
      );
    });

    it('should throw for any unrecognized notification category', () => {
      const notifCategory = 'random';
      const subData = {
        category_id: notifCategory,
      };
      expect(() => checkSubscriptionValues(subData)).to.throw(
        `${notifCategory} subscriptions are not supported`
      );
    });
  });
});
