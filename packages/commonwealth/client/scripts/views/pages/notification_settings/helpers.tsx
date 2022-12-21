import { NotificationSubscription } from 'models';

export const bundleSubs = (
  subs: Array<NotificationSubscription>
): { [k: string]: Array<NotificationSubscription> } => {
  const result = {};
  for (const sub of subs) {
    if (sub.Chain) {
      if (result[sub.Chain.id]) {
        result[sub.Chain.id].push(sub);
      } else {
        result[sub.Chain.id] = [sub];
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
