import { NotificationDataAndCategory } from 'types';
import { NotificationCategories } from 'common-common/src/types';
import { factory, formatFilename } from 'common-common/src/logging';
import NotificationSubscription from 'models/NotificationSubscription';
import { CreationAttributes } from 'sequelize';
import { SubscriptionInstance } from '../models/subscription';

// TODO: @Timothee split this file into a directory with types file per function
const log = factory.getLogger(formatFilename(__filename));

/**
 * This function maps fields from the different notification data objects to Subscription model fields. It returns an
 * object that contains the fields needed to uniquely identify a subscription within a category group. For example, for
 * chain-event notification data it would return { chain_id }. Note that this subscription would not be unique
 * between users i.e. multiple users (different subscriber_ids) could be subscribed to the same chain-event.
 * @param notification
 */
export function mapNotificationsDataToSubscriptions(
  notification: NotificationDataAndCategory
): Record<string, unknown> {
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
    if (notification.data.parent_comment_id) {
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

/**
 * Given the creation attributes of a subscription, this function throws an error if the required values
 * for the associated subscription category id are not present. This function only checks for values that are not
 * already required in the database like subscriber_id. For example, new-comment-creation subscriptions must always
 * define a thread_id or a comment_id but never both.
 * @param values Creation attributes of the Subscription Model
 */
export function checkSubscriptionValues(
  values: CreationAttributes<SubscriptionInstance>
) {
  if (
    values.category_id === NotificationCategories.ChainEvent &&
    !values.chain_id
  ) {
    throw new Error(
      `chain_id cannot be undefined for a ${NotificationCategories.ChainEvent} subscription`
    );
  } else if (
    values.category_id === NotificationCategories.SnapshotProposal &&
    !values.snapshot_id
  ) {
    throw new Error(
      `snapshot_id cannot be undefined for a ${NotificationCategories.SnapshotProposal} subscription`
    );
  } else if (
    values.category_id === NotificationCategories.NewThread &&
    !values.chain_id
  ) {
    throw new Error(
      `chain_id cannot be undefined for a ${NotificationCategories.NewThread} subscription`
    );
  } else if (
    values.category_id === NotificationCategories.NewComment ||
    values.category_id === NotificationCategories.NewReaction
  ) {
    if (!values.chain_id) {
      throw new Error(
        `A ${values.category_id} subscription must define a chain_id`
      );
    } else if (!values.thread_id && !values.comment_id) {
      throw new Error(
        `A thread-level (root) ${values.category_id} subscription must define a thread_id` +
          ` and a sub-level subscription must define a comment_id`
      );
    } else if (values.thread_id && values.comment_id) {
      throw new Error(
        `A ${values.category_id} subscription cannot define` +
          `both a thread_id and a comment_id`
      );
    }
  } else if (
    values.category_id === NotificationCategories.ThreadEdit ||
    values.category_id === NotificationCategories.CommentEdit
  ) {
    throw new Error(`${values.category_id} subscriptions are not supported`);
  }
  // no need to check NewMention + NewCollaboration because subscriber_id is always required anyway
}

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

/**
 * This function searches through a list of NotificationSubscriptions and returns the one that matches the given values.
 * If the minimum required values to uniquely identify a NotificationSubscription are not present, the function logs
 * an error and returns void. For example, in order to find a `new-thread-creation` subscription you must provide a
 * chainId.
 * @param findOptions The data used to find a matching NotificationSubscription.
 * @param subs The list of NotificationSubscriptions.
 */
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
