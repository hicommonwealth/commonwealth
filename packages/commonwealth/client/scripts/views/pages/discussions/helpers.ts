import { notifySuccess } from 'controllers/app/notifications';
import moment from 'moment';
import { Dispatch, SetStateAction } from 'react';
import type NotificationSubscription from '../../../models/NotificationSubscription';
import type Thread from '../../../models/Thread';
import { NotificationCategories } from 'common-common/src/types';
import app from 'state';
import { PopoverMenuItem } from '../../components/component_kit/cw_popover/cw_popover_menu';
import { ThreadFeaturedFilterTypes } from '../../../models/types';

export const getLastUpdated = (thread: Thread) => {
  const { lastCommentedOn } = thread;
  const lastComment = lastCommentedOn ? Number(lastCommentedOn.utc()) : 0;
  const createdAt = Number(thread.createdAt.utc());
  const lastUpdate = Math.max(createdAt, lastComment);
  return moment(lastUpdate);
};

export const isHot = (thread: Thread) => {
  return (
    moment.duration(moment().diff(getLastUpdated(thread))).asSeconds() <
    24 * 60 * 60
  );
};

export const getLastUpdate = (thread: Thread): number => {
  const lastComment = thread.lastCommentedOn?.unix() || 0;
  const createdAt = thread.createdAt?.unix() || 0;
  const lastUpdate = Math.max(createdAt, lastComment);
  return lastUpdate;
};

export const onFeaturedDiscussionPage = (p, topic) =>
  decodeURI(p).endsWith(`/discussions/${topic}`);

export const orderDiscussionsbyLastComment = (a, b) => {
  const tsB = Math.max(+b.createdAt, +(b.lastCommentedOn || 0));
  const tsA = Math.max(+a.createdAt, +(a.lastCommentedOn || 0));
  return tsB - tsA;
};

export const handleToggleSubscription = async (
  thread: Thread,
  commentSubscription: NotificationSubscription,
  reactionSubscription: NotificationSubscription,
  isSubscribed: boolean,
  setIsSubscribed?: Dispatch<SetStateAction<boolean>>
) => {
  if (!commentSubscription || !reactionSubscription) {
    await Promise.all([
      app.user.notifications.subscribe({
        categoryId: NotificationCategories.NewReaction,
        options: {
          threadId: thread.id,
        },
      }),
      app.user.notifications.subscribe({
        categoryId: NotificationCategories.NewComment,
        options: {
          threadId: thread.id,
        },
      }),
    ]);
    notifySuccess('Subscribed!');
  } else if (isSubscribed) {
    await app.user.notifications.disableSubscriptions([
      commentSubscription,
      reactionSubscription,
    ]);
    notifySuccess('Unsubscribed!');
  } else {
    await app.user.notifications.enableSubscriptions([
      commentSubscription,
      reactionSubscription,
    ]);
    notifySuccess('Subscribed!');
  }
  if (setIsSubscribed) setIsSubscribed(!isSubscribed);
};

export const getCommentSubscription = (thread: Thread) => {
  return app.user.notifications.findNotificationSubscription({
    categoryId: NotificationCategories.NewComment,
    options: { threadId: thread.id },
  });
};

export const getReactionSubscription = (thread: Thread) => {
  return app.user.notifications.findNotificationSubscription({
    categoryId: NotificationCategories.NewReaction,
    options: { threadId: thread.id },
  });
};

export const getThreadSubScriptionMenuItem = (
  thread: Thread,
  setIsSubscribed: Dispatch<SetStateAction<boolean>>
): PopoverMenuItem => {
  const commentSubscription = getCommentSubscription(thread);
  const reactionSubscription = getReactionSubscription(thread);

  const isSubscribed =
    commentSubscription?.isActive && reactionSubscription?.isActive;

  return {
    onClick: () => {
      handleToggleSubscription(
        thread,
        getCommentSubscription(thread),
        getReactionSubscription(thread),
        isSubscribed,
        setIsSubscribed
      );
    },
    label: isSubscribed ? 'Unsubscribe' : 'Subscribe',
    iconLeft: isSubscribed ? 'unsubscribe' : 'bell',
  };
};

/**
 * This function is responsible for sorting threads in state. Maybe the user pins a
 * thread, this thread is still in a lower position in the state object/arrary. This
 * function will sort those correctly.
 */
export const sortPinned = (t: Thread[]) => {
  return [...t].sort((a, b) => (a.pinned === b.pinned ? 1 : a.pinned ? -1 : 0));
};

/**
 * This function is responsible for sorting threads in state that were earlier
 * sorted by another featured flag
 */
export const sortByFeaturedFilter = (t: Thread[], featuredFilter) => {
  if (featuredFilter === ThreadFeaturedFilterTypes.Oldest) {
    return [...t].sort((a, b) => moment(a.createdAt).diff(moment(b.createdAt)));
  }

  if (featuredFilter === ThreadFeaturedFilterTypes.MostComments) {
    return [...t].sort((a, b) => b.numberOfComments - a.numberOfComments);
  }

  if (featuredFilter === ThreadFeaturedFilterTypes.MostLikes) {
    return [...t].sort(
      (a, b) => b.associatedReactions.length - a.associatedReactions.length
    );
  }

  // Default: Assuming featuredFilter === 'newest'
  return [...t].sort((a, b) => moment(b.createdAt).diff(moment(a.createdAt)));
};
