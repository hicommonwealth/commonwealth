import { config } from '@hicommonwealth/model';

export const getCommentUrl = (
  communityId: string,
  threadId: number,
  commentId: number,
): string => {
  return `/${communityId}/discussion/${threadId}?comment=${commentId}`;
};
export const getSnapshotUrl = (
  communityId: string,
  space: string,
  proposalId: string,
): string => {
  return config.SERVER_URL + `/${communityId}/snapshot/${space}/${proposalId}`;
};
