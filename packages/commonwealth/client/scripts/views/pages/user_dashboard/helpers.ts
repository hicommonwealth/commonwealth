/* @jsx m */

import m from 'mithril';
import $ from 'jquery';

import app from 'state';
import { NotificationCategories } from 'common-common/src/types';
import { NotificationSubscription } from 'models';
import { QuillFormattedText } from 'views/components/quill/quill_formatted_text';
import { MarkdownFormattedText } from 'views/components/quill/markdown_formatted_text';
import { notifySuccess } from 'controllers/app/notifications';
import { DashboardViews } from '.';

export const getCommentPreview = (commentText) => {
  // TODO Graham 6-5-22: Duplicate with notification_row.ts? See relevant note there
  let decodedCommentText;

  try {
    const doc = JSON.parse(decodeURIComponent(commentText));
    if (!doc.ops) throw new Error();
    decodedCommentText = m(QuillFormattedText, {
      doc,
      hideFormatting: true,
      collapse: false,
    });
  } catch (e) {
    let doc = decodeURIComponent(commentText);
    const regexp = RegExp('\\[(\\@.+?)\\]\\(.+?\\)', 'g');
    const matches = doc['matchAll'](regexp);
    Array.from(matches).forEach((match) => {
      doc = doc.replace(match[0], match[1]);
    });
    decodedCommentText = m(MarkdownFormattedText, {
      doc: doc.slice(0, 140),
      hideFormatting: true,
      collapse: true,
    });
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
    await app.user.notifications.disableSubscriptions([
      commentSubscription,
      reactionSubscription,
    ]);

    notifySuccess('Unsubscribed!');
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
  } else {
    await app.user.notifications.enableSubscriptions([
      commentSubscription,
      reactionSubscription,
    ]);

    notifySuccess('Subscribed!');
  }
};

export const fetchActivity = async (requestType: DashboardViews) => {
  let activity;
  if (requestType === DashboardViews.ForYou) {
    activity = await $.post(`${app.serverUrl()}/viewUserActivity`, {
      jwt: app.user.jwt,
    });
  } else if (requestType === DashboardViews.Chain) {
    activity = await $.post(`${app.serverUrl()}/viewChainActivity`);
  } else if (requestType === DashboardViews.Global) {
    activity = await $.post(`${app.serverUrl()}/viewGlobalActivity`);
  }
  return activity;
};

export const notificationsRemaining = (contentLength, count) => {
  return contentLength >= 10 && count < contentLength;
};
