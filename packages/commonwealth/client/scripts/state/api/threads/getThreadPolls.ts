import Poll from 'client/scripts/models/Poll';
import Vote from 'client/scripts/models/Vote';
import moment from 'moment';
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
      select: (data) =>
        data.map(
          (poll) =>
            new Poll({
              ...poll,
              id: poll.id!,
              options: JSON.parse(poll.options),
              votes:
                poll.votes?.map(
                  (vote) =>
                    new Vote({
                      ...vote,
                      id: vote.id!,
                      created_at: vote.created_at,
                    }),
                ) || [],
              threadId: poll.thread_id,
              communityId: poll.community_id,
              createdAt: moment(poll.created_at),
              endsAt: moment(poll.ends_at),
            }),
        ),
    },
  );
};

export default useGetThreadPollsQuery;
