import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  APIOrderBy,
  APIOrderDirection,
} from 'client/scripts/helpers/constants';
import app from 'state';
import { ApiEndpoints } from '../config';

const SEARCH_COMMUNITIES_STALE_TIME = 2 * 60 * 60 * 1_000; // 2 h

export type SearchCommunitiesResponse = {
  results: {
    id: string;
    name: string;
    default_symbol: string;
    type: string;
    icon_url: string;
    created_at: string | null;
  }[];
  limit: number;
  page: number;
  totalPages: number;
  totalResults: number;
};

interface SearchCommunitiesProps {
  communityId: string;
  searchTerm: string;
  limit: number;
  orderBy: APIOrderBy;
  orderDirection: APIOrderDirection;
  enabled?: boolean;
}

const searchCommunities = async ({
  pageParam = 1,
  communityId,
  searchTerm,
  limit,
  orderBy,
  orderDirection,
}: SearchCommunitiesProps & { pageParam: number }) => {
  const {
    data: { result },
  } = await axios.get<{ result: SearchCommunitiesResponse }>(
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

const useSearchCommunitiesQuery = ({
  communityId,
  searchTerm,
  limit,
  orderBy,
  orderDirection,
  enabled = true,
}: SearchCommunitiesProps) => {
  const key = [
    ApiEndpoints.searchCommunities(searchTerm),
    {
      communityId,
      orderBy,
      orderDirection,
    },
  ];
  return useInfiniteQuery(
    key,
    ({ pageParam }) =>
      searchCommunities({
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
      staleTime: SEARCH_COMMUNITIES_STALE_TIME,
      enabled,
    },
  );
};

export default useSearchCommunitiesQuery;
