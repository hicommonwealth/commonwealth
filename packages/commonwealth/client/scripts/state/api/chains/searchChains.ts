import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  APIOrderBy,
  APIOrderDirection,
} from 'client/scripts/helpers/constants';
import { CommunityResult } from 'client/scripts/views/pages/search/helpers';
import app from 'state';
import { ApiEndpoints } from '../config';

const SEARCH_CHAINS_STALE_TIME = 2 * 60 * 60 * 1_000; // 2 h

export type SearchChainsResponse = {
  results: CommunityResult[];
  limit: number;
  page: number;
  totalPages: number;
  totalResults: number;
};

interface SearchChainsProps {
  communityId: string;
  searchTerm: string;
  limit: number;
  orderBy: APIOrderBy;
  orderDirection: APIOrderDirection;
  enabled?: boolean;
}

const searchChains = async ({
  pageParam = 1,
  communityId,
  searchTerm,
  limit,
  orderBy,
  orderDirection,
}: SearchChainsProps & { pageParam: number }) => {
  const {
    data: { result },
  } = await axios.get<{ result: SearchChainsResponse }>(
    `${app.serverUrl()}/communities`,
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
      },
    },
  );
  return result;
};

const useSearchChainsQuery = ({
  communityId,
  searchTerm,
  limit,
  orderBy,
  orderDirection,
  enabled = true,
}: SearchChainsProps) => {
  const key = [
    ApiEndpoints.searchChains(searchTerm),
    {
      communityId,
      orderBy,
      orderDirection,
    },
  ];
  return useInfiniteQuery(
    key,
    ({ pageParam }) =>
      searchChains({
        pageParam,
        communityId,
        searchTerm,
        limit,
        orderBy,
        orderDirection,
      }),
    {
      getNextPageParam: (lastPage) => {
        const nextPageNum = lastPage.page + 1;
        if (nextPageNum <= lastPage.totalPages) {
          return nextPageNum;
        }
        return undefined;
      },
      staleTime: SEARCH_CHAINS_STALE_TIME,
      enabled,
    },
  );
};

export default useSearchChainsQuery;
