import numeral from 'numeral';

export const getCommunityCountsString = (totalCommunities: number) => {
  return `${
    totalCommunities >= 1000
      ? numeral(totalCommunities).format('0.0a')
      : totalCommunities
  } ${totalCommunities === 1 ? 'community' : 'communities'}`;
};
