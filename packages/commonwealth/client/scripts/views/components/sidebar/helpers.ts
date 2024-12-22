import _ from 'lodash';

import { FeedItem } from '@knocklabs/client';
import app from 'state';
import { Contest } from 'views/pages/CommunityManagement/Contests/ContestsList';
import { isContestActive } from 'views/pages/CommunityManagement/Contests/utils';
import type { ToggleTree } from './types';

function comparisonCustomizer(value1, value2) {
  if (typeof value1 === 'boolean' && typeof value2 === 'boolean') {
    return true;
  }
}

// Check that our current cached tree is structurally correct
export function verifyCachedToggleTree(
  treeName: string,
  toggleTree: ToggleTree,
) {
  const cachedTree = JSON.parse(
    localStorage[`${app.activeChainId()}-${treeName}-toggle-tree`],
  );
  return _.isEqualWith(cachedTree, toggleTree, comparisonCustomizer);
}

export const getUniqueTopicIdsIncludedInActiveContest = (
  contestData: Contest[],
) => {
  if (!contestData) {
    return [];
  }

  const topicIds = contestData.reduce((acc, contest) => {
    const isActive = isContestActive({ contest });

    if (!isActive) {
      return acc;
    }

    return [...acc, ...(contest?.topics || []).map((t) => t.id)];
  }, []);

  return [...new Set(topicIds)];
};

export const calculateUnreadCount = (
  communityName: string,
  items: FeedItem[],
) =>
  items.filter(
    (item) => !item.read_at && item?.data?.community_name === communityName,
  ).length;
