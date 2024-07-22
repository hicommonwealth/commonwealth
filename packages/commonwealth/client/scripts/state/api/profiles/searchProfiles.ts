import { CommunityMember } from '@hicommonwealth/schemas';
import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  APIOrderBy,
  APIOrderDirection,
} from 'client/scripts/helpers/constants';
import app from 'state';
import { z } from 'zod';
import { ApiEndpoints } from '../config';

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

const searchProfiles = async ({
  pageParam = 1,
  communityId,
  searchTerm,
  limit,
  orderBy,
  orderDirection,
  includeCount,
}: SearchProfilesProps & { pageParam: number }) => {
  const {
    data: { result },
  } = await axios.get<{ result: SearchProfilesResponse }>(
    `${app.serverUrl()}/profiles`,
    {
      headers: {
        'Content-Type': 'application/json',
      },
      params: {
        community_id: communityId,
        search: searchTerm,
        limit: limit.toString(),
        page: pageParam.toString(),
        order_by: orderBy,
        order_direction: orderDirection,
        include_count: includeCount,
      },
    },
  );
  return result;
};

const useSearchProfilesQuery = ({
  communityId,
  searchTerm,
  limit,
  orderBy,
  orderDirection,
  includeCount,
  enabled = true,
}: SearchProfilesProps) => {
  const key = [
    ApiEndpoints.searchProfiles(searchTerm),
    {
      communityId,
      orderBy,
      orderDirection,
    },
  ];
  return useInfiniteQuery(
    key,
    ({ pageParam }) =>
      searchProfiles({
        pageParam,
        communityId,
        searchTerm,
        limit,
        orderBy,
        orderDirection,
        includeCount,
      }),
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
