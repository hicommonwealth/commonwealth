import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import app from 'state';
import { ApiEndpoints } from 'state/api/config';

const THREAD_STALE_TIME = 30 * 1_000; // 30 s

interface GetThreadsByIdProps {
  chainId: string;
  ids: number[];
}

const getThreadsById = async ({ chainId, ids }: GetThreadsByIdProps) => {
  const response = await axios.get(
    `${app.serverUrl()}${ApiEndpoints.FETCH_THREADS}`,
    {
      params: {
        chain: chainId,
        thread_ids: ids
      },
    }
  );

  // TODO: do we need to do this?
  // app.chainEntities.getRawEntities(app.activeChainId()),

  return response.data.result.map((t) => app.threads.modelFromServer(t));
};

const useGetThreadsByIdQuery = ({ chainId, ids }: GetThreadsByIdProps) => {
  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [ApiEndpoints.FETCH_THREADS, chainId, 'single', ...ids.sort((a, b) => a - b)],
    queryFn: () => getThreadsById({ chainId, ids }),
    staleTime: THREAD_STALE_TIME,
  });
};

export default useGetThreadsByIdQuery;
