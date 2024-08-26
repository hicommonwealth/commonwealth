import { ProposalType } from '@hicommonwealth/shared';
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
    basePath = `/proposal/${id}`;
  }
  if (omitActiveId || (app.isCustomDomain() && !chainId)) {
    return basePath;
  } else {
    return `/${chainId || app.activeChainId()}${basePath}`;
  }
};
