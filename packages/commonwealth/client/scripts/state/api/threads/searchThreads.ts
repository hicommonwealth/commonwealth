import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import { APIOrderBy, APIOrderDirection } from 'helpers/constants';
import { ThreadResult } from 'views/pages/search/helpers';
import { ApiEndpoints, SERVER_URL } from '../config';

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
  includeCount?: boolean;

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
  includeCount,
}: SearchThreadsProps & {
  pageParam: number;
}): Promise<SearchThreadsResponse> => {
  const {
    data: { result },
  } = await axios.get<{ result: SearchThreadsResponse }>(
    `${SERVER_URL}/threads`,
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
        include_count: includeCount,
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
  includeCount,
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
      staleTime: SEARCH_THREADS_STALE_TIME,
      enabled,
    },
  );
};

export default useSearchThreadsQuery;
