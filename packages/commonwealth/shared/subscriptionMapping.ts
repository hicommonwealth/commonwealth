import { NotificationDataAndCategory } from 'types';
import {
  NotificationCategories,
  NotificationCategory,
} from 'common-common/src/types';
import { factory, formatFilename } from 'common-common/src/logging';
import { SubscriptionAttributes } from '../server/models/subscription';
import models from '../server/database';
import { Transaction } from 'sequelize';
import NotificationSubscription from 'models/NotificationSubscription';

const log = factory.getLogger(formatFilename(__filename));

export function mapNotificationsDataToSubscriptions(
  notification: NotificationDataAndCategory
) {
  const uniqueData = { category_id: notification.categoryId };
  if (notification.categoryId === NotificationCategories.ChainEvent) {
    uniqueData['chain_id'] = notification.data.chain;
  } else if (
    notification.categoryId === NotificationCategories.SnapshotProposal
  ) {
    uniqueData['snapshot_id'] = notification.data.space;
  } else if (notification.categoryId === NotificationCategories.NewThread) {
    uniqueData['chain_id'] = notification.data.chain_id;
  } else if (notification.categoryId === NotificationCategories.NewComment) {
    if (
      notification.data.parent_comment_id &&
      notification.data.parent_comment_text
    ) {
      uniqueData['comment_id'] = notification.data.parent_comment_id;
    } else {
      uniqueData['thread_id'] = notification.data.thread_id;
    }
  } else if (notification.categoryId === NotificationCategories.NewReaction) {
    if (notification.data.comment_id) {
      uniqueData['comment_id'] = notification.data.comment_id;
    } else {
      uniqueData['thread_id'] = notification.data.thread_id;
    }
  } else if (notification.categoryId === NotificationCategories.NewMention) {
    uniqueData['subscriber_id'] = notification.data.mentioned_user_id;
  } else if (
    notification.categoryId === NotificationCategories.NewCollaboration
  ) {
    uniqueData['subscriber_id'] = notification.data.collaborator_user_id;
  } else {
    log.info(`${notification.categoryId} does not support subscriptions`);
    return;
  }
  return uniqueData;
}

export async function createSubscription(
  subData: SubscriptionAttributes,
  options?: { transaction: Transaction }
) {
  if (
    subData.category_id === NotificationCategories.ChainEvent &&
    !subData.chain_id
  ) {
    throw new Error(
      `chain_id cannot be undefined for a ${NotificationCategories.ChainEvent} subscription`
    );
  } else if (
    subData.category_id === NotificationCategories.SnapshotProposal &&
    !subData.snapshot_id
  ) {
    throw new Error(
      `snapshot_id cannot be undefined for a ${NotificationCategories.SnapshotProposal} subscription`
    );
  } else if (
    subData.category_id === NotificationCategories.NewThread &&
    !subData.chain_id
  ) {
    throw new Error(
      `chain_id cannot be undefined for a ${NotificationCategories.NewThread} subscription`
    );
  } else if (
    subData.category_id === NotificationCategories.NewComment ||
    subData.category_id === NotificationCategories.NewReaction
  ) {
    if (!subData.chain_id) {
      throw new Error(
        `A ${subData.category_id} subscription must define a chain_id`
      );
    } else if (!subData.thread_id && !subData.comment_id) {
      throw new Error(
        `A thread-level (root) ${subData.category_id} subscription must define a thread_id` +
          ` and a sub-level subscription must define a comment_id`
      );
    } else if (subData.thread_id && subData.comment_id) {
      throw new Error(
        `A ${subData.category_id} subscription cannot define` +
          `both a thread_id and a comment_id`
      );
    }
  } else if (
    subData.category_id === NotificationCategories.ThreadEdit ||
    subData.category_id === NotificationCategories.CommentEdit
  ) {
    throw new Error(`${subData.category_id} subscriptions are not supported`);
  }
  // no need to check NewMention + NewCollaboration because subscriber_id is always required anyway

  console.log('\n\n>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', subData, options);
  return models.Subscription.create(subData, options);
}

// export type NewCommentSubUniqueData = { commentId: number; threadId?: number } | { commentId?: number; threadId: number }
// export type NewReactionSubUniqueData = { commentId: number; threadId?: number } | { commentId?: number; threadId: number }
// export type NewThreadSubUniqueData = { chainId: string }
// export type ChainEventSubUniqueData = { chainId: string }
// export type SnapshotSubUniqueData = { snapshotId: string }
//
// export type NotifCategoryToSubUniqueData = {
//   [K in NotificationCategory]: K extends typeof NotificationCategories.NewComment
//     ? NewCommentSubUniqueData
//     : K extends typeof NotificationCategories.NewReaction
//       ? NewReactionSubUniqueData
//       : K extends  typeof NotificationCategories.NewThread
//         ? NewThreadSubUniqueData
//         : K extends typeof NotificationCategories.ChainEvent
//           ? ChainEventSubUniqueData
//           : K extends typeof NotificationCategories.SnapshotProposal
//             ? SnapshotSubUniqueData
//             : never;
// }
//
// export type SubUniqueData = {
//   [K in NotificationCategory]: {
//     categoryId: K;
//     options: NotifCategoryToSubUniqueData[K]
//   }
// }[NotificationCategory];

export type SubUniqueData =
  | {
      categoryId:
        | NotificationCategories.ChainEvent
        | NotificationCategories.NewThread;
      options: { chainId: string };
    }
  | {
      categoryId: NotificationCategories.SnapshotProposal;
      options: { snapshotId: string };
    }
  | {
      categoryId:
        | NotificationCategories.NewComment
        | NotificationCategories.NewReaction;
      options:
        | { threadId: number; commentId?: number }
        | { commentId: number; threadId?: number };
    }
  | {
      categoryId:
        | NotificationCategories.NewMention
        | NotificationCategories.NewCollaboration
        | NotificationCategories.ThreadEdit
        | NotificationCategories.CommentEdit;
      options: {};
    };

export function findSubscription(
  findOptions: SubUniqueData,
  subs: NotificationSubscription[]
): NotificationSubscription {
  const categoryId = findOptions.categoryId;
  if (
    categoryId === NotificationCategories.ChainEvent ||
    categoryId === NotificationCategories.NewThread
  ) {
    if (!findOptions.options.chainId) {
      console.error(
        `Must provide the chain id to find a ${categoryId} subscription`
      );
      return;
    }
    return subs.find(
      (s) =>
        s.categoryId === categoryId && s.chainId === findOptions.options.chainId
    );
  } else if (
    categoryId === NotificationCategories.NewCollaboration ||
    categoryId === NotificationCategories.NewMention
  ) {
    return subs.find((s) => s.categoryId === categoryId);
  } else if (
    categoryId === NotificationCategories.NewComment ||
    categoryId === NotificationCategories.NewReaction
  ) {
    if (!findOptions.options.threadId && !findOptions.options.commentId) {
      console.error(
        `Must provide a thread id or comment id to find a ${categoryId} subscription`
      );
      return;
    }
    return subs.find((s) => {
      if (findOptions.options.threadId) {
        return (
          s.categoryId === categoryId &&
          s.threadId === findOptions.options.threadId
        );
      } else {
        return (
          s.categoryId === categoryId &&
          s.commentId === findOptions.options.commentId
        );
      }
    });
  } else if (categoryId === NotificationCategories.SnapshotProposal) {
    if (!findOptions.options.snapshotId) {
      console.error(
        'Must provide a snapshot space id to find a snapshot-proposal subscription'
      );
      return;
    }
    return subs.find(
      (s) =>
        s.categoryId === categoryId &&
        s.snapshotId === findOptions.options.snapshotId
    );
  } else {
    console.error('Searching for an unsupported subscription category!');
  }
}
