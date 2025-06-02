import { trpc } from 'utils/trpcClient';

const POLLS_STALE_TIME = 60 * 1000; // 1 minute

interface GetThreadPollsProps {
  threadId: number;
  apiCallEnabled: boolean;
}

const useGetThreadPollsQuery = ({
  threadId,
  apiCallEnabled,
}: GetThreadPollsProps) => {
  return trpc.poll.getPolls.useQuery(
    { thread_id: threadId },
    {
      enabled: apiCallEnabled,
      staleTime: POLLS_STALE_TIME,
    },
  );
};

export default useGetThreadPollsQuery;
