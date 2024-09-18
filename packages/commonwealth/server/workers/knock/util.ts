import { config } from '@hicommonwealth/model';

function parseCustomDomain(customDomain: string) {
  let parsedDomain = customDomain;
  if (customDomain.endsWith('/')) parsedDomain = parsedDomain.slice(0, -1);
  if (!customDomain.startsWith('https://'))
    parsedDomain = 'https://' + parsedDomain;
  return parsedDomain;
}

function getBaseUrl(customDomain?: string | null): string {
  if (!customDomain) return config.SERVER_URL;
  else return parseCustomDomain(customDomain);
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

export const getProfileUrl = (
  userId: number,
  customDomain?: string | null,
): string => {
  return getBaseUrl(customDomain) + `/profile/id/${userId}`;
};
