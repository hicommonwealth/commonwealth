import { useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import Thread from 'models/Thread';
import { ApiEndpoints, SERVER_URL } from 'state/api/config';
import { userStore } from 'state/ui/user';
import { formatActivityResponse } from './util';

const USER_ACTIVITY_STALE_TIME = 60 * 1_000; // 1 minute
const USER_ACTIVITY_CACHE_TIME = 5 * 60 * 1_000; // 5 minutes

interface CommonProps {
  apiEnabled?: boolean;
}

interface FetchUserActivityProps extends CommonProps {
  page: number;
  limit?: number;
  ApiEndpoints?: string;
}

const getFetchThreadsQueryKey = (props) => {
  const keys = [ApiEndpoints.FETCH_USER_ACTIVITY, props.limit];

  return keys;
};

const fetchUserActivity = async (
  { pageParam = 1 }: { pageParam?: number },
  props: FetchUserActivityProps,
): Promise<{
  data: { threads: Thread[] };
  pageParam: number | undefined;
}> => {
  const { limit, ApiEndpoints: url = ApiEndpoints.FETCH_USER_ACTIVITY } = props;

  const response = await axios.post(`${SERVER_URL}${url}`, {
    jwt: userStore.getState().jwt,
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

const useFetchUserActivityQuery = (props: FetchUserActivityProps) => {
  const { data, fetchNextPage, hasNextPage, isFetching, isLoading, isError } =
    useInfiniteQuery({
      queryKey: getFetchThreadsQueryKey(props),
      queryFn: ({ pageParam }) => fetchUserActivity({ pageParam }, props),
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

export default useFetchUserActivityQuery;
