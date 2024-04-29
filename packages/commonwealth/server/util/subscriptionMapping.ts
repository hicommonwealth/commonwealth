import { logger } from '@hicommonwealth/logging';
import {
  NotificationCategories,
  NotificationDataAndCategory,
} from '@hicommonwealth/shared';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const log = logger(__filename);

/**
 * This function maps fields from the different notification data objects to Subscription model fields. It returns an
 * object that contains the fields needed to uniquely identify a subscription within a category group. For example, for
 * chain-event notification data it would return { chain_id }. Note that this subscription would not be unique
 * between users i.e. multiple users (different subscriber_ids) could be subscribed to the same chain-event.
 * @param notification
 */
export function mapNotificationsDataToSubscriptions(
  notification: NotificationDataAndCategory,
): Record<string, unknown> {
  const uniqueData = { category_id: notification.categoryId };
  if (notification.categoryId === NotificationCategories.ChainEvent) {
    uniqueData['community_id'] = notification.data.community_id;
  } else if (
    notification.categoryId === NotificationCategories.SnapshotProposal
  ) {
    uniqueData['snapshot_id'] = notification.data.space;
  } else if (notification.categoryId === NotificationCategories.NewThread) {
    uniqueData['community_id'] = notification.data.community_id;
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
