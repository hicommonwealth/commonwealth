import { config } from '@hicommonwealth/model';

function getBaseUrl(customDomain?: string | null): string {
  if (!customDomain) return config.SERVER_URL;
  else {
    if (customDomain.endsWith('/')) return customDomain.slice(0, -1);
    else return customDomain;
  }
}

export const getCommentUrl = (
  communityId: string,
  threadId: number,
  commentId: number,
  customDomain?: string | null,
): string => {
  return (
    getBaseUrl(customDomain) +
    `/${communityId}/discussion/${threadId}?comment=${commentId}`
  );
};
export const getSnapshotUrl = (
  communityId: string,
  space: string,
  proposalId: string,
  customDomain?: string | null,
): string => {
  return (
    getBaseUrl(customDomain) + `/${communityId}/snapshot/${space}/${proposalId}`
  );
};

export const getThreadUrl = (
  communityId: string,
  threadId: number,
  customDomain?: string | null,
): string => {
  return getBaseUrl(customDomain) + `/${communityId}/discussion/${threadId}`;
};

export const getChainProposalUrl = (
  communityId: string,
  proposalId: string,
  customDomain?: string | null,
) => {
  return getBaseUrl(customDomain) + `/${communityId}/proposal/${proposalId}`;
};
