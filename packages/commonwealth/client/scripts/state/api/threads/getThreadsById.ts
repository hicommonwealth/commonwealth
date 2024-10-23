import { trpc } from 'client/scripts/utils/trpcClient';

const THREAD_STALE_TIME = 5000; // 5 seconds

interface GetThreadsByIdProps {
  community_id: string;
  thread_ids: number[];
  apiCallEnabled?: boolean;
}

const useGetThreadsByIdQuery = ({
  community_id,
  thread_ids = [],
  apiCallEnabled,
}: GetThreadsByIdProps) => {
  return trpc.thread.getThreadsById.useQuery(
    {
      community_id,
      thread_ids: thread_ids.join(','),
    },
    {
      staleTime: THREAD_STALE_TIME,
      enabled: apiCallEnabled,
    },
  );
};

export default useGetThreadsByIdQuery;
