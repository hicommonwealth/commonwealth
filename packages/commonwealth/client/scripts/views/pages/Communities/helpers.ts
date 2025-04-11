import { ExtendedCommunity } from '@hicommonwealth/schemas';
import { pluralize } from 'helpers';
import numeral from 'numeral';
import { z } from 'zod';

type ExtendedCommunityType = z.infer<typeof ExtendedCommunity>;

// Helper function to get the string for community counts
export const getCommunityCountsString = (totalCommunities: number) => {
  const formattedCount =
    totalCommunities >= 1000
      ? numeral(totalCommunities).format('0.0a')
      : totalCommunities;

  return pluralize(formattedCount, 'community');
};

// Helper function to filter communities based on search value
export const filterCommunities = (
  communities: ExtendedCommunityType[],
  searchValue: string,
): ExtendedCommunityType[] => {
  if (!searchValue) {
    return communities;
  }
  const lowerCaseSearch = searchValue.toLowerCase();
  return communities.filter(
    (community) =>
      community.name?.toLowerCase().includes(lowerCaseSearch) ||
      community.id?.toLowerCase().includes(lowerCaseSearch),
  );
};

// Helper function to handle null customScrollParent - use proper type assertion
export const safeScrollParent = (
  element: HTMLElement | null | undefined,
): HTMLElement | undefined => {
  if (element === null || element === undefined) {
    return undefined;
  }
  return element;
};
