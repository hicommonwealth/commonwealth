import type NotificationSubscription from '../../../models/NotificationSubscription';

export const bundleSubs = (
  subs: Array<NotificationSubscription>
): { [k: string]: Array<NotificationSubscription> } => {
  const result = {};
  for (const sub of subs) {
    if (sub.chainId) {
      if (result[sub.chainId]) {
        result[sub.chainId].push(sub);
      } else {
        result[sub.chainId] = [sub];
      }
    }
  }
  return result;
};

export const getNotificationTypeText = (category: string) => {
  if (category === 'new-comment-creation') {
    return 'Comments on';
  } else if (category === 'new-reaction') {
    return 'Reactions to';
  } else {
    return null;
  }
};
