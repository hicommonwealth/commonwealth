import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  APIOrderBy,
  APIOrderDirection,
} from 'client/scripts/helpers/constants';
import app from 'state';
import { ReplyResult } from 'views/pages/search/helpers';
import { ApiEndpoints } from '../config';

const SEARCH_COMMENTS_STALE_TIME = 60 * 1_000; // 60 s

export type SearchCommentsResponse = {
  results: ReplyResult[];
  limit: number;
  page: number;
  totalPages: number;
  totalResults: number;
};

interface SearchCommentsProps {
  communityId: string;
  searchTerm: string;
  limit: number;
  orderBy: APIOrderBy;
  orderDirection: APIOrderDirection;
  enabled?: boolean;
}

const searchComments = async ({
  pageParam = 1,
  communityId,
  searchTerm,
  limit,
  orderBy,
  orderDirection,
}: SearchCommentsProps & { pageParam: number }) => {
  const {
    data: { result },
  } = await axios.get<{ result: SearchCommentsResponse }>(
    `${app.serverUrl()}/comments`,
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

const useSearchCommentsQuery = ({
  communityId,
  searchTerm,
  limit,
  orderBy,
  orderDirection,
  enabled = true,
}: SearchCommentsProps) => {
  const key = [
    ApiEndpoints.searchComments(searchTerm),
    {
      communityId,
      orderBy,
      orderDirection,
    },
  ];
  return useInfiniteQuery(
    key,
    ({ pageParam }) =>
      searchComments({
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
      staleTime: SEARCH_COMMENTS_STALE_TIME,
      enabled,
    },
  );
};

export default useSearchCommentsQuery;
