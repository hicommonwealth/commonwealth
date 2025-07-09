import Thread from 'client/scripts/models/Thread';
import { trpc } from 'client/scripts/utils/trpcClient';

const THREAD_STALE_TIME = 5000; // 5 seconds

const useGetThreadByIdQuery = (thread_id: number, enabled = true) => {
  return trpc.thread.getThreadById.useQuery(
    { thread_id },
    {
      staleTime: THREAD_STALE_TIME,
      select: (data) => new Thread(data),
      enabled,
      retry: (failureCount, error) => {
        // Avoid retrying if unauthorized
        if (error?.data?.code === 'UNAUTHORIZED') return false;
        // Optional: limit retries to 2 times for other errors
        return failureCount < 2;
      },
    },
  );
};

export default useGetThreadByIdQuery;
