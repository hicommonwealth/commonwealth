export const getCommentUrl = (
  communityId: string,
  threadId: number,
  commentId: number,
): string => {
  return `/${communityId}/discussion/${threadId}?comment=${commentId}`;
};

export const getThreadUrl = (communityId: string, threadId: number): string => {
  return `/${communityId}/discussion/${threadId}`;
};
