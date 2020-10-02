/* eslint-disable import/prefer-default-export */
export const getProposalUrl = (type, proposal, comment?) => {
  const aId = (proposal.community) ? proposal.community : proposal.chain;
  const tId = proposal.type_id || proposal.id;
  const tTitle = proposal.title ? `-${proposal.title}` : '';
  const cId = comment ? `?comment=${comment.id}` : '';

  return (process.env.NODE_ENV === 'production')
    ? `https://commonwealth.im/${aId}/proposal/${type}/${tId}${tTitle.toLowerCase()}${cId}`
    : `http://localhost:8080/${aId}/proposal/${type}/${tId}${tTitle.toLowerCase()}${cId}`;
};

export const getProposalUrlWithoutObject = (type, proposalCommunity, proposalId, comment?) => {
  const aId = proposalCommunity;
  const tId = proposalId;
  const cId = comment ? `?comment=${comment.id}` : '';

  return (process.env.NODE_ENV === 'production')
    ? `https://commonwealth.im/${aId}/proposal/${type}/${tId}${cId}`
    : `http://localhost:8080/${aId}/proposal/${type}/${tId}${cId}`;
};

export const getCommunityUrl = (community) => {
  return (process.env.NODE_ENV === 'production')
    ? `https://commonwealth.im/${community}`
    : `http://localhost:8080/${community}`;
};
