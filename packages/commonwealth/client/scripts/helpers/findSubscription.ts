import { NotificationCategories } from '@hicommonwealth/core';
import NotificationSubscription from 'models/NotificationSubscription';

export type SubUniqueData =
  | {
      categoryId:
        | NotificationCategories.ChainEvent
        | NotificationCategories.NewThread;
      options: { communityId: string };
    }
  | {
      categoryId: NotificationCategories.SnapshotProposal;
      options: { snapshotId: string };
    }
  | {
      categoryId:
        | NotificationCategories.NewComment
        | NotificationCategories.NewReaction;
      options:
        | { threadId: number; commentId?: number }
        | { commentId: number; threadId?: number };
    }
  | {
      categoryId:
        | NotificationCategories.NewMention
        | NotificationCategories.NewCollaboration
        | NotificationCategories.ThreadEdit
        | NotificationCategories.CommentEdit;
      options: {};
    };

/**
 * This function searches through a list of NotificationSubscriptions and returns the one that matches the given values.
 * If the minimum required values to uniquely identify a NotificationSubscription are not present, the function logs
 * an error and returns void. For example, in order to find a `new-thread-creation` subscription you must provide a
 * chainId.
 * @param findOptions The data used to find a matching NotificationSubscription.
 * @param subs The list of NotificationSubscriptions.
 */
export function findSubscription(
  findOptions: SubUniqueData,
  subs: NotificationSubscription[],
): NotificationSubscription {
  const categoryId = findOptions.categoryId;
  if (
    categoryId === NotificationCategories.ChainEvent ||
    categoryId === NotificationCategories.NewThread
  ) {
    if (!findOptions.options.communityId) {
      console.error(
        `Must provide the chain id to find a ${categoryId} subscription`,
      );
      return;
    }
    return subs.find(
      (s) =>
        s.categoryId === categoryId &&
        s.communityId === findOptions.options.communityId,
    );
  } else if (
    categoryId === NotificationCategories.NewCollaboration ||
    categoryId === NotificationCategories.NewMention
  ) {
    return subs.find((s) => s.categoryId === categoryId);
  } else if (
    categoryId === NotificationCategories.NewComment ||
    categoryId === NotificationCategories.NewReaction
  ) {
    if (!findOptions.options.threadId && !findOptions.options.commentId) {
      console.error(
        `Must provide a thread id or comment id to find a ${categoryId} subscription`,
      );
      return;
    }

    if (findOptions.options.threadId && findOptions.options.commentId) {
      console.error(
        `Cannot provide both a thread id and comment id to find a ${categoryId} subscription`,
      );
      return;
    }

    return subs.find((s) => {
      if (findOptions.options.threadId) {
        return (
          s.categoryId === categoryId &&
          s.threadId === findOptions.options.threadId
        );
      } else {
        return (
          s.categoryId === categoryId &&
          s.commentId === findOptions.options.commentId
        );
      }
    });
  } else if (categoryId === NotificationCategories.SnapshotProposal) {
    if (!findOptions.options.snapshotId) {
      console.error(
        'Must provide a snapshot space id to find a snapshot-proposal subscription',
      );
      return;
    }
    return subs.find(
      (s) =>
        s.categoryId === categoryId &&
        s.snapshotId === findOptions.options.snapshotId,
    );
  } else {
    console.error('Searching for an unsupported subscription category!');
  }
}
