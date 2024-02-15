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

export const isGovernorCountingSimple = (contract) =>
  contract.abi.filter((x) => x.name === 'proposalVotes').length > 0;
