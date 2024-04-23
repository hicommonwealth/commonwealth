import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Thread from 'models/Thread';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';

const THREAD_STALE_TIME = 5000; // 5 seconds

interface GetThreadsByIdProps {
  communityId: string;
  ids: number[];
  apiCallEnabled?: boolean;
}

const getThreadsById = async ({
  communityId,
  ids,
}: GetThreadsByIdProps): Promise<Thread[]> => {
  const response = await axios.get(
    `${app.serverUrl()}${ApiEndpoints.FETCH_THREADS}`,
    {
      params: {
        community_id: communityId,
        thread_ids: ids,
      },
    },
  );

  return response.data.result.map((t) => new Thread(t));
};

const useGetThreadsByIdQuery = ({
  communityId,
  ids = [],
  apiCallEnabled,
}: GetThreadsByIdProps) => {
  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [
      ApiEndpoints.FETCH_THREADS,
      communityId,
      'single',
      ...ids.sort((a, b) => a - b),
    ],
    queryFn: () => getThreadsById({ communityId, ids }),
    staleTime: THREAD_STALE_TIME,
    enabled: apiCallEnabled,
  });
};

export default useGetThreadsByIdQuery;
