/* eslint-disable import/prefer-default-export */
export const getProposalUrl = (type, proposal, comment?) => {
  const aId = (proposal.community) ? proposal.community : proposal.chain;
  const tId = proposal.type_id || proposal.id;
  const tTitle = proposal.title ? `-${proposal.title}` : '';
  let cId = '';
  if (comment) {
    cId = `?comment=${comment.id}`;
  }
  return (process.env.NODE_ENV === 'production')
    ? `https://commonwealth.im/${aId}/proposal/${type}/${tId}${tTitle.toLowerCase()}${cId}`
    : `http://localhost:8080/${aId}/proposal/${type}/${tId}${tTitle.toLowerCase()}${cId}`;
};

export const getCommunityUrl = (community) => {
  return (process.env.NODE_ENV === 'production')
    ? `https://commonwealth.im/${community}`
    : `http://localhost:8080/${community}`;
};
