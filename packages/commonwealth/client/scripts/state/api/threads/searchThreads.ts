import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  APIOrderBy,
  APIOrderDirection,
} from 'client/scripts/helpers/constants';
import app from 'state';
import { ThreadResult } from 'views/pages/search/helpers';
import { ApiEndpoints } from '../config';

const SEARCH_THREADS_STALE_TIME = 10 * 1_000; // 10 s

export type SearchThreadsResponse = {
  results: ThreadResult[];
  limit: number;
  page: number;
  totalPages: number;
  totalResults: number;
};

interface SearchThreadsProps {
  communityId: string;
  searchTerm: string;
  limit: number;
  orderBy: APIOrderBy;
  orderDirection: APIOrderDirection;
  threadTitleOnly?: boolean;

  enabled?: boolean;
}

const searchThreads = async ({
  pageParam = 1,
  communityId,
  searchTerm,
  limit,
  orderBy,
  orderDirection,
  threadTitleOnly,
}: SearchThreadsProps & {
  pageParam: number;
}): Promise<SearchThreadsResponse> => {
  const {
    data: { result },
  } = await axios.get<{ result: SearchThreadsResponse }>(
    `${app.serverUrl()}/threads`,
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
        thread_title_only: threadTitleOnly,
      },
    },
  );
  return result;
};

const useSearchThreadsQuery = ({
  communityId,
  searchTerm,
  limit,
  orderBy,
  orderDirection,
  threadTitleOnly,
  enabled = true,
}: SearchThreadsProps) => {
  const key = [
    ApiEndpoints.searchThreads(searchTerm),
    {
      communityId,
      orderBy,
      orderDirection,
    },
  ];
  return useInfiniteQuery(
    key,
    ({ pageParam }) =>
      searchThreads({
        pageParam,
        communityId,
        searchTerm,
        limit,
        orderBy,
        orderDirection,
        threadTitleOnly,
      }),
    {
      getNextPageParam: (lastPage) => {
        const nextPageNum = lastPage.page + 1;
        if (nextPageNum <= lastPage.totalPages) {
          return nextPageNum;
        }
        return undefined;
      },
      staleTime: SEARCH_THREADS_STALE_TIME,
      enabled,
    },
  );
};

export default useSearchThreadsQuery;
