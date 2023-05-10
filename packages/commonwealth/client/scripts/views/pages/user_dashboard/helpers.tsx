import React from 'react';

import { NotificationCategories } from 'common-common/src/types';
import { notifySuccess } from 'controllers/app/notifications';
import getFetch from 'helpers/getFetch';
import $ from 'jquery';
import type NotificationSubscription from '../../../models/NotificationSubscription';

import app from 'state';
import { DashboardViews } from '.';

// Subscriptions
export const subscribeToThread = async (
  threadId: string,
  bothActive: boolean,
  commentSubscription: NotificationSubscription,
  reactionSubscription: NotificationSubscription
) => {
  const adjustedId = `discussion_${threadId}`;

  if (bothActive) {
    await app.user.notifications.disableSubscriptions([
      commentSubscription,
      reactionSubscription,
    ]);

    notifySuccess('Unsubscribed!');
    return Promise.resolve();
  } else if (!commentSubscription || !reactionSubscription) {
    await Promise.all([
      app.user.notifications.subscribe(
        NotificationCategories.NewReaction,
        adjustedId
      ),
      app.user.notifications.subscribe(
        NotificationCategories.NewComment,
        adjustedId
      ),
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
    activity = await $.post(`${app.serverUrl()}/viewUserActivity`, {
      jwt: app.user.jwt,
    });
  } else if (requestType === DashboardViews.Chain) {
    const events = await getFetch(`${app.serverUrl()}/ce/events`, {
      limit: 50,
      ordered: true,
    });

    if (!Array.isArray(events)) {
      return { status: 'Failure', result: [] };
    }

    const chains: any = new Set();
    for (const event of events) {
      chains.add(event.chain);
    }

    const res: {
      result: { id: string; icon_url: string }[];
      status: boolean;
    } = await $.post(`${app.serverUrl()}/viewChainIcons`, {
      chains: JSON.stringify(Array.from(chains)),
    });

    const chainIconUrls = {};
    for (const item of res.result) {
      chainIconUrls[item.id] = item.icon_url;
    }

    // for (const event of events) {
    //   (<any>events).icon_url = chainIconUrls[event.chain];
    // }

    activity = {
      status: 'Success',
      result: events,
    };
  } else if (requestType === DashboardViews.Global) {
    activity = await $.post(`${app.serverUrl()}/viewGlobalActivity`);
  }
  return activity;
};

export const notificationsRemaining = (contentLength, count) => {
  return contentLength >= 10 && count < contentLength;
};
