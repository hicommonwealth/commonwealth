import { NotificationCategories } from '@hicommonwealth/core';
import type NotificationSubscription from '../../../models/NotificationSubscription';

export const bundleSubs = (
  subs: Array<NotificationSubscription>,
): { [k: string]: Array<NotificationSubscription> } => {
  const result = {};
  for (const sub of subs) {
    if (sub.communityId) {
      if (result[sub.communityId]) {
        result[sub.communityId].push(sub);
      } else {
        result[sub.communityId] = [sub];
      }
    }
  }
  return result;
};

export const extractSnapshotProposals = (
  subs: Array<NotificationSubscription>,
) => {
  const snapshotProposals = {};

  for (const sub of subs) {
    if (sub.category === NotificationCategories.SnapshotProposal) {
      if (snapshotProposals[sub.snapshotId]) {
        snapshotProposals[sub.snapshotId].push(sub);
      } else {
        snapshotProposals[sub.snapshotId] = [sub];
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
