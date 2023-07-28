import { NotificationDataAndCategory } from 'types';
import { NotificationCategories } from 'common-common/src/types';
import { factory, formatFilename } from 'common-common/src/logging';
import { SubscriptionAttributes } from '../server/models/subscription';
import models from '../server/database';

const log = factory.getLogger(formatFilename(__filename));

export function mapNotificationsDataToSubscriptions(
  notification: NotificationDataAndCategory
) {
  const uniqueData = { category_id: notification.category };
  if (notification.category === NotificationCategories.ChainEvent) {
    uniqueData['chain_id'] = notification.data.chain;
  } else if (
    notification.category === NotificationCategories.SnapshotProposal
  ) {
    uniqueData['snapshot_id'] = notification.data.space;
  } else if (notification.category === NotificationCategories.NewThread) {
    uniqueData['chain_id'] = notification.data.chain_id;
  } else if (notification.category === NotificationCategories.NewComment) {
    if (
      notification.data.parent_comment_id &&
      notification.data.parent_comment_text
    ) {
      uniqueData['comment_id'] = notification.data.parent_comment_id;
    } else {
      uniqueData['thread_id'] = notification.data.thread_id;
    }
  } else if (notification.category === NotificationCategories.NewReaction) {
    if (notification.data.comment_id) {
      uniqueData['comment_id'] = notification.data.comment_id;
    } else {
      uniqueData['thread_id'] = notification.data.thread_id;
    }
  } else if (notification.category === NotificationCategories.NewMention) {
    uniqueData['subscriber_id'] = notification.data.mentioned_user_id;
  } else if (
    notification.category === NotificationCategories.NewCollaboration
  ) {
    uniqueData['subscriber_id'] = notification.data.collaborator_user_id;
  } else {
    log.info(`${notification.category} does not support subscriptions`);
    return;
  }
  return uniqueData;
}

export async function createSubscription(subData: SubscriptionAttributes) {
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
  } else if (subData.category_id === NotificationCategories.NewComment) {
    if (!subData.thread_id && !subData.comment_id) {
      throw new Error(
        `A thread-level (root) ${subData.category_id} subscription must define a thread_id` +
          ` and a sub-level subscription must define comment_id`
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

  return models.Subscription.create(subData);
}
