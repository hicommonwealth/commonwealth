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
    },
  );
};

export default useGetThreadByIdQuery;
