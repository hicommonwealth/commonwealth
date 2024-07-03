import { NotificationCategories } from '@hicommonwealth/shared';
import { notifySuccess } from 'controllers/app/notifications';
import type NotificationSubscription from '../../../models/NotificationSubscription';

import axios from 'axios';
import app from 'state';
import { DashboardViews } from '.';
import { userStore } from 'client/scripts/state/ui/user';

// Subscriptions
export const subscribeToThread = async (
  threadId: string,
  bothActive: boolean,
  commentSubscription: NotificationSubscription,
  reactionSubscription: NotificationSubscription,
) => {
  if (bothActive) {
    await app.user.notifications.disableSubscriptions([
      commentSubscription,
      reactionSubscription,
    ]);

    notifySuccess('Unsubscribed!');
    return Promise.resolve();
  } else if (!commentSubscription || !reactionSubscription) {
    await Promise.all([
      app.user.notifications.subscribe({
        categoryId: NotificationCategories.NewReaction,
        options: { threadId: Number(threadId) },
      }),
      app.user.notifications.subscribe({
        categoryId: NotificationCategories.NewComment,
        options: { threadId: Number(threadId) },
      }),
    ]);

    notifySuccess('Subscribed!');
    return Promise.resolve();
  } else {
    await app.user.notifications.enableSubscriptions([
      commentSubscription,
      reactionSubscription,
    ]);

    notifySuccess('Subscribed!');
    return Promise.resolve();
  }
};

export const fetchActivity = async (requestType: DashboardViews) => {
  let activity;
  if (requestType === DashboardViews.ForYou) {
    const response = await axios.post(`${app.serverUrl()}/viewUserActivity`, {
      jwt: userStore.getState().jwt,
    });

    activity = response.data;
  } else if (requestType === DashboardViews.Global) {
    const response = await axios.post(`${app.serverUrl()}/viewGlobalActivity`);
    activity = response.data;
  }

  return activity;
};
