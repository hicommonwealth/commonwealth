import type NotificationSubscription from '../../../models/NotificationSubscription';

export const bundleSubs = (
  subs: Array<NotificationSubscription>
): { [k: string]: Array<NotificationSubscription> } => {
  const result = {};
  for (const sub of subs) {
    console.log('SUBS', sub);
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

export const extractSnapshotProposals = (subs) => {
  const snapshotProposals = {};

  for (const sub of subs) {
    if (sub.category === 'snapshot-proposal') {
      console.log('sub', sub);
      if (snapshotProposals[sub.id]) {
        snapshotProposals[sub.id].push(sub);
      } else {
        snapshotProposals[sub.id] = [sub];
      }
    }
  }

  return snapshotProposals;
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
