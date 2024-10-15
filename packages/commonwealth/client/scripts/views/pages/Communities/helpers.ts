import { pluralize } from 'helpers';
import numeral from 'numeral';
export const getCommunityCountsString = (totalCommunities: number) => {
  const formattedCount =
    totalCommunities >= 1000
      ? numeral(totalCommunities).format('0.0a')
      : totalCommunities;

  return pluralize(formattedCount, 'community');
};
