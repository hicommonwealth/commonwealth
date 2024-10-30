import { BigNumber } from 'ethers';
import moment from 'moment';
import type Thread from '../../../models/Thread';
import { ThreadFeaturedFilterTypes } from '../../../models/types';

export const getLastUpdated = (thread: Thread) => {
  if (!thread) return;

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

/**
 * This function is responsible for sorting threads in state. Maybe the user pins a
 * thread, this thread is still in a lower position in the state object/arrary. This
 * function will sort those correctly.
 */
export const sortPinned = (t: Thread[]) => {
  return [...t].sort((a, b) => {
    if (a.pinned === b.pinned) return 0; // return 0 when they are equal
    return a.pinned ? -1 : 1; // sort based on the pinned status
  });
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
    return [...t].sort((a, b) => {
      const aWeight = BigNumber.from(a.reactionWeightsSum);
      const bWeight = BigNumber.from(b.reactionWeightsSum);

      if (aWeight.lt(bWeight)) {
        return 1;
      } else if (aWeight.gt(bWeight)) {
        return -1;
      } else {
        return 0;
      }
    });
  }

  if (featuredFilter === ThreadFeaturedFilterTypes.LatestActivity) {
    return [...t].sort((a, b) =>
      moment(b.latestActivity).diff(moment(a.latestActivity)),
    );
  }

  // Default: Assuming featuredFilter === 'newest'
  return [...t].sort((a, b) => moment(b.createdAt).diff(moment(a.createdAt)));
};
