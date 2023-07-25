// Create 2 functions one for mapping NotificationData to a subscription and
// one for mapping client provided data to local/fetched subscriptions

import { NotificationDataAndCategory } from 'types';
import { NotificationCategories } from 'common-common/src/types';

export function notifDataToSubscription(
  notification: NotificationDataAndCategory
) {
  if (notification.category === NotificationCategories.NewComment) {
    // data is now inferred to be IForumNotificationData
    console.log(notification.data.view_count); // This should work now
  }
}
