// Create 2 functions one for mapping NotificationData to a subscription and
// one for mapping client provided data to local/fetched subscriptions

import { NotificationDataAndCategory } from 'types';
import { NotificationCategories } from 'common-common/src/types';
import { factory, formatFilename } from 'common-common/src/logging';

const log = factory.getLogger(formatFilename(__filename));

export function notificationDataToSubscription(
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
