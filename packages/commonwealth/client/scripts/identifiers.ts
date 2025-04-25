import { ProposalType } from '@hicommonwealth/shared';
import { fetchCachedCustomDomain } from 'state/api/configuration';
import app from './state';

// returns a URL path to a proposal based on its type and id, taking into account
// custom domain prefixes as well.
export const getProposalUrlPath = (
  type: ProposalType,
  id: number | string,
  omitActiveId = true,
  chainId?: string,
): string => {
  let basePath: string;
  if (type === ProposalType.Thread) {
    basePath = `/discussion/${id}`;
  } else {
    basePath = `/proposal-details/${id}?type=cosmos`;
  }

  const { isCustomDomain } = fetchCachedCustomDomain() || {};

  if (omitActiveId || (isCustomDomain && !chainId)) {
    return basePath;
  } else {
    return `/${chainId || app.activeChainId()}${basePath}`;
  }
};
