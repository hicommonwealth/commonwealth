import { CommunityMember } from '@hicommonwealth/schemas';
import {
  APIOrderBy,
  APIOrderDirection,
} from 'client/scripts/helpers/constants';
import { trpc } from 'client/scripts/utils/trpcClient';
import { z } from 'zod';

const SEARCH_PROFILES_STALE_TIME = 60 * 1_000; // 60 s

export type SearchProfilesResponse = {
  results: z.infer<typeof CommunityMember>[];
  limit: number;
  page: number;
  totalPages: number;
  totalResults: number;
};

interface SearchProfilesProps {
  communityId: string;
  searchTerm: string;
  limit: number;
  orderBy?: APIOrderBy;
  orderDirection?: APIOrderDirection;
  includeMembershipTypes?: 'in-group' | `in-group:${string}` | 'not-in-group';
  includeGroupIds?: boolean;
  includeCount?: boolean;
  enabled?: boolean;
}

const useSearchProfilesQuery = ({
  communityId,
  searchTerm,
  limit,
  orderBy,
  orderDirection,
  enabled = true,
}: SearchProfilesProps) => {
  return trpc.user.searchUserProfiles.useInfiniteQuery(
    {
      search: searchTerm,
      community_id: communityId,
      limit,
      order_by: orderBy,
      order_direction: orderDirection,
    },
    {
      getNextPageParam: (lastPage) => {
        const nextPageNum = lastPage.page + 1;
        if (nextPageNum <= lastPage.totalPages) {
          return nextPageNum;
        }
        return undefined;
      },
      staleTime: SEARCH_PROFILES_STALE_TIME,
      enabled: enabled,
    },
  );
};

export default useSearchProfilesQuery;
