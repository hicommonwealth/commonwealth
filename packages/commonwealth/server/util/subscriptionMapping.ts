import { NotificationDataAndCategory } from 'types';
import { NotificationCategories } from 'common-common/src/types';
import { factory, formatFilename } from 'common-common/src/logging';
import { CreationAttributes } from 'sequelize';
import { SubscriptionInstance } from '../models/subscription';

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

export function supportedSubscriptionCategories(): string[] {
  return [
    NotificationCategories.NewMention,
    NotificationCategories.NewCollaboration,
    NotificationCategories.NewThread,
    NotificationCategories.NewComment,
    NotificationCategories.NewReaction,
    NotificationCategories.ChainEvent,
    NotificationCategories.SnapshotProposal,
  ];
}

/**
 * Given the creation attributes of a subscription, this function throws an error if the required values
 * for the associated subscription category id are not present. This function only checks for values that are not
 * already required in the database like subscriber_id. For example, new-comment-creation subscriptions must always
 * define a thread_id or a comment_id but never both. This function is an application layer value checker that mimics
 * the database level checks created in the rm-object-id migration. The benefit of this function is that returns
 * readable errors rather than sequelize errors that only state the constraint name.
 * @param values Creation attributes of the Subscription Model
 */
export function checkSubscriptionValues(
  values: CreationAttributes<SubscriptionInstance>
) {
  if (!supportedSubscriptionCategories().includes(values.category_id)) {
    // this means we don't support new notification category subscriptions by default
    throw new Error(`${values.category_id} subscriptions are not supported`);
  }

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
        `chain_id cannot be undefined for a ${values.category_id} subscription`
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
  }
}
