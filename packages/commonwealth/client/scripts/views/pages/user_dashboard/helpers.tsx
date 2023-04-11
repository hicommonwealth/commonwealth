import React from 'react';

import { NotificationCategories } from 'common-common/src/types';
import { notifySuccess } from 'controllers/app/notifications';
import getFetch from 'helpers/getFetch';
import $ from 'jquery';
import type { NotificationSubscription } from 'models';

import app from 'state';
import { DashboardViews } from '.';
import { QuillFormattedText } from '../../components/react_quill_editor/quill_formatted_text';
import { MarkdownFormattedText } from '../../components/react_quill_editor/markdown_formatted_text';

export const getCommentPreview = (commentText) => {
  // TODO Graham 6-5-22: Duplicate with notification_row.ts? See relevant note there
  let decodedCommentText;

  try {
    const doc = JSON.parse(decodeURIComponent(commentText));

    if (!doc.ops) throw new Error();

    decodedCommentText = <QuillFormattedText doc={doc} />;
  } catch (e) {
    let doc = decodeURIComponent(commentText);

    const regexp = RegExp('\\[(\\@.+?)\\]\\(.+?\\)', 'g');

    const matches = doc['matchAll'](regexp);

    Array.from(matches).forEach((match) => {
      doc = doc.replace(match[0], match[1]);
    });

    decodedCommentText = <MarkdownFormattedText doc={doc.slice(0, 140)} />;
  }

  return decodedCommentText;
};

// Subscriptions
export const subscribeToThread = async (
  threadId: string,
  bothActive: boolean,
  commentSubscription: NotificationSubscription,
  reactionSubscription: NotificationSubscription
) => {
  const adjustedId = `discussion_${threadId}`;

  if (bothActive) {
    await app.user.notifications.disableSubscriptions([commentSubscription, reactionSubscription]);

    notifySuccess('Unsubscribed!');
    return Promise.resolve();
  } else if (!commentSubscription || !reactionSubscription) {
    await Promise.all([
      app.user.notifications.subscribe(NotificationCategories.NewReaction, adjustedId),
      app.user.notifications.subscribe(NotificationCategories.NewComment, adjustedId)
    ]);

    notifySuccess('Subscribed!');
    return Promise.resolve();
  } else {
    await app.user.notifications.enableSubscriptions([commentSubscription, reactionSubscription]);

    notifySuccess('Subscribed!');
    return Promise.resolve();
  }
};

export const fetchActivity = async (requestType: DashboardViews) => {
  let activity;
  if (requestType === DashboardViews.ForYou) {
    activity = await $.post(`${app.serverUrl()}/viewUserActivity`, {
      jwt: app.user.jwt
    });
  } else if (requestType === DashboardViews.Chain) {
    const events = await getFetch(`${app.serverUrl()}/ce/events`, {
      limit: 50,
      ordered: true
    });

    if (!Array.isArray(events)) {
      return { status: 'Failure', result: [] };
    }

    const chains: any = new Set();
    for (const event of events) {
      chains.add(event.chain);
    }

    const res: { result: { id: string; icon_url: string }[]; status: boolean } = await $.post(
      `${app.serverUrl()}/viewChainIcons`,
      {
        chains: JSON.stringify(Array.from(chains))
      }
    );

    const chainIconUrls = {};
    for (const item of res.result) {
      chainIconUrls[item.id] = item.icon_url;
    }

    // for (const event of events) {
    //   (<any>events).icon_url = chainIconUrls[event.chain];
    // }

    activity = {
      status: 'Success',
      result: events
    };
  } else if (requestType === DashboardViews.Global) {
    activity = await $.post(`${app.serverUrl()}/viewGlobalActivity`);
  }
  return activity;
};

export const notificationsRemaining = (contentLength, count) => {
  return contentLength >= 10 && count < contentLength;
};
