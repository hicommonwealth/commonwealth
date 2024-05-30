import _ from 'lodash';

import app from 'state';
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

export const getUniqueTopicIdsIncludedInContest = (
  contestData: {
    topics?: { id?: number }[];
  }[],
) => {
  if (!contestData) {
    return [];
  }

  const topicIds = contestData.reduce((acc, curr) => {
    return [...acc, ...(curr.topics || []).map((t) => t.id)];
  }, []);

  return [...new Set(topicIds)];
};
