import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  APIOrderBy,
  APIOrderDirection,
} from 'client/scripts/helpers/constants';
import app from 'state';
import { ApiEndpoints } from '../config';

const SEARCH_PROFILES_STALE_TIME = 60 * 1_000; // 60 s

export type SearchProfilesResponse = {
  results: {
    id: number;
    user_id: string;
    profile_name: string;
    avatar_url: string;
    addresses: {
      id: number;
      chain: string;
      address: string;
    }[];
    roles?: any[];
  }[];
  limit: number;
  page: number;
  totalPages: number;
  totalResults: number;
};

interface SearchProfilesProps {
  chainId: string;
  searchTerm: string;
  limit: number;
  orderBy: APIOrderBy;
  orderDirection: APIOrderDirection;
  includeRoles: boolean;

  enabled?: boolean;
}

const searchProfiles = async ({
  pageParam = 1,
  chainId,
  searchTerm,
  limit,
  orderBy,
  orderDirection,
  includeRoles,
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
        community_id: chainId,
        search: searchTerm,
        limit: limit.toString(),
        page: pageParam.toString(),
        order_by: orderBy,
        order_direction: orderDirection,
        include_roles: includeRoles,
      },
    },
  );
  return result;
};

const useSearchProfilesQuery = ({
  chainId,
  searchTerm,
  limit,
  orderBy,
  orderDirection,
  includeRoles,
  enabled = true,
}: SearchProfilesProps) => {
  const key = [
    ApiEndpoints.searchProfiles(searchTerm),
    {
      chainId,
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
        chainId,
        searchTerm,
        limit,
        orderBy,
        orderDirection,
        includeRoles,
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
      enabled,
    },
  );
};

export default useSearchProfilesQuery;
