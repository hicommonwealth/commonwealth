/* eslint-disable import/prefer-default-export */
export const createCommonwealthUrl = (thread, comment?) => {
  const aId = (thread.community) ? thread.community : thread.chain;
  const tId = thread.id;
  const tTitle = thread.title;
  let cId = '';
  if (comment) {
    cId = `?comment=${comment.id}`;
  }
  return (process.env.NODE_ENV === 'production')
    ? `https://commonwealth.im/${aId}/proposal/discussion/${tId}-${tTitle.toLowerCase()}${cId}`
    : `http://localhost:8080/${aId}/proposal/discussion/${tId}-${tTitle.toLowerCase()}${cId}`;
};
