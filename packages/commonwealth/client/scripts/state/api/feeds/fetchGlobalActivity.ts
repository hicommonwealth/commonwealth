import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import Thread from 'models/Thread';
import { ApiEndpoints, SERVER_URL } from 'state/api/config';
import { formatActivityResponse } from './util';

const USER_ACTIVITY_STALE_TIME = 5 * 60 * 1_000; // 5 minutes (backend caches for 5 minutes as well)
const USER_ACTIVITY_CACHE_TIME = 5 * 60 * 1_000; // 5 minutes

interface CommonProps {
  apiEnabled?: boolean;
}

interface FetchGlobalActivityProps extends CommonProps {
  page: number;
  limit?: number;
  ApiEndpoints?: string;
}

const getFetchThreadsQueryKey = (props) => {
  const keys = [ApiEndpoints.FETCH_USER_ACTIVITY, props.limit];

  return keys;
};

const fetchGlobalActivity = async (
  { pageParam = 1 }: { pageParam?: number }, // default to page 1 if undefined
  props: FetchGlobalActivityProps,
): Promise<{
  data: { threads: Thread[] };
  pageParam: number | undefined;
}> => {
  const { limit, ApiEndpoints: url = ApiEndpoints.FETCH_GLOBAL_ACTIVITY } =
    props;

  const response = await axios.post(`${SERVER_URL}${url}`, {
    page: pageParam, // Use pageParam for pagination
    limit,
  });

  const data = formatActivityResponse(response);
  return {
    data: {
      threads: data,
    },
    pageParam: data.length > 0 ? pageParam + 1 : undefined,
  };
};

const useFetchGlobalActivityQuery = (props: FetchGlobalActivityProps) => {
  const { data, fetchNextPage, hasNextPage, isFetching, isLoading, isError } =
    useInfiniteQuery({
      queryKey: getFetchThreadsQueryKey(props),
      queryFn: ({ pageParam }) => fetchGlobalActivity({ pageParam }, props),
      getNextPageParam: (lastPage) => lastPage.pageParam,
      staleTime: USER_ACTIVITY_STALE_TIME,
      cacheTime: USER_ACTIVITY_CACHE_TIME,
      enabled: props.apiEnabled,
    });

  const allThreads = data?.pages
    ? data.pages.flatMap((page) => page.data.threads || [])
    : [];

  return {
    data: allThreads,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isLoading,
    isError,
  };
};

export default useFetchGlobalActivityQuery;
