import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  APIOrderBy,
  APIOrderDirection,
} from 'client/scripts/helpers/constants';
import { MemberResult } from 'client/scripts/views/pages/search/helpers';
import app from 'state';
import { ApiEndpoints } from '../config';

const SEARCH_PROFILES_STALE_TIME = 60 * 1_000; // 60 s

export type SearchProfilesResponse = {
  results: MemberResult[];
  limit: number;
  page: number;
  totalPages: number;
  totalResults: number;
};

interface SearchProfilesProps {
  communityId: string;
  searchTerm: string;
  limit: number;
  orderBy: APIOrderBy;
  orderDirection: APIOrderDirection;
  includeRoles: boolean;
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
  includeRoles,
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
        include_roles: includeRoles,
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
  includeRoles,
  includeCount,
  enabled = true,
}: SearchProfilesProps) => {
  const key = [
    ApiEndpoints.searchProfiles(searchTerm),
    {
      communityId,
      orderBy,
      orderDirection,
      includeRoles,
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
        includeRoles,
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
      enabled: enabled && searchTerm.length >= 3,
    },
  );
};

export default useSearchProfilesQuery;
