import { SERVER_URL } from '../../config';

export const getCommentUrl = (
  communityId: string,
  threadId: number,
  commentId: number,
): string => {
  return (
    SERVER_URL + `/${communityId}/discussion/${threadId}?comment=${commentId}`
  );
};
export const getSnapshotUrl = (
  communityId: string,
  space: string,
  proposalId: string,
): string => {
  return SERVER_URL + `/${communityId}/snapshot/${space}/${proposalId}`;
};

export const getThreadUrl = (communityId: string, threadId: number): string => {
  return SERVER_URL + `/${communityId}/discussion/${threadId}`;
};

export const getChainProposalUrl = (
  communityId: string,
  proposalId: string,
) => {
  return SERVER_URL + `/${communityId}/proposal/${proposalId}`;
};
