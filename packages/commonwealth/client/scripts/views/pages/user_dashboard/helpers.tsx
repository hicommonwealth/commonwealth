import { NotificationCategories } from '@hicommonwealth/core';
import { notifySuccess } from 'controllers/app/notifications';
import getFetch from 'helpers/getFetch';
import type NotificationSubscription from '../../../models/NotificationSubscription';

import axios from 'axios';
import app from 'state';
import { DashboardViews } from '.';

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
      jwt: app.user.jwt,
    });

    activity = response.data;
  } else if (requestType === DashboardViews.Chain) {
    const events = await getFetch(`${app.serverUrl()}/viewChainActivity`);

    if (!Array.isArray(events)) {
      return { status: 'Failure', result: [] };
    }

    const communities: any = new Set();
    for (const event of events) {
      communities.add(event.chain);
    }

    const response = await axios.post(`${app.serverUrl()}/viewChainIcons`, {
      communities: JSON.stringify(Array.from(communities)),
    });

    const communityIconUrls = {};
    for (const item of response.data.result) {
      communityIconUrls[item.id] = item.icon_url;
    }

    activity = {
      status: 'Success',
      result: events,
    };
  } else if (requestType === DashboardViews.Global) {
    const response = await axios.post(`${app.serverUrl()}/viewGlobalActivity`);
    activity = response.data;
  }

  if (activity.result) {
    const uniqueActivity: number[] = [];
    activity.result = activity?.result?.filter(
      (x) =>
        !uniqueActivity.includes(x?.thread_id) &&
        uniqueActivity.push(x?.thread_id),
    );
  }

  return activity;
};
